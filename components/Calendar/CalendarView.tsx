"use client"

import { useState, useEffect, useMemo } from "react"
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
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, isToday } from "date-fns"

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
}

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
  subscribedUserIds = []
}: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [todos, setTodos] = useState<Todo[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTodos, setSelectedTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const supabase = createClient()

  // Handler for navigating to previous month
  const prevMonth = () => {
    setCurrentDate(prev => addMonths(prev, -1))
  }

  // Handler for navigating to next month
  const nextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1))
  }

  // Handler for navigating to today
  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  // Calculate calendar days for the current month
  const calendarDays = useMemo(() => {
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
  }, [currentDate])

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
          user:profiles(full_name, email)
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
    } else {
      setSelectedTodos([])
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
        return 'bg-[#FFDA40] text-black'
      case 'in_progress':
        return 'bg-[#FF82C2] text-black'
      case 'completed':
        return 'bg-[#3fcf8e] text-black'
      default:
        return 'bg-[#FFDA40] text-black'
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
      <div className="flex justify-center items-center p-8 text-[#171717]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-[#3fcf8e] rounded-full animate-spin mb-2"></div>
          <p className="text-lg font-medium">Loading Calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#fcfcfc] rounded-xl overflow-hidden shadow-md border border-[rgba(0,0,0,0.20)] text-[#171717]">
      {/* Calendar Header */}
      <div className="p-4 border-b border-[rgba(0,0,0,0.20)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevMonth}
              className="h-8 w-8 p-0 rounded-md bg-[#FDFDFD] text-[#171717] hover:bg-[#3fcf8e] hover:text-white border border-[rgba(0,0,0,0.20)]"
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="h-8 px-3 py-1 rounded-md bg-[#FDFDFD] text-[#171717] hover:bg-[#3fcf8e] hover:text-white border border-[rgba(0,0,0,0.20)]"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextMonth}
              className="h-8 w-8 p-0 rounded-md bg-[#FDFDFD] text-[#171717] hover:bg-[#3fcf8e] hover:text-white border border-[rgba(0,0,0,0.20)]"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button 
            variant={statusFilter === null ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter(null)}
            className={`${statusFilter === null ? 'bg-[#3fcf8e] text-white hover:bg-[#3fcf8e]/90' : 'bg-transparent border border-[rgba(0,0,0,0.20)] text-[#171717] hover:bg-[#3fcf8e] hover:text-white'} text-sm px-4 py-1.5 h-8 transition-all duration-200 font-medium w-auto rounded-md`}
          >
            All
          </Button>
          <Button 
            variant={statusFilter === "pending" ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter("pending")}
            className={`${statusFilter === "pending" ? 'bg-[#3fcf8e] text-white hover:bg-[#3fcf8e]/90' : 'bg-transparent border border-[rgba(0,0,0,0.20)] text-[#171717] hover:bg-[#3fcf8e] hover:text-white'} text-sm px-4 py-1.5 h-8 transition-all duration-200 font-medium w-auto rounded-md`}
          >
            Not yet
          </Button>
          <Button 
            variant={statusFilter === "in_progress" ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter("in_progress")}
            className={`${statusFilter === "in_progress" ? 'bg-[#3fcf8e] text-white hover:bg-[#3fcf8e]/90' : 'bg-transparent border border-[rgba(0,0,0,0.20)] text-[#171717] hover:bg-[#3fcf8e] hover:text-white'} text-sm px-4 py-1.5 h-8 transition-all duration-200 font-medium w-auto rounded-md`}
          >
            Doing
          </Button>
          <Button 
            variant={statusFilter === "completed" ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter("completed")}
            className={`${statusFilter === "completed" ? 'bg-[#3fcf8e] text-white hover:bg-[#3fcf8e]/90' : 'bg-transparent border border-[rgba(0,0,0,0.20)] text-[#171717] hover:bg-[#3fcf8e] hover:text-white'} text-sm px-4 py-1.5 h-8 transition-all duration-200 font-medium w-auto rounded-md`}
          >
            Complete
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="p-4">
        {/* Day names header */}
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <div 
              key={day} 
              className={`text-center py-2 text-sm font-medium ${index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-[#707070]'}`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
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
                  ${isCurrentMonth ? 'border-[rgba(0,0,0,0.20)]' : 'border-[rgba(0,0,0,0.10)] bg-[rgba(0,0,0,0.02)]'} 
                  ${isDaySelected ? 'border-[#3fcf8e] bg-[#3fcf8e]/5' : ''}
                  ${isCurrentDay ? 'border-[#3fcf8e]' : ''}
                  hover:border-[rgba(0,0,0,0.30)] transition-colors
                `}
                onClick={() => setSelectedDate(day)}
                whileHover={{ scale: 1.02 }}
                transition={snappyTransition}
              >
                <div className="flex justify-between items-start p-1">
                  <span 
                    className={`
                      text-sm font-semibold rounded-full w-6 h-6 flex items-center justify-center
                      ${!isCurrentMonth ? 'text-[#707070]' : i % 7 === 0 ? 'text-red-400' : i % 7 === 6 ? 'text-blue-400' : 'text-[#171717]'}
                      ${isCurrentDay ? 'bg-[#525252] text-white' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </span>
                  
                  {dayTodos.length > 0 && (
                    <Badge className="text-xs px-1.5">{dayTodos.length}</Badge>
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
                      {/* User color indicator */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getUserColor(todo.user_id)}`}></div>
                      
                      <span className="pl-1.5 truncate text-[#171717]">{todo.title}</span>
                      <span className={`ml-auto flex-shrink-0 ${getStatusColor(todo.status)} rounded-sm px-1`}>
                        {getStatusIcon(todo.status)}
                      </span>
                    </div>
                  ))}
                  
                  {/* If there are more than 3 tasks, show a "more" indicator */}
                  {dayTodos.length > 3 && (
                    <div className="text-xs text-[#707070] text-center">
                      +{dayTodos.length - 3} more
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Selected date tasks panel */}
      <AnimatePresence>
        {selectedDate && selectedTodos.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={snappyTransition}
            className="border-t border-[rgba(0,0,0,0.20)] overflow-hidden"
          >
            <div className="p-4">
              <h3 className="text-lg font-medium mb-3">
                Tasks for {format(selectedDate, 'MMMM d, yyyy')}
              </h3>
              
              <div className="space-y-2">
                {selectedTodos.map(todo => (
                  <motion.div
                    key={todo.id}
                    className="bg-[#FDFDFD] p-3 rounded-md border border-[rgba(0,0,0,0.20)]"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={snappyTransition}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`font-medium ${todo.status === 'completed' ? 'line-through text-[#707070]' : 'text-[#171717]'}`}>
                          {todo.title}
                        </h4>
                        
                        {todo.description && (
                          <p className="text-sm text-[#707070] mt-1">{todo.description}</p>
                        )}
                        
                        <div className="flex items-center text-sm text-[#707070] mt-2">
                          <Clock size={12} className="mr-1" />
                          <span>{format(new Date(todo.due_date!), 'HH:mm')}</span>
                          
                          {/* Show user name for team tasks */}
                          {todo.user_id !== userId && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs rounded-sm bg-[#FDFDFD] text-[#171717] border border-[rgba(0,0,0,0.20)]">
                              {todo.user?.full_name?.split(' ')[0] || todo.user?.email?.split('@')[0] || 'Unknown'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Status dropdown for the user's own tasks */}
                      {todo.user_id === userId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Badge className={`${getStatusColor(todo.status)} px-2 py-1 h-6 rounded-sm shadow-sm cursor-pointer flex items-center gap-1 hover:opacity-90 transition-opacity`}>
                              {getStatusIcon(todo.status)}
                              <span className="ml-1 text-xs">
                                {todo.status === 'pending' ? 'Not yet' : 
                                 todo.status === 'in_progress' ? 'Doing' : 'Complete'}
                              </span>
                            </Badge>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            sideOffset={5} 
                            className="bg-[#fcfcfc] border border-[rgba(0,0,0,0.20)] text-[#171717] shadow-[0_0_25px_rgba(0,0,0,0.15)]"
                          >
                            <DropdownMenuItem 
                              onClick={() => updateTodoStatus(todo.id, 'pending')}
                              className={`flex items-center px-3 py-2 text-sm ${todo.status === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'hover:bg-amber-100 hover:text-amber-700 hover:border hover:border-amber-200'}`}
                            >
                              <ListTodo size={14} className="mr-2" />
                              <span>Not yet</span>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              onClick={() => updateTodoStatus(todo.id, 'in_progress')}
                              className={`flex items-center px-3 py-2 text-sm ${todo.status === 'in_progress' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'hover:bg-blue-100 hover:text-blue-700 hover:border hover:border-blue-200'}`}
                            >
                              <Activity size={14} className="mr-2" />
                              <span>Doing</span>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              onClick={() => updateTodoStatus(todo.id, 'completed')}
                              className={`flex items-center px-3 py-2 text-sm ${todo.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-200' : 'hover:bg-green-100 hover:text-green-700 hover:border hover:border-green-200'}`}
                            >
                              <CheckCircle size={14} className="mr-2" />
                              <span>Complete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CalendarView