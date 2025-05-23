"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import CalendarView from "./CalendarView"
import MobileCalendarView from "./MobileCalendarView"
import TeamMemberSubscription from "./TeamMemberSubscription"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar, Eye, Users, ListTodo, Activity, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { useIsMobile } from "@/hooks/use-mobile"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

interface CalendarPageProps {
  user: UserProfile | null
}

const CalendarPage = ({ user }: CalendarPageProps) => {
  const [showCompletedTasks, setShowCompletedTasks] = useState(true)
  const [subscribedUserIds, setSubscribedUserIds] = useState<string[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTodos, setSelectedTodos] = useState<any[]>([])
  const isMobile = useIsMobile()
  const supabase = createClient()

  // Handle subscription changes
  const handleSubscriptionChange = (userIds: string[]) => {
    setSubscribedUserIds(userIds)
    setRefreshTrigger(prev => prev + 1)
  }

  // Handle task updates
  const handleTaskUpdate = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Handle selected date change
  const handleSelectedDateChange = useCallback((date: Date | null, todos: any[]) => {
    setSelectedDate(date)
    setSelectedTodos(todos)
  }, [])

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

  if (!user) {
    return (
      <div className="flex justify-center items-center p-8 text-[#171717]">
        <div className="text-center">
          <p className="text-lg font-medium">Please log in to view your calendar</p>
        </div>
      </div>
    )
  }

  // Use mobile view for mobile devices
  if (isMobile) {
    return <MobileCalendarView user={user} />
  }

  return (
    <div className="w-full animate-fadeIn mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-sm font-medium text-[#171717] uppercase tracking-[.1em] leading-[1.5rem] font-[600] font-['Inter'] flex items-center">
          <Calendar className="mr-2" size={16} />
          CALENDAR
        </h1>
      </div>
      
      <div className="grid grid-cols-1 2xl:grid-cols-[1fr_400px] gap-6">
        {/* Main calendar view - flexible width */}
        <div className="order-2 2xl:order-1">
          <CalendarView
            userId={user.id}
            onTaskUpdate={handleTaskUpdate}
            showCompletedTasks={showCompletedTasks}
            subscribedUserIds={subscribedUserIds}
            onSelectedDateChange={handleSelectedDateChange}
          />
        </div>
        
        {/* Sidebar with controls and selected date tasks - fixed width */}
        <div className="space-y-4 order-1 2xl:order-2">
          {/* Team Member Subscription */}
          <div>
            <TeamMemberSubscription
              userId={user.id}
              onSubscriptionChange={handleSubscriptionChange}
            />
          </div>
          
          {/* Settings */}
          <div className="bg-[#fcfcfc] rounded-xl shadow-md border border-[rgba(0,0,0,0.20)] p-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-completed"
                checked={showCompletedTasks}
                onCheckedChange={setShowCompletedTasks}
                className="data-[state=checked]:bg-[#3fcf8e]"
              />
              <Label htmlFor="show-completed" className="text-sm text-[#171717] flex items-center">
                <Eye size={14} className="mr-1" />
                Show completed tasks
              </Label>
            </div>
          </div>
          
          {/* Selected date tasks */}
          <AnimatePresence>
            {selectedDate && selectedTodos.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-[#fcfcfc] rounded-xl overflow-hidden shadow-md border border-[rgba(0,0,0,0.20)]"
              >
                <div className="p-4">
                  <h3 className="text-lg font-medium mb-3 text-[#171717]">
                    Tasks for {format(selectedDate, 'MMMM d, yyyy')}
                  </h3>
                  
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {selectedTodos.map(todo => (
                      <motion.div
                        key={todo.id}
                        className="bg-white p-3 rounded-md border border-[rgba(0,0,0,0.10)]"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className={`font-medium text-sm ${todo.status === 'completed' ? 'line-through text-[#707070]' : 'text-[#171717]'}`}>
                              {todo.title}
                            </h4>
                            
                            {todo.description && (
                              <p className="text-xs text-[#707070] mt-1 line-clamp-2">{todo.description}</p>
                            )}
                            
                            <div className="flex items-center gap-2 mt-2">
                              {/* Show due date */}
                              {todo.due_date && (
                                <span className="text-xs text-gray-600">
                                  Due: {format(new Date(todo.due_date), 'yy-MM-dd')}
                                </span>
                              )}
                              
                              {/* Show user name for team tasks */}
                              {todo.user_id !== user?.id && (
                                <span className="px-2 py-1 text-xs rounded-sm bg-[#f5f5f5] text-[#171717] border border-[rgba(0,0,0,0.10)]">
                                  {todo.user?.full_name?.split(' ')[0] || todo.user?.email?.split('@')[0] || 'Unknown'}
                                </span>
                              )}
                              
                              <Badge className={`${getStatusColor(todo.status)} px-2 py-1 text-xs flex items-center gap-1`}>
                                {getStatusIcon(todo.status)}
                                <span>
                                  {todo.status === 'pending' ? 'Not yet' : 
                                   todo.status === 'in_progress' ? 'Doing' : 'Complete'}
                                </span>
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default CalendarPage