"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MinimalSpinner } from "@/components/ui/loading"
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
  Sparkles,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
  CalendarIcon,
  History
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
  priority: "high" | "medium" | "low" | null
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
  itemsPerPage?: number
}

interface CompletionEffectPosition {
  x: number
  y: number
  width: number
  height: number
}

const smoothTransition = {
  type: "spring",
  stiffness: 300,
  damping: 40,
  mass: 0.8,
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
  
  // 사용 가능한 색상 조합 (배지, 컨테이너, 도트 색상) - Light theme용
  const colorSchemes = [
    { badge: 'bg-blue-100 text-blue-700 border-blue-200', container: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
    { badge: 'bg-purple-100 text-purple-700 border-purple-200', container: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
    { badge: 'bg-green-100 text-green-700 border-green-200', container: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
    { badge: 'bg-amber-100 text-amber-700 border-amber-200', container: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
    { badge: 'bg-pink-100 text-pink-700 border-pink-200', container: 'bg-pink-50 border-pink-200', dot: 'bg-pink-500' },
    { badge: 'bg-cyan-100 text-cyan-700 border-cyan-200', container: 'bg-cyan-50 border-cyan-200', dot: 'bg-cyan-500' }
  ]
  
  // 내 태스크인 경우 별도 처리
  if (userId === currentUserId && type === 'container') {
    return 'bg-indigo-50 border-indigo-200'
  }
  
  return colorSchemes[colorIndex][type]
}

const TeamTodoList = ({ userId, filter, refreshTrigger, onDelete, itemsPerPage = 5 }: TeamTodoListProps) => {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<string | null>(null)
  const [showCompletionEffect, setShowCompletionEffect] = useState(false)
  const [isBrowser, setIsBrowser] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({})
  const [completionPosition, setCompletionPosition] = useState<CompletionEffectPosition>({ 
    x: 0, 
    y: 0, 
    width: 0, 
    height: 0 
  })
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<'title' | 'description' | 'due_date' | null>(null)
  const [editValue, setEditValue] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [updateHistory, setUpdateHistory] = useState<Record<string, Array<{date: string, field: string, oldValue: string, newValue: string}>>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  
  const toggleDescription = (todoId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [todoId]: !prev[todoId]
    }))
  }
  
  // 인라인 편집 시작
  const startEditing = (todoId: string, field: 'title' | 'description' | 'due_date', currentValue: string) => {
    setEditingTodoId(todoId)
    setEditingField(field)
    setEditValue(currentValue || '')
    if (field === 'due_date') {
      setShowDatePicker(true)
    }
  }
  
  // 인라인 편집 저장
  const saveEdit = async (todoId: string) => {
    if (!editingField) return
    
    try {
      const updates: any = {}
      updates[editingField] = editValue
      
      const { error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', todoId)
      
      if (error) throw error
      
      // 업데이트 히스토리 추가
      const todo = todos.find(t => t.id === todoId)
      if (todo) {
        const history = updateHistory[todoId] || []
        history.push({
          date: new Date().toISOString(),
          field: editingField,
          oldValue: todo[editingField] || '',
          newValue: editValue
        })
        setUpdateHistory(prev => ({ ...prev, [todoId]: history }))
      }
      
      fetchTodos()
      setEditingTodoId(null)
      setEditingField(null)
      setEditValue('')
      setShowDatePicker(false)
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }
  
  // 인라인 편집 취소
  const cancelEdit = () => {
    setEditingTodoId(null)
    setEditingField(null)
    setEditValue('')
    setShowDatePicker(false)
  }
  
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
          user:profiles!todos_user_id_fkey(full_name, email)
        `)
        .order('due_date', { ascending: true, nullsFirst: true })
      
      if (filter === "my" && userId) {
        query = query.eq('user_id', userId)
      }
      
      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }
      
      
      // Due date 필터 적용
      if (dateFilter) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 오늘 날짜의 시작
        
        if (dateFilter === 'today') {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          query = query.gte('due_date', today.toISOString())
                     .lt('due_date', tomorrow.toISOString());
        } else if (dateFilter === 'week') {
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          query = query.gte('due_date', today.toISOString())
                     .lt('due_date', nextWeek.toISOString());
        } else if (dateFilter === 'month') {
          const nextMonth = new Date(today);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          query = query.gte('due_date', today.toISOString())
                     .lt('due_date', nextMonth.toISOString());
        } else if (dateFilter === 'year') {
          const nextYear = new Date(today);
          nextYear.setFullYear(nextYear.getFullYear() + 1);
          query = query.gte('due_date', today.toISOString())
                     .lt('due_date', nextYear.toISOString());
        }
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
      setTodos(prevTodos => prevTodos.map(todo => 
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
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
      
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
    // 필터 변경 시 페이지를 1로 리셋
    setCurrentPage(1)
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
            
            
            // 상태 업데이트로 목록 새로고침
            fetchTodos();
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
  }, [userId, filter, statusFilter, dateFilter, refreshTrigger, supabase]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border border-amber-300'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border border-blue-300'
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-300'
      default:
        return 'bg-amber-100 text-amber-800 border border-amber-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Not yet'
      case 'in_progress':
        return 'Doing'
      case 'completed':
        return 'Complete'
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ListTodo size={12} />
      case 'in_progress':
        return <Activity size={12} />
      case 'completed':
        return <CheckCircle size={12} />
      default:
        return <ListTodo size={12} />
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <MinimalSpinner size="lg" text="Loading Tasks..." />
      </div>
    )
  }


  return (
    <div className="text-gray-cool-700" ref={containerRef}>
      <div className="flex flex-col space-y-6 mb-6">
        {/* 필터 영역 - 상태 필터와 날짜 드롭다운 같은 줄에 배치 */}
        <div>
          <div className="flex justify-between items-center">
            {/* Desktop minimal filter buttons */}
            <div className="hidden md:flex flex-wrap gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter(null)}
                className={`${statusFilter === null ? 'bg-[#30374E] text-white border-[#111322] hover:bg-[#1F242F] hover:border-[#0A0C12]' : 'bg-[#F9F9FB] text-[#5D6A97] border-[#DCDFEA] hover:bg-[#EFF1F5] hover:border-[#7D89AF] active:bg-[#DCDFEA]'} text-sm px-3 py-1 h-7 transition-all duration-200 font-medium rounded border`}
              >
                All
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter("pending")}
                className={`${statusFilter === "pending" ? 'bg-[#30374E] text-white border-[#111322] hover:bg-[#1F242F] hover:border-[#0A0C12]' : 'bg-[#F9F9FB] text-[#5D6A97] border-[#DCDFEA] hover:bg-[#EFF1F5] hover:border-[#7D89AF] active:bg-[#DCDFEA]'} text-sm px-3 py-1 h-7 transition-all duration-200 font-medium rounded border`}
              >
                Not yet
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter("in_progress")}
                className={`${statusFilter === "in_progress" ? 'bg-[#30374E] text-white border-[#111322] hover:bg-[#1F242F] hover:border-[#0A0C12]' : 'bg-[#F9F9FB] text-[#5D6A97] border-[#DCDFEA] hover:bg-[#EFF1F5] hover:border-[#7D89AF] active:bg-[#DCDFEA]'} text-sm px-3 py-1 h-7 transition-all duration-200 font-medium rounded border`}
              >
                Doing
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter("completed")}
                className={`${statusFilter === "completed" ? 'bg-[#30374E] text-white border-[#111322] hover:bg-[#1F242F] hover:border-[#0A0C12]' : 'bg-[#F9F9FB] text-[#5D6A97] border-[#DCDFEA] hover:bg-[#EFF1F5] hover:border-[#7D89AF] active:bg-[#DCDFEA]'} text-sm px-3 py-1 h-7 transition-all duration-200 font-medium rounded border`}
              >
                Complete
              </Button>
            </div>

            {/* 모바일에서는 드롭다운 형태 */}
            <div className="md:hidden flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-transparent text-gray-cool-700 hover:bg-gray-50 text-sm px-4 py-1.5 h-8 transition-all duration-200 font-normal rounded-md flex items-center gap-2 outline outline-1 outline-gray-cool-200 outline-offset-[-1px]"
                  >
                    {statusFilter === null ? <><span className="font-light">Status: </span><span>All</span></> : 
                     statusFilter === "pending" ? <><span className="font-light">Status: </span><span>Not yet</span></> : 
                     statusFilter === "in_progress" ? <><span className="font-light">Status: </span><span>Doing</span></> :
                     <><span className="font-light">Status: </span><span>Complete</span></>}
                    <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-cool-25 border border-gray-cool-200 text-gray-cool-700 shadow-[0_0_25px_rgba(0,0,0,0.1)] min-w-[160px] p-1">
                  <DropdownMenuItem 
                    onClick={() => setStatusFilter(null)}
                    className={`flex items-center px-3 py-2 text-sm hover:bg-gray-cool-600 hover:text-white cursor-pointer rounded-md transition-all duration-200 mb-1 ${statusFilter === null ? 'bg-gray-cool-600/20' : ''}`}
                  >
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setStatusFilter("pending")}
                    className={`flex items-center px-3 py-2 text-sm hover:bg-gray-cool-600 hover:text-white cursor-pointer rounded-md transition-all duration-200 mb-1 ${statusFilter === "pending" ? 'bg-gray-cool-600/20' : ''}`}
                  >
                    Not yet
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setStatusFilter("in_progress")}
                    className={`flex items-center px-3 py-2 text-sm hover:bg-gray-cool-600 hover:text-white cursor-pointer rounded-md transition-all duration-200 mb-1 ${statusFilter === "in_progress" ? 'bg-gray-cool-600/20' : ''}`}
                  >
                    Doing
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setStatusFilter("completed")}
                    className={`flex items-center px-3 py-2 text-sm hover:bg-gray-cool-600 hover:text-white cursor-pointer rounded-md transition-all duration-200 ${statusFilter === "completed" ? 'bg-gray-cool-600/20' : ''}`}
                  >
                    Complete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Due Date 필터 - 오른쪽에 배치 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-transparent text-gray-cool-700 hover:bg-gray-cool-100 text-sm px-3 py-1 h-7 transition-all duration-200 font-medium rounded flex items-center gap-1 outline outline-1 outline-gray-cool-200 outline-offset-[-1px]"
                >
                  {dateFilter === null ? <><span className="font-light">Due: </span><span>All</span></> : 
                   dateFilter === "today" ? <><span className="font-light">Due: </span><span>Today</span></> : 
                   dateFilter === "week" ? <><span className="font-light">Due: </span><span>Week</span></> :
                   dateFilter === "month" ? <><span className="font-light">Due: </span><span>Month</span></> :
                   <><span className="font-light">Due: </span><span>Year</span></>}
                  <ChevronDown size={12} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-cool-25 border border-gray-cool-200 text-gray-cool-700 shadow-[0_0_25px_rgba(0,0,0,0.1)] min-w-[180px] p-1">
                <DropdownMenuItem 
                  onClick={() => setDateFilter(null)}
                  className={`flex items-center px-3 py-2 text-sm hover:bg-gray-cool-100 cursor-pointer rounded-md transition-all duration-200 mb-1 ${dateFilter === null ? 'bg-gray-cool-100' : ''}`}
                >
                  All
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDateFilter("today")}
                  className={`flex items-center px-3 py-2 text-sm hover:bg-gray-cool-100 cursor-pointer rounded-md transition-all duration-200 mb-1 ${dateFilter === "today" ? 'bg-gray-cool-100' : ''}`}
                >
                  Today
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDateFilter("week")}
                  className={`flex items-center px-3 py-2 text-sm hover:bg-gray-cool-100 cursor-pointer rounded-md transition-all duration-200 mb-1 ${dateFilter === "week" ? 'bg-gray-cool-100' : ''}`}
                >
                  This week
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDateFilter("month")}
                  className={`flex items-center px-3 py-2 text-sm hover:bg-gray-cool-100 cursor-pointer rounded-md transition-all duration-200 mb-1 ${dateFilter === "month" ? 'bg-gray-cool-100' : ''}`}
                >
                  This month
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDateFilter("year")}
                  className={`flex items-center px-3 py-2 text-sm hover:bg-gray-cool-100 cursor-pointer rounded-md transition-all duration-200 ${dateFilter === "year" ? 'bg-gray-cool-100' : ''}`}
                >
                  This year
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {todos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-cool-400">
          <div className="w-20 h-20 mb-5 rounded-full bg-gray-100 flex items-center justify-center shadow-lg shadow-gray-cool-200/20">
            <CheckSquare size={32} className="text-gray-cool-600" />
          </div>
          <p className="text-lg font-semibold text-gray-cool-700">No Tasks Available</p>
          <p className="text-sm text-gray-cool-400 mt-2 max-w-xs">Click the New Task button above to get started with your first task</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {todos
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((todo, index) => (
              <motion.div 
                key={`${todo.id}-${currentPage}`}
                className={`bg-gray-cool-25 rounded-xl overflow-hidden border border-gray-cool-200 hover:border-gray-cool-600/40 transition-all duration-200 hover:bg-gray-50`}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 0 }}
                transition={{ 
                  duration: 0.2,
                  delay: index * 0.05,
                  ease: "easeOut"
                }}
                whileHover={{ scale: 1.01 }}
              >
                <div 
                  className="p-5 cursor-pointer"
                  onClick={() => todo.description && toggleDescription(todo.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-base text-gray-cool-700 flex items-center pr-4">
                        {editingTodoId === todo.id && editingField === 'title' ? (
                          <div className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit(todo.id)
                                if (e.key === 'Escape') cancelEdit()
                              }}
                              className="text-base font-medium"
                              autoFocus
                            />
                            <Button size="sm" onClick={() => saveEdit(todo.id)}>Save</Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                          </div>
                        ) : (
                          <div 
                            className="flex-1 group cursor-pointer hover:bg-gray-cool-50 rounded px-2 py-1 -mx-2 -my-1"
                            onDoubleClick={(e) => {
                              e.stopPropagation()
                              if (todo.user_id === userId) {
                                startEditing(todo.id, 'title', todo.title)
                              }
                            }}
                          >
                            {todo.status === 'completed' ? (
                              <span className="text-gray-cool-400 line-through decoration-gray-cool-400">{todo.title}</span>
                            ) : (
                              <span>{todo.title}</span>
                            )}
                            {todo.user_id === userId && (
                              <Edit2 size={14} className="inline-block ml-2 text-gray-cool-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        )}
                      </h3>
                    </div>
                    {todo.description && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 rounded-full transition-all duration-200 hover:bg-gray-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDescription(todo.id);
                        }}
                      >
                        <ChevronDown 
                          size={16} 
                          className={`text-gray-cool-400 transition-transform duration-200 ${expandedDescriptions[todo.id] ? 'rotate-180' : ''}`} 
                        />
                      </Button>
                    )}
                  </div>
                  
                  {todo.description && expandedDescriptions[todo.id] && (
                    <div className="mt-3 relative">
                      {editingTodoId === todo.id && editingField === 'description' ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full p-2 text-sm border border-gray-cool-300 rounded-md"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEdit(todo.id)}>Save</Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="py-2 px-3 text-sm text-gray-cool-600 bg-white rounded-md border border-gray-cool-200 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer group"
                          onDoubleClick={() => startEditing(todo.id, 'description', todo.description || '')}
                        >
                          <div className="flex justify-between items-start">
                            <p className="flex-1">{todo.description}</p>
                            <Edit2 size={14} className="text-gray-cool-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap items-center justify-between text-sm text-gray-cool-400 mt-4 pt-3 border-t border-gray-cool-200/60">
                    <div className="flex items-center gap-2">
                      {filter === "team" && (
                        <span className={`px-2 py-0.5 text-xs rounded-sm bg-gray-100 text-gray-cool-700 border border-gray-cool-200 mr-1`}>
                          {todo.user?.full_name?.split(' ')[0] || todo.user?.email?.split('@')[0] || 'Unknown'}
                        </span>
                      )}
                      
                      {todo.due_date && todo.status !== 'completed' && (
                        <div className="flex items-center gap-2">
                          {editingTodoId === todo.id && editingField === 'due_date' ? (
                            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="justify-start text-left font-normal h-8"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {editValue ? format(new Date(editValue), 'yyyy-MM-dd') : 'Pick a date'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="flex w-auto p-0" align="start">
                                <div className="flex">
                                  <Calendar
                                    mode="single"
                                    selected={editValue ? new Date(editValue) : undefined}
                                    onSelect={(date) => {
                                      if (date) {
                                        setEditValue(date.toISOString())
                                        saveEdit(todo.id)
                                      }
                                    }}
                                    initialFocus
                                  />
                                  {/* Update History */}
                                  <div className="p-4 border-l w-64">
                                    <h4 className="font-medium text-sm mb-2 flex items-center">
                                      <History size={14} className="mr-1" />
                                      Update History
                                    </h4>
                                    <div className="space-y-2 text-xs text-gray-600 max-h-64 overflow-y-auto">
                                      {(updateHistory[todo.id] || []).map((history, i) => (
                                        <div key={i} className="border-b pb-1">
                                          <div className="font-medium">{history.field}</div>
                                          <div className="text-gray-500">
                                            {format(new Date(history.date), 'MM/dd HH:mm')}
                                          </div>
                                          <div className="text-gray-400">
                                            {history.oldValue} → {history.newValue}
                                          </div>
                                        </div>
                                      ))}
                                      {!updateHistory[todo.id] && (
                                        <div className="text-gray-400">No updates yet</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <div 
                              className="flex items-center bg-gray-50 px-3 py-1 rounded-md border border-gray-cool-200 shadow-sm hover:bg-gray-100 cursor-pointer group"
                              onDoubleClick={(e) => {
                                e.stopPropagation()
                                if (todo.user_id === userId) {
                                  startEditing(todo.id, 'due_date', todo.due_date || '')
                                }
                              }}
                            >
                              <Clock size={12} className="mr-1.5 text-gray-cool-400" />
                              <span className="text-gray-cool-400">{format(new Date(todo.due_date), 'yyyy-MM-dd')}</span>
                              {todo.user_id === userId && (
                                <Edit2 size={12} className="ml-2 text-gray-cool-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                              {calculateDaysLeft(todo.due_date) === 0 ? (
                                <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-medium bg-white text-[#171717] border border-[#171717]">
                                  Today
                                </span>
                              ) : calculateDaysLeft(todo.due_date) > 0 ? (
                                <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-medium bg-[#525252] text-white">
                                  D-{calculateDaysLeft(todo.due_date)}
                                </span>
                              ) : (
                                <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-medium bg-[#525252] text-white">
                                  D+{Math.abs(calculateDaysLeft(todo.due_date))}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {todo.due_date && todo.status === 'completed' && (
                        <div className="flex items-center bg-gray-50 px-3 py-1 rounded-md border border-gray-cool-200 shadow-sm">
                          <Clock size={12} className="mr-1.5 text-gray-cool-400" />
                          <span className="text-gray-cool-400">{format(new Date(todo.due_date), 'yyyy-MM-dd')}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {(filter === "my" || todo.user_id === userId) ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="focus:outline-none"
                            >
                              <Badge className={`${getStatusColor(todo.status)} text-sm px-2 py-1 h-6 rounded-sm shadow-sm cursor-pointer flex items-center gap-1 transition-all duration-200 hover:opacity-80 hover:scale-105 border-2 border-transparent hover:border-gray-400`}>
                                {getStatusIcon(todo.status)}
                                <span>{getStatusText(todo.status)}</span>
                                <ChevronDown size={12} className="opacity-60" />
                              </Badge>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            sideOffset={5} 
                            className="bg-gray-cool-25 border border-gray-cool-200 text-gray-cool-700 shadow-[0_0_25px_rgba(0,0,0,0.1)] p-1 z-50"
                            align="end"
                          >
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                updateTodoStatus(todo.id, 'pending', e.currentTarget as unknown as React.MouseEvent<HTMLDivElement>);
                              }}
                              className={`flex items-center px-3 py-2 text-sm rounded-md transition-all duration-200 mb-1 ${todo.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'hover:bg-amber-100 hover:text-amber-800'}`}
                            >
                              <ListTodo size={14} className="mr-2" />
                              <span>Not yet</span>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                updateTodoStatus(todo.id, 'in_progress', e.currentTarget as unknown as React.MouseEvent<HTMLDivElement>);
                              }}
                              className={`flex items-center px-3 py-2 text-sm rounded-md transition-all duration-200 mb-1 ${todo.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'hover:bg-blue-100 hover:text-blue-800'}`}
                            >
                              <Activity size={14} className="mr-2" />
                              <span>Doing</span>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                updateTodoStatus(todo.id, 'completed', e.currentTarget as unknown as React.MouseEvent<HTMLDivElement>);
                              }}
                              className={`flex items-center px-3 py-2 text-sm rounded-md transition-all duration-200 ${todo.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'hover:bg-emerald-100 hover:text-emerald-800'}`}
                            >
                              <CheckCircle size={14} className="mr-2" />
                              <span>Complete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Badge className={`${getStatusColor(todo.status)} text-sm px-2 py-1 h-6 rounded-md shadow-sm flex items-center gap-1`}>
                          {getStatusIcon(todo.status)}
                          {getStatusText(todo.status)}
                        </Badge>
                      )}
                      
                      {(todo.user_id === userId) && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTodo(todo.id);
                          }}
                          className="h-7 w-7 p-0 rounded-lg hover:bg-red-100 hover:text-red-600 transition-all duration-200 transform hover:scale-110"
                        >
                          <motion.div
                            whileTap={{ scale: 0.8 }}
                            whileHover={{ rotate: -10 }}
                          >
                            <Trash2 size={14} className="text-gray-cool-400 hover:text-red-600" />
                          </motion.div>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Pagination Controls */}
          {todos.length > itemsPerPage && (
            <div className="flex items-center mt-6 gap-2 justify-start">
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="h-8 w-8 p-0 rounded-md bg-transparent text-gray-cool-700 hover:bg-gray-50 outline outline-1 outline-gray-cool-200 outline-offset-[-1px]"
              >
                <ChevronLeft size={16} />
              </Button>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(Math.ceil(todos.length / itemsPerPage), 5) }, (_, i) => {
                // Calculate page number logic
                const totalPages = Math.ceil(todos.length / itemsPerPage);
                let pageNum = i + 1;
                
                // For many pages, show something like 1 2 ... 9 10 when on page 1 or 2
                // Or 1 2 ... 9 10 when on page 9 or 10
                // Or 1 ... 5 6 7 ... 10 when on page 6
                if (totalPages > 5) {
                  if (currentPage <= 3) {
                    // Near start
                    if (i < 3) {
                      pageNum = i + 1;
                    } else if (i === 3) {
                      return (
                        <span key="ellipsis-1" className="text-gray-cool-400 mx-1">...</span>
                      );
                    } else {
                      pageNum = totalPages;
                    }
                  } else if (currentPage >= totalPages - 2) {
                    // Near end
                    if (i === 0) {
                      pageNum = 1;
                    } else if (i === 1) {
                      return (
                        <span key="ellipsis-2" className="text-gray-cool-400 mx-1">...</span>
                      );
                    } else {
                      pageNum = totalPages - (4 - i);
                    }
                  } else {
                    // Middle
                    if (i === 0) {
                      pageNum = 1;
                    } else if (i === 1) {
                      return (
                        <span key="ellipsis-3" className="text-gray-cool-400 mx-1">...</span>
                      );
                    } else if (i === 4) {
                      return (
                        <span key="ellipsis-4" className="text-gray-cool-400 mx-1">...</span>
                      );
                    } else if (i === 3) {
                      pageNum = totalPages;
                    } else {
                      pageNum = currentPage;
                    }
                  }
                } else {
                  pageNum = i + 1;
                }
                
                // Return button for this page number
                return (
                  <Button
                    key={`page-${pageNum}`}
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 w-8 p-0 rounded-md ${
                      currentPage === pageNum 
                        ? 'bg-[#525252] text-white' 
                        : 'bg-transparent text-gray-cool-700 hover:bg-gray-50'
                    } outline outline-1 outline-gray-cool-200 outline-offset-[-1px]`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage >= Math.ceil(todos.length / itemsPerPage)}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(todos.length / itemsPerPage)))}
                className="h-8 w-8 p-0 rounded-md bg-transparent text-gray-cool-700 hover:bg-gray-50 outline outline-1 outline-gray-cool-200 outline-offset-[-1px]"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
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
  );
};

export default TeamTodoList;