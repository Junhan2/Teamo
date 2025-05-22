"use client"

import { useEffect, useState, useCallback, useRef } from "react"
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
import { CheckSquare, Calendar, Plus, BarChart3, ClipboardList, StickyNote, User, Users } from "lucide-react"

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
  
  // Tab refs for dynamic width calculation
  const myTabRef = useRef<HTMLButtonElement>(null)
  const teamTabRef = useRef<HTMLButtonElement>(null)

  // 통계 데이터 가져오기 (MY/TEAM 탭에 따라 다른 데이터)
  const fetchTodoStats = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      console.log('통계 데이터 가져오는 중...', activeTab);
      
      let query;
      
      if (activeTab === "my-todos") {
        // MY: 본인 할일만
        query = supabase
          .from('todos')
          .select('status')
          .eq('user_id', user.id);
      } else {
        // TEAM: 팀 전체 할일
        query = supabase
          .from('todos')
          .select('status, user_id');
      }
      
      const { data, error } = await query;
        
      if (error) {
        console.error('통계 데이터 가져오기 오류:', error);
        return;
      }
      
      const total = data.length;
      const completed = data.filter(todo => todo.status === 'completed').length;
      const inProgress = data.filter(todo => todo.status === 'in_progress').length;
      const pending = data.filter(todo => todo.status === 'pending').length;
      
      console.log('통계 업데이트:', { activeTab, total, completed, inProgress, pending });
      
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
  }, [supabase, user?.id, activeTab]);

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
        if (status === 'SUBSCRIBED') {
          console.log('실시간 구독 설정 완료');
        } else if (status === 'CLOSED') {
          console.log('구독이 정상적으로 종료됨');
        } else {
          console.error('대시보드 구독 실패:', status);
          // 에러 발생 시에만 통계 수동 업데이트
          setTimeout(() => fetchTodoStats(), 1000);
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

  // 탭 변경 시 통계 새로고침
  useEffect(() => {
    if (user?.id) {
      console.log('탭 변경됨:', activeTab);
      fetchTodoStats();
    }
  }, [activeTab, user?.id, fetchTodoStats]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-cool-25 via-gray-cool-50 to-gray-cool-100/50">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-gradient-to-r from-sky-400 to-sky-600 rounded-xl mx-auto mb-4 shadow-lg"></div>
            <div className="text-lg text-gray-cool-600 font-medium">Loading your tasks...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-cool-25 via-gray-cool-50 to-gray-cool-100/50">
      <Navbar user={user} />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-8">
          {/* 모바일에서는 할일 목록 섹션이 먼저 표시 */}
          <div className="w-full md:w-3/5 order-1 md:order-2 animate-fadeIn">
            <div className="mb-6 md:mb-0">
              <Tabs 
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full text-base"
              >
                <div className="flex justify-start mb-6">
                  <TabsList className="relative bg-white/80 backdrop-blur-sm border border-gray-cool-200 rounded-2xl p-1.5 h-auto shadow-sm">
                    {/* Animated background slider */}
                    <motion.div
                      className="absolute bg-white shadow-md rounded-xl"
                      initial={false}
                      animate={{
                        left: activeTab === 'my-todos' ? '6px' : `${(myTabRef.current?.offsetLeft || 0) + (myTabRef.current?.offsetWidth || 0)}px`,
                        width: activeTab === 'my-todos' 
                          ? `${myTabRef.current?.offsetWidth || 0}px`
                          : `${teamTabRef.current?.offsetWidth || 0}px`,
                        top: '6px',
                        bottom: '6px',
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                        mass: 0.8,
                      }}
                    />
                    
                    <TabsTrigger 
                      ref={myTabRef}
                      value="my-todos" 
                      className="relative z-10 rounded-xl transition-all duration-500 px-5 py-3 text-sm font-semibold flex items-center gap-2.5 bg-transparent border-transparent hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-current"
                    >
                      <motion.div
                        animate={{
                          color: activeTab === 'my-todos' ? '#475569' : '#94a3b8',
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <User size={16} />
                      </motion.div>
                      <motion.span
                        animate={{
                          color: activeTab === 'my-todos' ? '#374151' : '#94a3b8',
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        MY
                      </motion.span>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      ref={teamTabRef}
                      value="team-todos" 
                      className="relative z-10 rounded-xl transition-all duration-500 px-5 py-3 text-sm font-semibold flex items-center gap-2.5 bg-transparent border-transparent hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-current"
                    >
                      <motion.div
                        animate={{
                          color: activeTab === 'team-todos' ? '#475569' : '#94a3b8',
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <Users size={16} />
                      </motion.div>
                      <motion.span
                        animate={{
                          color: activeTab === 'team-todos' ? '#374151' : '#94a3b8',
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        TEAM
                      </motion.span>
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
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-cool-100 mb-6 hover:shadow-md transition-shadow duration-300" id="addTodoForm">
              <div className="p-6">
                <h2 className="text-sm font-semibold mb-5 text-gray-cool-700 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                    <ClipboardList className="w-4 h-4 text-sky-600" />
                  </div>
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
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-cool-100 p-6 hover:shadow-md transition-shadow duration-300" style={{ overflow: 'visible' }}>
              <h2 className="text-sm font-semibold mb-5 text-gray-cool-700 uppercase tracking-wider flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                </div>
                STATISTICS
              </h2>
              <div className="space-y-4">
                {/* Complete */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      </div>
                      <span className="text-sm font-semibold text-emerald-700">Complete</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-emerald-700">{todoStats.completed}</span>
                      <span className="text-sm text-emerald-600">/ {todoStats.total}</span>
                    </div>
                  </div>
                  <div className="w-full bg-emerald-200/30 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700 ease-out"
                      style={{
                        width: `${todoStats.total > 0 ? (todoStats.completed / todoStats.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Doing */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      </div>
                      <span className="text-sm font-semibold text-blue-700">Doing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-700">{todoStats.inProgress}</span>
                      <span className="text-sm text-blue-600">/ {todoStats.total}</span>
                    </div>
                  </div>
                  <div className="w-full bg-blue-200/30 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-700 ease-out"
                      style={{
                        width: `${todoStats.total > 0 ? (todoStats.inProgress / todoStats.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Not yet */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      </div>
                      <span className="text-sm font-semibold text-amber-700">Not yet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-amber-700">{todoStats.pending}</span>
                      <span className="text-sm text-amber-600">/ {todoStats.total}</span>
                    </div>
                  </div>
                  <div className="w-full bg-amber-200/30 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700 ease-out"
                      style={{
                        width: `${todoStats.total > 0 ? (todoStats.pending / todoStats.total) * 100 : 0}%`,
                      }}
                    ></div>
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
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white/90 backdrop-blur-md rounded-full shadow-2xl border border-gray-cool-100 p-2 flex items-center gap-2">
          <Link href="/dashboard">
            <Button
              variant="default"
              size="sm"
              className="rounded-full bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-600 hover:to-sky-700 shadow-lg flex items-center gap-2 px-5 py-2.5 h-11 relative border-0 font-semibold"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Tasks</span>
              {/* Active indicator */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse"></div>
            </Button>
          </Link>
          
          <Link href="/calendar">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full bg-white/80 border border-gray-cool-200 text-gray-cool-700 hover:bg-gray-cool-50 hover:border-gray-cool-300 shadow-sm flex items-center gap-2 px-5 py-2.5 h-11 font-medium"
            >
              <Calendar className="w-4 h-4" />
              <span>Calendar</span>
            </Button>
          </Link>
          
          <Link href="/memos">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full bg-white/80 border border-gray-cool-200 text-gray-cool-700 hover:bg-gray-cool-50 hover:border-gray-cool-300 shadow-sm flex items-center gap-2 px-5 py-2.5 h-11 font-medium"
            >
              <StickyNote className="w-4 h-4" />
              <span>Memos</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}