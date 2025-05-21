"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import CalendarView from "./CalendarView"
import TeamMemberSubscription from "./TeamMemberSubscription"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Calendar, Eye, Users } from "lucide-react"

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

  if (!user) {
    return (
      <div className="flex justify-center items-center p-8 text-[#171717]">
        <div className="text-center">
          <p className="text-lg font-medium">Please log in to view your calendar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-sm font-medium text-[#171717] uppercase tracking-[.1em] leading-[1.5rem] font-[600] font-['Inter'] flex items-center">
          <Calendar className="mr-2" size={16} />
          CALENDAR
        </h1>
        
        <div className="flex items-center space-x-6">
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
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main calendar view */}
        <div className="lg:col-span-3">
          <CalendarView
            userId={user.id}
            onTaskUpdate={handleTaskUpdate}
            showCompletedTasks={showCompletedTasks}
            subscribedUserIds={subscribedUserIds}
          />
        </div>
        
        {/* Sidebar with subscription controls */}
        <div className="lg:col-span-1 space-y-6">
          <TeamMemberSubscription
            userId={user.id}
            onSubscriptionChange={handleSubscriptionChange}
          />
        </div>
      </div>
    </div>
  )
}

export default CalendarPage