"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  CheckCircle,
  Activity,
  ListTodo,
  X,
  Eye,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import TeamMemberSubscription from "./TeamMemberSubscription"
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

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

interface MobileCalendarViewProps {
  user: UserProfile | null
}

const snappyTransition = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 1,
}

const MobileCalendarView = ({ user }: MobileCalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [todos, setTodos] = useState<Todo[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTodos, setSelectedTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompletedTasks, setShowCompletedTasks] = useState(true)
  const [subscribedUserIds, setSubscribedUserIds] = useState<string[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [expandedTodo, setExpandedTodo] = useState<string | null>(null)
  const supabase = createClient()

  // Calculate calendar days for month view
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
    if (!user) return
    
    try {
      setLoading(true)
      
      let userIds = [user.id]
      if (subscribedUserIds && subscribedUserIds.length > 0) {
        userIds = [...userIds, ...subscribedUserIds]
      }
      
      let query = supabase
        .from('todos')
        .select(`
          *,
          user:profiles(full_name, email)
        `)
        .not('due_date', 'is', null)
        .in('user_id', userIds)
        .order('due_date', { ascending: true })
      
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

  // Handle subscription changes
  const handleSubscriptionChange = (userIds: string[]) => {
    setSubscribedUserIds(userIds)
    setRefreshTrigger(prev => prev + 1)
  }

  // Update todos when filters change
  useEffect(() => {
    fetchTodos()

    // Set up real-time subscription
    if (user) {
      const calendarChannel = supabase
        .channel(`calendar-updates-${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'todos',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchTodos()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(calendarChannel)
      }
    }
  }, [user, showCompletedTasks, subscribedUserIds, refreshTrigger])

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

  // Navigation handlers
  const prevMonth = () => setCurrentDate(prev => addMonths(prev, -1))
  const nextMonth = () => setCurrentDate(prev => addMonths(prev, 1))
  const goToToday = () => setCurrentDate(new Date())

  // Get status color for badges (consistent with existing design)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-[#FFDA40] text-black'
      case 'in_progress':
        return 'bg-[#FF82C2] text-black'
      case 'completed':
        return 'bg-light-accent text-black'
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

  // Get user color based on userID (consistent with existing design)
  const getUserColor = (userId: string) => {
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

  if (!user) {
    return (
      <div className="flex justify-center items-center p-8 text-light-primary">
        <div className="text-center">
          <p className="text-lg font-medium">Please log in to view your calendar</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 text-light-primary">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-light-accent rounded-full animate-spin mb-2"></div>
          <p className="text-lg font-medium">Loading Calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen flex flex-col bg-light-background animate-fadeIn">
      {/* Top Header - matching existing design */}
      <div className="bg-light-background border-b border-light-border px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-lg font-semibold text-light-primary font-dm-sans">
          {format(currentDate, 'MMMM yyyy')}
        </h1>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevMonth}
            className="h-8 w-8 p-0 bg-light-input text-light-primary hover:bg-light-accent hover:text-white border border-light-border rounded-md"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="h-8 px-3 text-xs bg-light-input text-light-primary hover:bg-light-accent hover:text-white border border-light-border rounded-md"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextMonth}
            className="h-8 w-8 p-0 bg-light-input text-light-primary hover:bg-light-accent hover:text-white border border-light-border rounded-md"
          >
            <ChevronRight size={16} />
          </Button>
          
          {/* Hamburger Menu - matching existing design */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 bg-light-input text-light-primary hover:bg-light-accent hover:text-white border border-light-border rounded-md"
              >
                <Menu size={16} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] p-0 bg-light-background">
              <SheetHeader className="p-4 border-b border-light-border">
                <SheetTitle className="text-light-primary font-dm-sans">Calendar Settings</SheetTitle>
              </SheetHeader>
              
              <div className="p-4 space-y-4">
                {/* Show completed tasks toggle */}
                <div className="bg-light-background rounded-xl shadow-md border border-light-border p-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-completed-mobile"
                      checked={showCompletedTasks}
                      onCheckedChange={setShowCompletedTasks}
                      className="data-[state=checked]:bg-light-accent"
                    />
                    <Label htmlFor="show-completed-mobile" className="text-sm text-light-primary flex items-center font-dm-sans">
                      <Eye size={14} className="mr-1" />
                      Show completed tasks
                    </Label>
                  </div>
                </div>
                
                {/* Team Member Subscription */}
                <div>
                  <React.Suspense fallback={
                    <div className="flex items-center justify-center p-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-light-accent"></div>
                    </div>
                  }>
                    <TeamMemberSubscription
                      userId={user.id}
                      onSubscriptionChange={handleSubscriptionChange}
                    />
                  </React.Suspense>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Calendar Grid - Full width design */}
      <div className="flex-1 overflow-auto">
        {/* Day names header */}
        <div className="grid grid-cols-7 bg-light-background border-b border-light-border sticky top-0 z-10">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <div 
              key={day} 
              className={`text-center py-3 text-sm font-medium font-dm-sans ${
                index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-light-muted'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days - Full width grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const dayTodos = getTodosForDay(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isDaySelected = selectedDate && isSameDay(day, selectedDate)
            const isCurrentDay = isToday(day)
            
            return (
              <motion.div
                key={i}
                className={`
                  min-h-[90px] p-2 border-r border-b border-light-border cursor-pointer bg-light-background
                  ${!isCurrentMonth ? 'bg-gray-50/50' : ''} 
                  ${isDaySelected ? 'bg-light-accent/10 border-light-accent' : ''}
                  ${isCurrentDay ? 'bg-blue-50/50' : ''}
                  hover:bg-light-accent/5 transition-colors
                `}
                onClick={() => setSelectedDate(day)}
                whileHover={{ scale: 1.01 }}
                transition={snappyTransition}
              >
                <div className="flex justify-between items-start mb-2">
                  <span 
                    className={`
                      text-sm font-semibold rounded-full w-7 h-7 flex items-center justify-center font-dm-sans
                      ${!isCurrentMonth ? 'text-light-muted' : i % 7 === 0 ? 'text-red-400' : i % 7 === 6 ? 'text-blue-400' : 'text-light-primary'}
                      ${isCurrentDay ? 'bg-light-secondary text-white' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </span>
                  
                  {dayTodos.length > 0 && (
                    <div className="w-5 h-5 bg-light-accent text-white rounded-full flex items-center justify-center text-xs font-medium font-dm-sans">
                      {dayTodos.length}
                    </div>
                  )}
                </div>
                
                {/* Task indicators */}
                <div className="space-y-1">
                  {dayTodos.slice(0, 2).map(todo => (
                    <div
                      key={todo.id}
                      className={`text-xs p-1.5 rounded-md flex items-center gap-2 ${
                        todo.status === 'completed' 
                          ? 'bg-light-accent/10 border border-light-accent/20' 
                          : 'bg-light-input border border-light-border'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getUserColor(todo.user_id)}`}></div>
                      <span className="truncate flex-1 text-light-primary font-dm-sans">{todo.title}</span>
                    </div>
                  ))}
                  
                  {dayTodos.length > 2 && (
                    <div className="text-xs text-light-muted text-center font-dm-sans">
                      +{dayTodos.length - 2}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Selected Date Tasks (Bottom Sheet) - matching existing design */}
      <AnimatePresence>
        {selectedDate && selectedTodos.length > 0 && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="bg-light-background border-t border-light-border max-h-[45vh] overflow-hidden shadow-lg"
            transition={snappyTransition}
          >
            <div className="p-4 border-b border-light-border flex items-center justify-between">
              <h3 className="text-lg font-medium text-light-primary font-dm-sans">
                {format(selectedDate, 'MMMM d, yyyy')}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(null)}
                className="h-8 w-8 p-0 text-light-muted hover:text-light-primary hover:bg-light-input"
              >
                <X size={16} />
              </Button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(45vh-60px)]">
              <div className="p-4 space-y-3">
                {selectedTodos.map(todo => (
                  <motion.div
                    key={todo.id}
                    className="bg-light-background rounded-xl border border-light-border overflow-hidden shadow-sm"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={snappyTransition}
                  >
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                      onClick={() => setExpandedTodo(expandedTodo === todo.id ? null : todo.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${getUserColor(todo.user_id)}`}></div>
                            <h4 className={`font-medium text-sm font-dm-sans ${
                              todo.status === 'completed' ? 'line-through text-light-muted' : 'text-light-primary'
                            }`}>
                              {todo.title}
                            </h4>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {todo.user_id !== user?.id && (
                              <span className="px-2 py-1 text-xs rounded-sm bg-light-input text-light-primary border border-light-border font-dm-sans">
                                {todo.user?.full_name?.split(' ')[0] || todo.user?.email?.split('@')[0] || 'Unknown'}
                              </span>
                            )}
                            
                            <Badge className={`${getStatusColor(todo.status)} px-2 py-1 text-xs flex items-center gap-1 font-dm-sans`}>
                              {getStatusIcon(todo.status)}
                              <span>
                                {todo.status === 'pending' ? 'Not yet' : 
                                 todo.status === 'in_progress' ? 'Doing' : 'Complete'}
                              </span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded content */}
                      <AnimatePresence>
                        {expandedTodo === todo.id && todo.description && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-3 pt-3 border-t border-light-border"
                            transition={snappyTransition}
                          >
                            <p className="text-sm text-light-muted font-dm-sans">{todo.description}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
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

export default MobileCalendarView