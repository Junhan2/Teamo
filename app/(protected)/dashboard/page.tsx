"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TeamTodoList from "@/components/TeamTodoList"
import AddTodoForm from "@/components/AddTodoForm"
import Navbar from "@/components/Navbar"
import ContributionGraph from "@/components/ContributionGraph/ContributionGraph"
import { motion } from "framer-motion"
import { CheckSquare, Calendar, Plus, BarChart3, ClipboardList, StickyNote } from "lucide-react"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState("my-todos")
  const [todoStats, setTodoStats] = useState({
    completed: 0,
    inProgress: 0,
    pending: 0,
    total: 0
  })
  const router = useRouter()
  const supabase = createClient()

  // 통계 데이터 가져오기
  const fetchTodoStats = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      console.log('통계 데이터 가져오는 중...');
      const { data, error } = await supabase
        .from('todos')
        .select('status')
        .eq('user_id', user.id);
        
      if (error) {
        console.error('통계 데이터 가져오기 오류:', error);
        return;
      }
      
      const total = data.length;
      const completed = data.filter(todo => todo.status === 'completed').length;
      const inProgress = data.filter(todo => todo.status === 'in_progress').length;
      const pending = data.filter(todo => todo.status === 'pending').length;
      
      console.log('통계 업데이트:', { total, completed, inProgress, pending });
      
      // 명시적 상태 업데이트 (리렌더링 보장)
      setTodoStats(prev => {
        // 이전 상태와 새 상태가 다를 때만 업데이트
        if (prev.completed !== completed || 
            prev.inProgress !== inProgress || 
            prev.pending !== pending ||
            prev.total !== total) {
          console.log('통계 상태 실제 변경 감지됨');
          return {
            completed,
            inProgress,
            pending,
            total
          };
        }
        return prev; // 변경 없으면 이전 상태 유지
      });
    } catch (err) {
      console.error('통계 가져오기 중 오류:', err);
    }
  }, [supabase, user?.id]);

  // 할 일 목록 새로고침 함수
  const refreshTodos = useCallback(() => {
    console.log('모든 데이터 새로고침');
    // 할일 목록 새로고침 트리거
    setRefreshTrigger(prev => prev + 1);
    // 통계 데이터도 즉시 새로고침
    if (user?.id) {
      fetchTodoStats();
    }
  }, [fetchTodoStats, user?.id]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
          router.push('/auth/login')
          return
        }

        // 사용자 프로필 정보 가져오기
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          
          // 프로필이 없으면 생성 시도
          if (profileError.code === 'PGRST116') {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([{ 
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name,
                avatar_url: session.user.user_metadata?.avatar_url
              }])
              .select()
              .single()
              
            if (!createError && newProfile) {
              setUser(newProfile)
            } else {
              console.error('Error creating profile:', createError)
            }
          }
          return
        }

        setUser(profile)
      } catch (error) {
        console.error('Error checking auth session:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [router, supabase])
  
  // 실시간 할일 업데이트 구독 및 통계 업데이트
  useEffect(() => {
    if (!user?.id) return;

    console.log('실시간 구독 설정 중...');
    
    // 즉시 초기 통계 데이터 가져오기
    fetchTodoStats();
    
    // 최신 통계 상태를 저장할 변수
    let statsUpdateTimeout: NodeJS.Timeout | null = null;
    
    // 통계 업데이트를 디바운스하는 함수 - 여러 이벤트가 연속으로 발생할 때 한 번만 실행
    const refreshStatsWithDebounce = () => {
      if (statsUpdateTimeout) {
        clearTimeout(statsUpdateTimeout);
      }
      
      console.log('통계 새로고침 예약...');
      statsUpdateTimeout = setTimeout(() => {
        console.log('통계 데이터 새로고침 실행');
        fetchTodoStats();
        statsUpdateTimeout = null;
      }, 300);
    };
    
    // 더 빠른 업데이트를 위한 즉각적인 상태 업데이트 함수
    const updateStatsFromPayload = (payload: any) => {
      if (!payload) return;
      
      const eventType = payload.eventType;
      
      // UI를 즉시 업데이트하기 위한 로직
      if (eventType === 'INSERT' && payload.new) {
        // 새 할일 추가
        const newStatus = payload.new.status;
        setTodoStats(prev => {
          const updated = {...prev};
          updated.total += 1;
          if (newStatus === 'completed') updated.completed += 1;
          else if (newStatus === 'in_progress') updated.inProgress += 1;
          else if (newStatus === 'pending') updated.pending += 1;
          return updated;
        });
      } 
      else if (eventType === 'UPDATE' && payload.new && payload.old) {
        // 할일 상태 변경
        const oldStatus = payload.old.status;
        const newStatus = payload.new.status;
        
        setTodoStats(prev => {
          const updated = {...prev};
          // 이전 상태에서 카운트 감소
          if (oldStatus === 'completed') updated.completed -= 1;
          else if (oldStatus === 'in_progress') updated.inProgress -= 1;
          else if (oldStatus === 'pending') updated.pending -= 1;
          
          // 새 상태로 카운트 증가
          if (newStatus === 'completed') updated.completed += 1;
          else if (newStatus === 'in_progress') updated.inProgress += 1;
          else if (newStatus === 'pending') updated.pending += 1;
          
          return updated;
        });
      }
      else if (eventType === 'DELETE' && payload.old) {
        // 할일 삭제
        const oldStatus = payload.old.status;
        setTodoStats(prev => {
          const updated = {...prev};
          updated.total -= 1;
          if (oldStatus === 'completed') updated.completed -= 1;
          else if (oldStatus === 'in_progress') updated.inProgress -= 1;
          else if (oldStatus === 'pending') updated.pending -= 1;
          return updated;
        });
      }
      
      // 이벤트가 발생했으므로 실제 DB와 동기화하기 위해 새로고침 예약
      refreshStatsWithDebounce();
    }
    
    // 실시간 구독 설정 - 고유한 채널 ID 생성하여 중복 방지
    const dashboardChannel = `dashboard-stats-${user.id}-${Date.now()}`;
    const todoChannel = supabase
      .channel(dashboardChannel)
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'todos',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('대시보드 실시간 변경 감지:', payload.eventType, payload);
        
        // 빠른 UI 업데이트를 위해 즉시 상태 업데이트
        updateStatsFromPayload(payload);
        
        // UI를 즉시 업데이트하고 디바운스된 통계 새로고침 사용
        // 변경 감지시 업데이트만 트리거하고 디바운스 함수가 처리함
      })
      .subscribe((status) => {
        console.log('대시보드 구독 상태:', status);
        if (status !== 'SUBSCRIBED') {
          console.error('대시보드 구독 실패:', status);
          // 에러 발생 시 통계 수동 업데이트
          fetchTodoStats();
        }
      });
    
    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      console.log('대시보드 구독 정리 중...');
      try {
        // 안전하게 구독 해제
        if (todoChannel) {
          supabase.removeChannel(todoChannel);
        }
      } catch (err) {
        console.error('구독 해제 중 오류:', err);
      }
    };
  }, [user?.id, supabase, fetchTodoStats]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#292C33]"></div>
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        </div>
        <div className="text-lg text-white relative z-10 font-medium">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light-background">
      <Navbar user={user} />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex flex-col md:flex-row gap-8">
          {/* 모바일에서는 할일 목록 섹션이 먼저 표시 */}
          <div className="w-full md:w-3/5 order-1 md:order-2 animate-fadeIn">
            <div className="mb-6 md:mb-0">
              <Tabs 
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full text-base"
              >
                <div className="flex justify-start mb-3">
                  <TabsList className="bg-gray-100 rounded-full p-1 h-auto">
                    <TabsTrigger 
                      value="my-todos" 
                      className={`rounded-full transition-all duration-200 px-6 py-2 text-sm font-medium font-dm-sans data-[state=active]:bg-[#525252] data-[state=active]:text-white data-[state=active]:shadow-sm ${activeTab === 'my-todos' ? 'bg-[#525252] text-white shadow-sm' : 'bg-transparent text-light-primary hover:bg-white/50'}`}
                    >
                      MY
                    </TabsTrigger>
                    <TabsTrigger 
                      value="team-todos" 
                      className={`rounded-full transition-all duration-200 px-6 py-2 text-sm font-medium font-dm-sans data-[state=active]:bg-[#525252] data-[state=active]:text-white data-[state=active]:shadow-sm ${activeTab === 'team-todos' ? 'bg-[#525252] text-white shadow-sm' : 'bg-transparent text-light-primary hover:bg-white/50'}`}
                    >
                      TEAM
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="my-todos" className="focus:outline-none">
                  <TeamTodoList 
                    key={`my-todos-${activeTab}`}
                    userId={user?.id} 
                    filter="my" 
                    refreshTrigger={refreshTrigger}
                    onDelete={() => {
                      console.log('할일 삭제/상태변경 콜백 - 통계 즉시 업데이트');
                      // 즉시 통계 업데이트
                      fetchTodoStats();
                    }}
                  />
                </TabsContent>
                
                <TabsContent value="team-todos" className="focus:outline-none">
                  <TeamTodoList 
                    key={`team-todos-${activeTab}`}
                    userId={user?.id} 
                    filter="team" 
                    refreshTrigger={refreshTrigger}
                    onDelete={() => {
                      console.log('팀 할일 삭제/상태변경 콜백 - 통계 즉시 업데이트');
                      // 즉시 통계 업데이트
                      fetchTodoStats();
                    }}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          {/* 할일 추가 및 통계 섹션 */}
          <div className="w-full md:w-2/5 order-2 md:order-1 animate-fadeIn flex flex-col">
            {/* 할일 추가 섹션 */}
            <div className="bg-light-input rounded-xl overflow-hidden shadow-md border border-light-border mb-6" id="addTodoForm">
              <div className="p-6">
                <h2 className="text-sm font-medium mb-4 text-light-primary uppercase tracking-[.1em] leading-[1.5rem] font-[600] font-fira-mono flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  ADD NEW TASK
                </h2>
                {user && (
                  <AddTodoForm 
                    userId={user.id} 
                    onTodoAdded={() => {
                      refreshTodos();
                      setActiveTab("my-todos");
                    }} 
                  />
                )}
              </div>
            </div>
            
            {/* 통계 섹션 */}
            <div className="bg-light-input rounded-xl overflow-hidden shadow-md border border-light-border p-6" style={{ overflow: 'visible' }}>
              <h2 className="text-sm font-medium mb-4 text-light-primary uppercase tracking-[.1em] leading-[1.5rem] font-[600] font-fira-mono flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                STATISTICS
              </h2>
              <div className="space-y-4">
                {/* Complete */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-200 bg-emerald-50">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-sm font-medium text-emerald-700">Complete</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-emerald-600">{todoStats.completed}</span>
                    <span className="text-xs text-emerald-500">/ {todoStats.total}</span>
                  </div>
                </div>
                
                {/* Doing */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-blue-200 bg-blue-50">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium text-blue-700">Doing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-blue-600">{todoStats.inProgress}</span>
                    <span className="text-xs text-blue-500">/ {todoStats.total}</span>
                  </div>
                </div>
                
                {/* Not yet */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className="text-sm font-medium text-amber-700">Not yet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-amber-600">{todoStats.pending}</span>
                    <span className="text-xs text-amber-500">/ {todoStats.total}</span>
                  </div>
                </div>
              </div>
              <div className="mt-8" style={{ overflow: 'visible' }}>
                {user && <ContributionGraph userId={user.id} />}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* 화면 중앙 하단 플로팅 버튼 영역 */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2">
        <Link href="/dashboard">
          <Button
            variant="default"
            size="sm"
            className="rounded-full shadow-lg bg-[#525252] text-white hover:bg-[#404040] flex items-center gap-2 px-4 py-2 h-10 relative outline outline-1 outline-light-border outline-offset-[-1px]"
          >
            <CheckSquare className="w-4 h-4" />
            <span className="font-medium">Tasks</span>
            {/* Active indicator */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#3fcf8e] rounded-full border-2 border-light-background"></div>
          </Button>
        </Link>
        
        <Link href="/calendar">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full shadow-lg bg-light-background border border-light-border text-light-primary hover:bg-gray-100 flex items-center gap-2 px-4 py-2 h-10 outline outline-1 outline-light-border outline-offset-[-1px]"
          >
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Calendar</span>
          </Button>
        </Link>
        
        <Link href="/memos">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full shadow-lg bg-light-background border border-light-border text-light-primary hover:bg-gray-100 flex items-center gap-2 px-4 py-2 h-10 outline outline-1 outline-light-border outline-offset-[-1px]"
          >
            <StickyNote className="w-4 h-4" />
            <span className="font-medium">Memos</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}