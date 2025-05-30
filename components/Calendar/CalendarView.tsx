"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckCircle,
  Clock,
  Activity,
  ListTodo,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, isToday, startOfDay, endOfDay, addWeeks, subWeeks } from "date-fns"

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

interface CalendarViewProps {
  userId?: string
  onTaskUpdate?: () => void
  showCompletedTasks?: boolean
  subscribedUserIds?: string[]
  onSelectedDateChange?: (date: Date | null, todos: Todo[]) => void
}

type ViewMode = 'month' | 'week'

const snappyTransition = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 1,
}

const CalendarView = ({ 
  userId,
  onTaskUpdate,
  showCompletedTasks = true,
  subscribedUserIds = [],
  onSelectedDateChange
}: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [todos, setTodos] = useState<Todo[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTodos, setSelectedTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const supabase = createClient()
  const onSelectedDateChangeRef = useRef(onSelectedDateChange)
  
  // Update ref when prop changes
  useEffect(() => {
    onSelectedDateChangeRef.current = onSelectedDateChange
  }, [onSelectedDateChange])

  // Handler for navigating to previous period
  const prevPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => addMonths(prev, -1))
    } else {
      setCurrentDate(prev => subWeeks(prev, 1))
    }
  }

  // Handler for navigating to next period
  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => addMonths(prev, 1))
    } else {
      setCurrentDate(prev => addWeeks(prev, 1))
    }
  }

  // Handler for navigating to today
  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  // Calculate calendar days based on view mode
  const calendarDays = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      const startDate = startOfWeek(monthStart)
      const endDate = endOfWeek(monthEnd)

      const days = []
      let day = startDate

      while (day <= endDate) {
        days.push(day)
        day = addDays(day, 1)
      }

      return days
    } else {
      // Week view
      const weekStart = startOfWeek(currentDate)
      const weekEnd = endOfWeek(currentDate)
      
      const days = []
      let day = weekStart

      while (day <= weekEnd) {
        days.push(day)
        day = addDays(day, 1)
      }

      return days
    }
  }, [currentDate, viewMode])

  // Fetch todos from Supabase
  const fetchTodos = async () => {
    try {
      setLoading(true)
      
      // Include the user's todos
      let userIds = [userId]
      
      // Add subscribed user IDs if available
      if (subscribedUserIds && subscribedUserIds.length > 0) {
        userIds = [...userIds, ...subscribedUserIds]
      }
      
      // Fetch todos for all relevant users that have a due date
      let query = supabase
        .from('todos')
        .select(`
          *,
          user:profiles!todos_user_id_fkey(full_name, email)
        `)
        .not('due_date', 'is', null)
        .in('user_id', userIds)
        .order('due_date', { ascending: true })
      
      // Apply status filter if specified
      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }
      
      // Filter out completed tasks if not shown
      if (!showCompletedTasks) {
        query = query.neq('status', 'completed')
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching todos for calendar:', error)
        throw error
      }
      
      setTodos(data || [])
    } catch (error) {
      console.error('Error fetching todos for calendar:', error)
      setTodos([])
    } finally {
      setLoading(false)
    }
  }

  // Update todos when filters or date changes
  useEffect(() => {
    fetchTodos()

    // Set up real-time subscription
    if (userId) {
      const calendarChannel = supabase
        .channel(`calendar-updates-${userId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'todos',
          filter: `user_id=eq.${userId}`
        }, () => {
          fetchTodos()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(calendarChannel)
      }
    }
  }, [userId, statusFilter, showCompletedTasks, subscribedUserIds, currentDate])

  // Update selected todos when date is selected
  useEffect(() => {
    if (selectedDate) {
      const todosForSelectedDate = todos.filter(todo => {
        if (!todo.due_date) return false
        return isSameDay(new Date(todo.due_date), selectedDate)
      })
      setSelectedTodos(todosForSelectedDate)
      onSelectedDateChangeRef.current?.(selectedDate, todosForSelectedDate)
    } else {
      setSelectedTodos([])
      onSelectedDateChangeRef.current?.(null, [])
    }
  }, [selectedDate, todos])

  // Get todos for a specific day
  const getTodosForDay = (day: Date) => {
    return todos.filter(todo => {
      if (!todo.due_date) return false
      return isSameDay(new Date(todo.due_date), day)
    })
  }

  // Get status color for badges
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

  // Get status icon for tasks
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

  // Function to update task status (to be implemented)
  const updateTodoStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
      
      if (error) {
        console.error('Error updating todo status:', error)
        throw error
      }
      
      fetchTodos()
      if (onTaskUpdate) {
        onTaskUpdate()
      }
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }

  // Get user color based on userID
  const getUserColor = (userId: string) => {
    // Same color logic as in TeamTodoList component
    const hash = userId.substring(Math.max(0, userId.length - 6))
    const colorIndex = parseInt(hash, 16) % 6
    
    const colors = [
      'bg-blue-400',
      'bg-purple-400',
      'bg-green-400',
      'bg-amber-400',
      'bg-pink-400',
      'bg-cyan-400'
    ]
    
    return colors[colorIndex]
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 text-gray-cool-800">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-sky-500 rounded-full animate-spin mb-2"></div>
          <p className="text-lg font-medium">Loading Calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="bg-white rounded-xl shadow-md border border-gray-cool-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-cool-800">
              {viewMode === 'month' 
                ? format(currentDate, 'MMMM yyyy')
                : `${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`
              }
            </h2>
            
            {/* View Mode Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-transparent text-gray-cool-700 hover:bg-gray-cool-100 text-sm px-3 py-1 h-7 transition-all duration-200 font-medium rounded flex items-center gap-1 outline outline-1 outline-gray-cool-200 outline-offset-[-1px]"
                >
                  <span className="font-light">View: </span>
                  <span>{viewMode === 'month' ? 'Month' : 'Week'}</span>
                  <ChevronDown size={12} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-cool-50 border border-gray-cool-200 text-gray-cool-700 shadow-[0_0_25px_rgba(0,0,0,0.1)] min-w-[180px] p-1">
                <DropdownMenuItem 
                  onClick={() => setViewMode('month')}
                  className={`flex items-center px-3 py-2 text-sm hover:bg-gray-cool-100 cursor-pointer rounded-md transition-all duration-200 mb-1 ${viewMode === 'month' ? 'bg-gray-cool-100' : ''}`}
                >
                  <span>Month</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => setViewMode('week')}
                  className={`flex items-center px-3 py-2 text-sm hover:bg-gray-cool-100 cursor-pointer rounded-md transition-all duration-200 ${viewMode === 'week' ? 'bg-gray-cool-100' : ''}`}
                >
                  <span>Week</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPeriod}
              className="h-8 w-8 p-0 rounded-md bg-[#F9F9FB] text-[#5D6A97] border-2 border-[#B9C0D4] hover:bg-[#EFF1F5] hover:border-[#7D89AF] active:bg-[#DCDFEA] transition-all duration-200"
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="h-8 px-3 py-1 rounded-md bg-[#F9F9FB] text-[#5D6A97] border-2 border-[#B9C0D4] hover:bg-[#EFF1F5] hover:border-[#7D89AF] active:bg-[#DCDFEA] transition-all duration-200"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextPeriod}
              className="h-8 w-8 p-0 rounded-md bg-[#F9F9FB] text-[#5D6A97] border-2 border-[#B9C0D4] hover:bg-[#EFF1F5] hover:border-[#7D89AF] active:bg-[#DCDFEA] transition-all duration-200"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setStatusFilter(null)}
            className={`${statusFilter === null ? 'bg-gray-cool-800 text-white border-gray-cool-900' : 'bg-gray-cool-50 text-gray-cool-500 border-gray-cool-200 hover:bg-gray-cool-100 hover:border-gray-cool-400 active:bg-gray-cool-200'} text-sm px-3 py-1 h-7 transition-all duration-200 font-medium rounded border`}
          >
            All
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setStatusFilter("pending")}
            className={`${statusFilter === "pending" ? 'bg-gray-cool-800 text-white border-gray-cool-900' : 'bg-gray-cool-50 text-gray-cool-500 border-gray-cool-200 hover:bg-gray-cool-100 hover:border-gray-cool-400 active:bg-gray-cool-200'} text-sm px-3 py-1 h-7 transition-all duration-200 font-medium rounded border`}
          >
            Not yet
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setStatusFilter("in_progress")}
            className={`${statusFilter === "in_progress" ? 'bg-gray-cool-800 text-white border-gray-cool-900' : 'bg-gray-cool-50 text-gray-cool-500 border-gray-cool-200 hover:bg-gray-cool-100 hover:border-gray-cool-400 active:bg-gray-cool-200'} text-sm px-3 py-1 h-7 transition-all duration-200 font-medium rounded border`}
          >
            Doing
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setStatusFilter("completed")}
            className={`${statusFilter === "completed" ? 'bg-gray-cool-800 text-white border-gray-cool-900' : 'bg-gray-cool-50 text-gray-cool-500 border-gray-cool-200 hover:bg-gray-cool-100 hover:border-gray-cool-400 active:bg-gray-cool-200'} text-sm px-3 py-1 h-7 transition-all duration-200 font-medium rounded border`}
          >
            Complete
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className={`${viewMode === 'month' ? 'bg-white rounded-xl shadow-md border border-gray-cool-200 overflow-hidden' : ''}`}>
        {/* Day names header - only for month view */}
        {viewMode === 'month' && (
          <div className="grid grid-cols-7 mb-2 px-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <div 
                key={day} 
                className={`text-center py-2 text-sm font-medium ${index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-gray-cool-500'}`}
              >
                {day}
              </div>
            ))}
          </div>
        )}

        {/* Calendar days */}
        {viewMode === 'month' ? (
          <div className="grid grid-cols-7 gap-0.5 px-2 pb-2">
            {calendarDays.map((day, i) => {
              const dayTodos = getTodosForDay(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isDaySelected = selectedDate && isSameDay(day, selectedDate)
              const isCurrentDay = isToday(day)
              
              return (
                <motion.div
                  key={i}
                  className={`
                    min-h-[100px] p-1 border relative rounded-md cursor-pointer
                    ${isCurrentMonth ? 'border-gray-cool-200' : 'border-gray-cool-100 bg-gray-cool-50'} 
                    ${isDaySelected ? 'ring-2 ring-gray-cool-400 border-gray-cool-400 bg-gray-cool-50' : ''}
                    ${isCurrentDay ? 'border-sky-500' : ''}
                    hover:border-gray-cool-300 transition-colors
                  `}
                  onClick={() => setSelectedDate(day)}
                  whileHover={{ scale: 1.02 }}
                  transition={snappyTransition}
                >
                  <div className="flex justify-between items-start p-1">
                    <span 
                      className={`
                        text-sm font-semibold rounded-full w-6 h-6 flex items-center justify-center
                        ${!isCurrentMonth ? 'text-gray-cool-500' : i % 7 === 0 ? 'text-red-400' : i % 7 === 6 ? 'text-blue-400' : 'text-gray-cool-800'}
                        ${isCurrentDay ? 'bg-gray-cool-200 text-gray-cool-800 ring-2 ring-gray-cool-400' : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </span>
                    
                    {dayTodos.length > 0 && (
                      <div className="w-5 h-5 bg-[#EFF1F5] text-[#5D6A97] border border-[#DCDFEA] rounded-full flex items-center justify-center text-sm font-medium">
                        {dayTodos.length}
                      </div>
                    )}
                  </div>
                  
                  {/* Task items in each day */}
                  <div className="mt-1 space-y-1 max-h-[70px] overflow-y-auto scrollbar-thin">
                    {dayTodos.slice(0, 3).map(todo => (
                      <div
                        key={todo.id}
                        className={`
                          text-xs p-1 rounded flex items-center gap-1 relative overflow-hidden
                          ${todo.status === 'completed' ? 'bg-[#3fcf8e]/10' : 'bg-[#FDFDFD] border border-[rgba(0,0,0,0.10)]'}
                        `}
                      >
                        <span className="truncate text-gray-cool-800 text-sm">{todo.title}</span>
                        <span className={`ml-auto flex-shrink-0 ${getStatusColor(todo.status)} rounded-sm px-1`}>
                          {getStatusIcon(todo.status)}
                        </span>
                      </div>
                    ))}
                    
                    {/* If there are more tasks than can be shown, show a "more" indicator */}
                    {dayTodos.length > 3 && (
                      <div className="text-xs text-gray-cool-500 text-center">
                        +{dayTodos.length - 3} more
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          // Week view - mobile optimized full width
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-1 px-2">
            {calendarDays.map((day, i) => {
              const dayTodos = getTodosForDay(day)
              const isDaySelected = selectedDate && isSameDay(day, selectedDate)
              const isCurrentDay = isToday(day)
              const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.getDay()]
              
              return (
                <motion.div
                  key={i}
                  className={`
                    min-h-[180px] sm:min-h-[200px] p-2 border rounded-lg cursor-pointer bg-white shadow-sm
                    ${isDaySelected ? 'ring-2 ring-gray-cool-400 border-gray-cool-400 bg-gray-cool-50' : 'border-gray-cool-200'}
                    ${isCurrentDay ? 'border-sky-500 border-2' : ''}
                    hover:border-gray-cool-300 hover:shadow-md transition-all duration-200
                  `}
                  onClick={() => setSelectedDate(day)}
                  whileHover={{ scale: 1.02 }}
                  transition={snappyTransition}
                >
                  <div className="flex flex-col items-center mb-3">
                    <span 
                      className={`
                        text-lg sm:text-xl font-bold rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-1
                        ${i % 7 === 0 ? 'text-red-400' : i % 7 === 6 ? 'text-blue-400' : 'text-gray-cool-800'}
                        ${isCurrentDay ? 'bg-gray-cool-200 text-gray-cool-800 ring-2 ring-gray-cool-400' : 'bg-gray-cool-50'}
                      `}
                    >
                      {format(day, 'd')}
                    </span>
                    <h3 className={`text-sm font-semibold ${i % 7 === 0 ? 'text-red-400' : i % 7 === 6 ? 'text-blue-400' : 'text-gray-cool-800'}`}>
                      {dayName}
                    </h3>
                    {dayTodos.length > 0 && (
                      <div className="w-6 h-6 bg-[#EFF1F5] text-[#5D6A97] border border-[#DCDFEA] rounded-full flex items-center justify-center text-sm font-medium mt-1">
                        {dayTodos.length}
                      </div>
                    )}
                  </div>
                  
                  {/* Task items for the day */}
                  <div className="space-y-2 max-h-[100px] sm:max-h-[120px] overflow-y-auto scrollbar-thin">
                    {dayTodos.slice(0, 3).map(todo => (
                      <div
                        key={todo.id}
                        className={`
                          text-xs p-2 rounded border relative overflow-hidden
                          ${todo.status === 'completed' ? 'bg-[#3fcf8e]/10 border-[#3fcf8e]/20' : 'bg-[#FDFDFD] border-[rgba(0,0,0,0.10)]'}
                        `}
                      >
                        <div>
                          <h4 className={`font-medium text-sm truncate leading-4 ${todo.status === 'completed' ? 'line-through text-gray-cool-500' : 'text-gray-cool-800'}`}>
                            {todo.title}
                          </h4>
                          <div className="flex items-center justify-between mt-1">
                            {todo.user_id !== userId && (
                              <span className="text-xs text-gray-cool-500 bg-gray-cool-50 px-1 py-0.5 rounded text-xs">
                                {todo.user?.full_name?.split(' ')[0] || todo.user?.email?.split('@')[0] || 'Unknown'}
                              </span>
                            )}
                            <span className={`ml-auto flex-shrink-0 ${getStatusColor(todo.status)} rounded-sm px-1 py-0.5 text-xs flex items-center`}>
                              {getStatusIcon(todo.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* If there are more tasks than can be shown, show a "more" indicator */}
                    {dayTodos.length > 3 && (
                      <div className="text-xs text-gray-cool-500 text-center py-1 font-medium">
                        +{dayTodos.length - 3} more
                      </div>
                    )}
                    
                    {dayTodos.length === 0 && (
                      <div className="text-center py-3 text-gray-cool-400 text-xs">
                        No tasks
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}

export default CalendarView