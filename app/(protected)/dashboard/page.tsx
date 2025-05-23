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
    const checkSessionAndProfile = async () => {
      try {
        setLoading(true)
        console.log('🔍 Dashboard: Checking session...')
        
        // 세션 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          router.push('/auth/login')
          return
        }
        
        if (!session) {
          console.log('❌ No session found')
          router.push('/auth/login')
          return
        }
        
        console.log('✅ Session found:', session.user.email)
        
        // 프로필 확인 또는 생성
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profileError) {
          if (profileError.code === 'PGRST116') {
            // 프로필이 없으므로 생성
            console.log('📝 Creating user profile...')
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([{
                id: session.user.id,
                email: session.user.email!,
                full_name: session.user.user_metadata?.full_name || null,
                avatar_url: session.user.user_metadata?.avatar_url || null
              }])
              .select()
              .single()
            
            if (createError) {
              console.error('❌ Profile creation error:', createError)
              console.error('Error details:', {
                code: createError.code,
                message: createError.message,
                details: createError.details,
                hint: createError.hint
              })
              // 기본 프로필 정보라도 설정
              setUser({
                id: session.user.id,
                email: session.user.email!,
                full_name: session.user.user_metadata?.full_name || null,
                avatar_url: session.user.user_metadata?.avatar_url || null
              })
            } else if (newProfile) {
              console.log('✅ Profile created')
              setUser(newProfile)
            }
          } else {
            console.error('❌ Profile fetch error:', profileError)
          }
        } else {
          console.log('✅ Profile loaded')
          setUser(profile)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('💥 Dashboard error:', error)
        setLoading(false)
        router.push('/auth/login')
      }
    }
    
    checkSessionAndProfile()
    
    // Auth 상태 변화 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔍 Auth state change:', event, session?.user?.email)
        
        if (event === 'SIGNED_OUT') {
          setUser(null)
          router.push('/auth/login')
        } else if (event === 'SIGNED_IN' && session) {
          // 새로 로그인한 경우 프로필 다시 확인
          checkSessionAndProfile()
        }
      }
    )
    
    return () => {
      subscription.unsubscribe()
    }
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
      <div className="flex min-h-screen items-center justify-center" style={{background: 'linear-gradient(135deg, #FCFCFD 0%, #F9F9FB 50%, rgba(239, 241, 245, 0.5) 100%)'}}>
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-gradient-to-r from-sky-400 to-sky-600 rounded-xl mx-auto mb-4 shadow-lg"></div>
            <div className="text-lg font-medium" style={{color: '#4A5578'}}>Loading your tasks...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #FCFCFD 0%, #F9F9FB 50%, rgba(239, 241, 245, 0.5) 100%)'}}>
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
                  <TabsList className="relative bg-[#F9F9FB] border border-[#DCDFEA] rounded-2xl p-1.5 h-auto shadow-sm">
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
                          color: activeTab === 'my-todos' ? '#404968' : '#7D89AF',
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <User size={16} />
                      </motion.div>
                      <motion.span
                        animate={{
                          color: activeTab === 'my-todos' ? '#404968' : '#7D89AF',
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
                          color: activeTab === 'team-todos' ? '#404968' : '#7D89AF',
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <Users size={16} />
                      </motion.div>
                      <motion.span
                        animate={{
                          color: activeTab === 'team-todos' ? '#404968' : '#7D89AF',
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
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border mb-6 hover:shadow-md transition-shadow duration-300" style={{borderColor: '#DCDFEA'}} id="addTodoForm">
              <div className="p-6">
                <h2 className="text-sm font-semibold mb-5 uppercase tracking-wider flex items-center gap-2" style={{color: '#404968'}}>
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
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border p-6 hover:shadow-md transition-shadow duration-300" style={{borderColor: '#DCDFEA', overflow: 'visible'}}>
              <h2 className="text-sm font-semibold mb-5 uppercase tracking-wider flex items-center gap-2" style={{color: '#404968'}}>
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                </div>
                STATISTICS
              </h2>
              <div className="space-y-3">
                {/* Complete */}
                <div className="relative rounded-xl overflow-hidden bg-emerald-50 border border-emerald-200 h-9">
                  <div 
                    className="absolute inset-0 bg-[#d1fae5] transition-all duration-700 ease-out"
                    style={{
                      width: `${todoStats.total > 0 ? (todoStats.completed / todoStats.total) * 100 : 0}%`,
                    }}
                  ></div>
                  <div className="relative z-10 h-full flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#059669]"></div>
                      <span className="text-sm font-medium text-[#065f46]">Complete</span>
                    </div>
                    <span className="text-sm font-semibold text-[#065f46]">
                      {todoStats.completed}/{todoStats.total} ({todoStats.total > 0 ? Math.round((todoStats.completed / todoStats.total) * 100) : 0}%)
                    </span>
                  </div>
                </div>
                
                {/* Doing */}
                <div className="relative rounded-xl overflow-hidden bg-blue-50 border border-blue-200 h-9">
                  <div 
                    className="absolute inset-0 bg-[#dbeafe] transition-all duration-700 ease-out"
                    style={{
                      width: `${todoStats.total > 0 ? (todoStats.inProgress / todoStats.total) * 100 : 0}%`,
                    }}
                  ></div>
                  <div className="relative z-10 h-full flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#2563eb]"></div>
                      <span className="text-sm font-medium text-[#1e40af]">Doing</span>
                    </div>
                    <span className="text-sm font-semibold text-[#1e40af]">
                      {todoStats.inProgress}/{todoStats.total} ({todoStats.total > 0 ? Math.round((todoStats.inProgress / todoStats.total) * 100) : 0}%)
                    </span>
                  </div>
                </div>
                
                {/* Not yet */}
                <div className="relative rounded-xl overflow-hidden bg-amber-50 border border-amber-200 h-9">
                  <div 
                    className="absolute inset-0 bg-[#fef3c7] transition-all duration-700 ease-out"
                    style={{
                      width: `${todoStats.total > 0 ? (todoStats.pending / todoStats.total) * 100 : 0}%`,
                    }}
                  ></div>
                  <div className="relative z-10 h-full flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#d97706]"></div>
                      <span className="text-sm font-medium text-[#92400e]">Not yet</span>
                    </div>
                    <span className="text-sm font-semibold text-[#92400e]">
                      {todoStats.pending}/{todoStats.total} ({todoStats.total > 0 ? Math.round((todoStats.pending / todoStats.total) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-6" style={{ overflow: 'visible' }}>
                {user && <ContributionGraph userId={user.id} />}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* 화면 중앙 하단 플로팅 버튼 영역 */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white/90 backdrop-blur-md rounded-full shadow-2xl border p-2 flex items-center gap-2" style={{borderColor: '#EFF1F5'}}>
          <Link href="/dashboard">
            <Button
              variant="default"
              size="sm"
              className="rounded-full bg-gray-cool-700 text-white hover:bg-gray-cool-800 shadow-lg flex items-center gap-2 px-5 py-2.5 h-11 relative border-0 font-bold text-sm"
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
              className="rounded-full bg-white/80 border shadow-sm flex items-center gap-2 px-5 py-2.5 h-11 font-normal transition-colors duration-200 text-sm"
              style={{borderColor: '#DCDFEA', color: '#404968'}}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendar</span>
            </Button>
          </Link>
          
          <Link href="/memos">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full bg-white/80 border shadow-sm flex items-center gap-2 px-5 py-2.5 h-11 font-normal transition-colors duration-200 text-sm"
              style={{borderColor: '#DCDFEA', color: '#404968'}}
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