"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle, 
  Clock, 
  Trash2, 
  CheckSquare, 
  ChevronDown, 
  ListTodo, 
  Clock3,
  Activity,
  Heart,
  Star,
  ThumbsUp,
  Sparkles
} from "lucide-react"
import { format, differenceInCalendarDays } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { createPortal } from "react-dom"

interface Todo {
  id: string
  title: string
  description: string | null
  due_date: string | null
  status: "pending" | "in_progress" | "completed"
  user_id: string
  team_id: string
  created_at: string
  updated_at: string
  user: {
    full_name: string | null
    email: string
  }
}

interface TeamTodoListProps {
  userId?: string
  filter: "my" | "team"
  refreshTrigger?: number
  onDelete?: () => void  // 할일 삭제 또는 상태 변경 시 호출할 콜백 (통계 업데이트용)
}

interface CompletionEffectPosition {
  x: number
  y: number
  width: number
  height: number
}

const snappyTransition = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 1,
}

// 날짜로부터 남은 일수 계산 함수
const calculateDaysLeft = (dueDate: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // 시간 제거
  const targetDate = new Date(dueDate)
  targetDate.setHours(0, 0, 0, 0) // 시간 제거
  
  return differenceInCalendarDays(targetDate, today)
}

// 사용자 ID 기반 색상 선택 함수
const getUserColor = (userId: string, currentUserId: string | undefined, type: 'badge' | 'container' | 'dot') => {
  // 사용자 ID의 마지막 6자리를 가져와 고유한 값으로 사용
  const hash = userId.substring(Math.max(0, userId.length - 6))
  // 해시 값을 0-5 사이의 숫자로 변환 (6가지 색상 사용)
  const colorIndex = parseInt(hash, 16) % 6
  
  // 사용 가능한 색상 조합 (배지, 컨테이너, 도트 색상)
  const colorSchemes = [
    { badge: 'bg-blue-900/10 text-blue-200/70 border-blue-700/10', container: 'bg-blue-950/40 border-blue-800/30', dot: 'bg-blue-400' },
    { badge: 'bg-purple-900/10 text-purple-200/70 border-purple-700/10', container: 'bg-purple-950/40 border-purple-800/30', dot: 'bg-purple-400' },
    { badge: 'bg-green-900/10 text-green-200/70 border-green-700/10', container: 'bg-green-950/40 border-green-800/30', dot: 'bg-green-400' },
    { badge: 'bg-amber-900/10 text-amber-200/70 border-amber-700/10', container: 'bg-amber-950/40 border-amber-800/30', dot: 'bg-amber-400' },
    { badge: 'bg-pink-900/10 text-pink-200/70 border-pink-700/10', container: 'bg-pink-950/40 border-pink-800/30', dot: 'bg-pink-400' },
    { badge: 'bg-cyan-900/10 text-cyan-200/70 border-cyan-700/10', container: 'bg-cyan-950/40 border-cyan-800/30', dot: 'bg-cyan-400' }
  ]
  
  // 내 태스크인 경우 별도 처리
  // 직접 props로 받은 현재 사용자 ID와 비교 (순수 함수 방식)
  if (userId === currentUserId && type === 'container') {
    return 'bg-indigo-950/40 border-indigo-800/30'
  }
  
  return colorSchemes[colorIndex][type]
}

// 컴포넌트 선언 - 정적 참조 객체 제거
const TeamTodoList = ({ userId, filter, refreshTrigger, onDelete }: TeamTodoListProps) => {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [showCompletionEffect, setShowCompletionEffect] = useState(false)
  const [isBrowser, setIsBrowser] = useState(false)
  const [completionPosition, setCompletionPosition] = useState<CompletionEffectPosition>({ 
    x: 0, 
    y: 0, 
    width: 0, 
    height: 0 
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  
  // 브라우저 환경 감지 (클라이언트 사이드 렌더링 확인)
  useEffect(() => {
    setIsBrowser(true)
  }, [])
  
  // 완료 효과를 표시할 때 짧은 시간동안만 보여주기
  useEffect(() => {
    if (showCompletionEffect) {
      // 이펙트 표시 시 body에 overflow-hidden 추가
      if (typeof document !== 'undefined') {
        document.body.classList.add('overflow-hidden');
      }
      
      // 정확히 0.8초 후에 완료 효과 숨기기 (애니메이션 시간 고려)
      const timer = setTimeout(() => {
        setShowCompletionEffect(false);
        if (typeof document !== 'undefined') {
          document.body.classList.remove('overflow-hidden');
        }
      }, 800)
      
      return () => clearTimeout(timer)
    }
  }, [showCompletionEffect])

  const fetchTodos = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('todos')
        .select(`
          *,
          user:profiles(full_name, email)
        `)
        .order('due_date', { ascending: true, nullsLast: true })
      
      if (filter === "my" && userId) {
        query = query.eq('user_id', userId)
      }
      
      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Error details:', error)
        throw error
      }
      
      setTodos(data || [])
    } catch (error) {
      console.error('Error fetching todos:', error)
      // 오류가 발생해도 빈 배열 설정하여 UI가 깨지지 않게 함
      setTodos([])
    } finally {
      setLoading(false)
    }
  }

  const updateTodoStatus = async (id: string, status: string, event: React.MouseEvent<HTMLDivElement> | null = null) => {
    try {
      // 상태 업데이트를 수행하고 업데이트된 레코드를 반환
      const { data, error } = await supabase
        .from('todos')
        .update({ status, updated_at: new Date().toISOString() }) // 업데이트 시간도 갱신
        .eq('id', id)
        .select() // 업데이트된 데이터 반환
      
      if (error) {
        console.error('Error details:', error)
        throw error
      }
      
      console.log('Todo 상태 업데이트 성공:', { id, status });
      
      // 상태 업데이트 후 UI 즉시 갱신
      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, status } : todo
      ))
      
      // 완료 상태로 변경되었을 때 귀여운 이펙트 표시
      if (status === 'completed') {
        // document.body에 이펙트를 위한 클래스 추가
        document.body.classList.add('overflow-hidden');
        
        // 클릭 이벤트의 위치 가져오기 - 이벤트가 있는 경우에만
        if (event && event.currentTarget) {
          try {
            // 이벤트 타겟(완료 버튼)의 좌표를 정확히 가져옴
            const rect = event.currentTarget.getBoundingClientRect();
            console.log('Completion effect position:', { 
              x: rect.left, 
              y: rect.top, 
              width: rect.width, 
              height: rect.height 
            });
            
            // 버튼 위치에서 이펙트가 시작되도록 설정
            setCompletionPosition({
              x: rect.left + rect.width / 2, // 버튼의 중앙 X 좌표
              y: rect.top + rect.height / 2, // 버튼의 중앙 Y 좌표
              width: rect.width,
              height: rect.height
            });
          } catch (rectError) {
            console.error('Failed to get element rect:', rectError);
            // 이벤트 좌표를 직접 사용하는 대체 방법
            const x = event.clientX || window.innerWidth / 2;
            const y = event.clientY || window.innerHeight / 2;
            setCompletionPosition({
              x,
              y,
              width: 0,
              height: 0
            });
          }
        } else {
          // 이벤트가 없으면 화면 중앙을 사용
          setCompletionPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            width: 0,
            height: 0
          });
        }
        
        setShowCompletionEffect(true);
        toast.success('Task completed! ✨', {
          position: 'top-center'
        });
      } else if (status === 'in_progress') {
        toast('Task status changed to in progress.', {
          icon: '🚀',
          position: 'top-center'
        })
      }
      
      // 상태 변경 후 콜백 호출 (상위 컴포넌트에서 통계 업데이트를 할 수 있도록)
      if (onDelete) {
        console.log('Todo 상태 변경 후 콜백 호출 - 통계 즉시 업데이트');
        onDelete();
      }
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      // 먼저 할일 데이터를 가져와 로컬에 저장
      const { data: todoData, error: fetchError } = await supabase
        .from('todos')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError) {
        console.error('할일 정보 가져오기 오류:', fetchError);
        throw fetchError;
      }
        
      console.log('삭제할 할일 정보:', todoData);
      
      // 할일 삭제
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error details:', error);
        throw error;
      }
      
      // 삭제 후 UI 즉시 갱신
      setTodos(todos.filter(todo => todo.id !== id));
      
      // 부모 컴포넌트에 삭제 이벤트 알림 (통계 업데이트용)
      if (onDelete) {
        console.log('Todo 삭제 후 콜백 호출 - 통계 즉시 업데이트');
        onDelete();
      }
      
      // 강제로 실시간 이벤트 발생
      if (userId) {
        try {
          // 직접 통계를 갱신하기 위한 임시 요청 - count() 대신 id만 조회
          const { data, error: countError } = await supabase
            .from('todos')
            .select('id')
            .eq('user_id', userId);
            
          console.log('삭제 후 할일 수 확인:', data?.length || 0);
            
          if (countError) {
            console.error('Count error:', countError);
          }
          
          // 할일 상태 카운트 요청 (실시간 이벤트를 확실하게 트리거하기 위해)
          const { error: statsError } = await supabase
            .from('todos')
            .select('status')
            .eq('user_id', userId);
            
          if (statsError) {
            console.error('Stats error:', statsError);
          }
        } catch (innerError) {
          console.error('내부 통계 업데이트 오류:', innerError);
        }
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  }

  useEffect(() => {
    fetchTodos()
    
    // 실시간 구독 설정
    let todoSubscription: any = null;
    
    if (userId) {
      // 실시간 구독 설정 - todos 테이블의 변경사항 감지
      // 고유한 채널 이름 사용 (중복 문제 방지)
      const todoListChannel = `todolist-${filter}-${userId || 'all'}-${Date.now()}`;
      const subscription = supabase
        .channel(todoListChannel)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'todos',
          ...(filter === "my" && userId ? { filter: `user_id=eq.${userId}` } : {})
        }, (payload) => {
          console.log('실시간 변경 감지:', payload);
          
          // 변경 이벤트에 따라 처리
          if (payload.eventType === 'INSERT') {
            const newTodo = payload.new as Todo;
            // 상태 필터가 있고, 새 항목이 필터와 일치하지 않으면 무시
            if (statusFilter && newTodo.status !== statusFilter) return;
            
            // 새 항목 추가
            fetchTodos();
          } else if (payload.eventType === 'UPDATE') {
            const updatedTodo = payload.new as Todo;
            
            // 상태 필터가 있고, 업데이트된 항목이 필터와 일치하지 않으면 목록에서 제거
            if (statusFilter && updatedTodo.status !== statusFilter) {
              setTodos(prevTodos => prevTodos.filter(todo => todo.id !== updatedTodo.id));
              return;
            }
            
            // 현재 목록에 있는 항목인지 확인
            const existingIndex = todos.findIndex(todo => todo.id === updatedTodo.id);
            
            if (existingIndex >= 0) {
              // 목록에 있으면 업데이트
              setTodos(prevTodos => {
                const newTodos = [...prevTodos];
                newTodos[existingIndex] = { 
                  ...newTodos[existingIndex], 
                  ...updatedTodo,
                  user: newTodos[existingIndex].user // 사용자 정보 유지
                };
                return newTodos;
              });
            } else {
              // 목록에 없지만 상태 필터에 맞으면 다시 불러오기
              fetchTodos();
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedTodo = payload.old as Todo;
            // 삭제된 항목 제거
            setTodos(prevTodos => prevTodos.filter(todo => todo.id !== deletedTodo.id));
          }
        })
        .subscribe();
      
      todoSubscription = subscription;
    }
    
    // 클린업 함수 - 구독 해제
    return () => {
      console.log('TodoList 구독 정리 중...');
      try {
        // 안전하게 구독 해제
        if (todoSubscription) {
          supabase.removeChannel(todoSubscription);
        }
      } catch (err) {
        console.error('TodoList 구독 해제 중 오류:', err);
      }
    };
  }, [userId, filter, statusFilter, refreshTrigger, supabase]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-[0_0_10px_rgba(234,179,8,0.5)] border border-yellow-400/30'
      case 'in_progress':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)] border border-blue-400/30'
      case 'completed':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)] border border-green-400/30'
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'in_progress':
        return 'In Progress'
      case 'completed':
        return 'Complete'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 text-white">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin mb-2"></div>
          <p className="text-lg font-medium">Loading Tasks...</p>
        </div>
      </div>
    )
  }

  // 리액트의 순수함수 방식으로 변경 - 파일 끝

return (
    <div className="text-white" ref={containerRef}>
      <div className="flex flex-wrap gap-3 mb-6">
        <Button 
          variant={statusFilter === null ? "default" : "outline"} 
          size="sm"
          onClick={() => setStatusFilter(null)}
          className={`${statusFilter === null ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'button-ghost hover:shadow-[0_0_10px_rgba(99,102,241,0.3)]'} text-base px-5 py-3 h-11 rounded-lg transition-all duration-200 font-medium`}
        >
          All
        </Button>
        <Button 
          variant={statusFilter === "pending" ? "default" : "outline"} 
          size="sm"
          onClick={() => setStatusFilter("pending")}
          className={`${statusFilter === "pending" ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'button-ghost hover:shadow-[0_0_10px_rgba(234,179,8,0.3)]'} text-base px-5 py-3 h-11 rounded-lg transition-all duration-200 font-medium`}
        >
          Pending
        </Button>
        <Button 
          variant={statusFilter === "in_progress" ? "default" : "outline"} 
          size="sm"
          onClick={() => setStatusFilter("in_progress")}
          className={`${statusFilter === "in_progress" ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'button-ghost hover:shadow-[0_0_10px_rgba(59,130,246,0.3)]'} text-base px-5 py-3 h-11 rounded-lg transition-all duration-200 font-medium`}
        >
          In Progress
        </Button>
        <Button 
          variant={statusFilter === "completed" ? "default" : "outline"} 
          size="sm"
          onClick={() => setStatusFilter("completed")}
          className={`${statusFilter === "completed" ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'button-ghost hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]'} text-base px-5 py-3 h-11 rounded-lg transition-all duration-200 font-medium`}
        >
          Complete
        </Button>
      </div>

      {todos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-300">
          <div className="w-20 h-20 mb-5 rounded-full bg-[#2a2a3c]/70 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <CheckSquare size={32} className="text-indigo-400" />
          </div>
          <p className="text-lg sebenta-title">No Tasks Available</p>
          <p className="text-sm text-gray-400 mt-2 max-w-xs">Click the New Task button above to get started with your first task</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {todos.map((todo) => (
              <motion.div 
                key={todo.id}
                className={`glass-card hover-lift rounded-xl overflow-hidden border ${
                  todo.status === 'pending' 
                    ? 'border-[#2a2a3c]/70 hover:shadow-[0_0_15px_rgba(234,179,8,0.15)]' 
                    : todo.status === 'in_progress' 
                    ? 'border-[#2a2a3c]/70 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                    : 'border-[#2a2a3c]/70 hover:shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                } transition-all duration-300`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={snappyTransition}
                whileHover={{ scale: 1.01 }}
              >
                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-base text-white flex items-center">
                        {todo.status === 'completed' ? (
                          <span className="text-gray-400 line-through decoration-gray-500">{todo.title}</span>
                        ) : (
                          <span>{todo.title}</span>
                        )}
                        {filter === "team" && (
                          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getUserColor(todo.user_id, userId, 'badge')}`}>
                            {todo.user?.full_name?.split(' ')[0] || todo.user?.email?.split('@')[0] || 'Unknown'}
                          </span>
                        )}
                      </h3>
                      
                      {todo.description && (
                        <p className="text-sm text-gray-400 mt-1">{todo.description}</p>
                      )}
                    </div>
                    
                    {(filter === "my" || todo.user_id === userId) ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Badge className={`${getStatusColor(todo.status)} text-sm ml-2 px-2 py-1 h-6 rounded-md shadow-sm cursor-pointer flex items-center gap-1 hover:opacity-90 transition-opacity`}>
                            <span>{getStatusText(todo.status)}</span>
                            <ChevronDown size={10} />
                          </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          sideOffset={5} 
                          className="bg-[#1a1a27] border border-[#2a2a3c] text-gray-200 shadow-[0_0_25px_rgba(60,60,80,0.3)]"
                        >
                          <DropdownMenuItem 
                            onClick={(e) => updateTodoStatus(todo.id, 'pending', e.currentTarget as unknown as React.MouseEvent<HTMLDivElement>)}
                            className={`flex items-center px-3 py-2 text-sm ${todo.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' : 'hover:bg-yellow-500/10 hover:text-yellow-400'}`}
                          >
                            <ListTodo size={14} className="mr-2" />
                            <span>Pending</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={(e) => updateTodoStatus(todo.id, 'in_progress', e.currentTarget as unknown as React.MouseEvent<HTMLDivElement>)}
                            className={`flex items-center px-3 py-2 text-sm ${todo.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400' : 'hover:bg-blue-500/10 hover:text-blue-400'}`}
                          >
                            <Activity size={14} className="mr-2" />
                            <span>In Progress</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={(e) => updateTodoStatus(todo.id, 'completed', e.currentTarget as unknown as React.MouseEvent<HTMLDivElement>)}
                            className={`flex items-center px-3 py-2 text-sm ${todo.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'hover:bg-green-500/10 hover:text-green-400'}`}
                          >
                            <CheckCircle size={14} className="mr-2" />
                            <span>Complete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Badge className={`${getStatusColor(todo.status)} text-sm ml-2 px-2 py-1 h-6 rounded-md shadow-sm`}>
                        {getStatusText(todo.status)}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-between text-sm text-gray-400 mt-3 pt-2 border-t border-[#2a2a3c]/50">
                    <div className="flex items-center">
                      {todo.due_date && (
                        <div className="flex items-center bg-[#2a2a3c]/50 px-3 py-1 rounded-md border border-[#2a2a3c] shadow-sm">
                          <Clock size={12} className="mr-1.5 text-indigo-400" />
                          <span>{format(new Date(todo.due_date), 'yyyy-MM-dd')}</span>
                          {calculateDaysLeft(todo.due_date) >= 0 ? (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-500/30 text-indigo-300">
                              D-{calculateDaysLeft(todo.due_date)}
                            </span>
                          ) : (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-medium bg-red-500/30 text-red-300">
                              D+{Math.abs(calculateDaysLeft(todo.due_date))}
                            </span>
                          )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {(todo.user_id === userId) && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteTodo(todo.id)}
                          className="h-7 w-7 p-0 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 transform hover:scale-110 hover:shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                        >
                          <motion.div
                            whileTap={{ scale: 0.8 }}
                            whileHover={{ rotate: -10 }}
                          >
                            <Trash2 size={14} className="text-red-400" />
                          </motion.div>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* 완료 효과 Portal - body에 직접 렌더링 */}
      {isBrowser && showCompletionEffect && createPortal(
        <div 
          className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden" 
          style={{
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh'
          }}
        >
          {/* 애니메이션 효과 컨테이너 */}
          <div 
            style={{
              position: 'absolute',
              top: completionPosition.y - 100,
              left: completionPosition.x - 100,
              width: 200,
              height: 200,
              pointerEvents: 'none'
            }}
          >
            {/* 핵심 체크 아이콘 */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#4ade80',
                zIndex: 10
              }}
            >
              <CheckCircle size={50} strokeWidth={2.5} className="text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
            </motion.div>
            
            {/* 동그란 파동 효과 */}
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(74,222,128,0.4) 0%, rgba(74,222,128,0) 70%)',
                transform: 'translate(-50%, -50%)'
              }}
            />
            
            {/* 작은 별들 */}
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 0, 
                  opacity: 0,
                  rotate: 0
                }}
                animate={{ 
                  x: -40 + Math.random() * 80, 
                  y: -40 + Math.random() * 80, 
                  scale: 0.5 + Math.random() * 0.5, 
                  opacity: [0, 1, 0],
                  rotate: -30 + Math.random() * 60
                }}
                transition={{ 
                  duration: 0.4 + Math.random() * 0.4,
                  delay: 0.1 + (i * 0.03),
                  ease: "easeOut" 
                }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  color: ['#4ade80', '#60a5fa', '#f59e0b', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 5)],
                  zIndex: 5,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <Sparkles size={16} strokeWidth={2.5} />
              </motion.div>
            ))}
            
            {/* 이모티콘들 */}
            {[...Array(5)].map((_, i) => {
              const icons = [ThumbsUp, Star, Heart, Sparkles];
              const Icon = icons[Math.floor(Math.random() * icons.length)];
              const colors = ['#4ade80', '#60a5fa', '#f59e0b', '#8b5cf6', '#ec4899'];
              const color = colors[Math.floor(Math.random() * colors.length)];
              
              return (
                <motion.div
                  key={`icon-${i}`}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    scale: 0, 
                    opacity: 0,
                    rotate: 0
                  }}
                  animate={{ 
                    x: -50 + Math.random() * 100, 
                    y: -80 + Math.random() * 40, 
                    scale: 0.7 + Math.random() * 0.5, 
                    opacity: [0, 1, 0],
                    rotate: -20 + Math.random() * 40
                  }}
                  transition={{ 
                    duration: 0.5 + Math.random() * 0.3,
                    delay: 0.15 + (i * 0.05),
                    ease: "easeOut" 
                  }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    color: color,
                    zIndex: 5,
                    transform: 'translate(-50%, -50%)',
                    filter: `drop-shadow(0px 0px 3px ${color}70)`
                  }}
                >
                  <Icon size={20} strokeWidth={2.5} />
                </motion.div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default TeamTodoList;