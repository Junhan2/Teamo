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
      <div className="flex justify-center items-center p-8 text-white">
        <div className="text-center">
          <p className="text-lg font-medium">Please log in to view your calendar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-sm font-medium text-white uppercase tracking-[.1em] leading-[1.5rem] font-[600] font-['Inter'] flex items-center">
          <Calendar className="mr-2" size={16} />
          CALENDAR
        </h1>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-completed"
              checked={showCompletedTasks}
              onCheckedChange={setShowCompletedTasks}
              className="data-[state=checked]:bg-[#5AD363]"
            />
            <Label htmlFor="show-completed" className="text-sm text-white flex items-center">
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
          
          <div className="bg-[#292C33] rounded-xl overflow-hidden shadow-md border border-[#464c58]/20 p-4 text-white">
            <div className="flex items-center mb-3">
              <Users size={18} className="mr-2" />
              <h3 className="font-medium">Subscription Info</h3>
            </div>
            
            <p className="text-sm text-gray-300 mb-3">
              Subscribe to team members to view their tasks on your calendar. This helps you coordinate work and deadlines.
            </p>
            
            <div className="text-sm text-gray-400">
              <div className="flex items-start mb-2">
                <span className="font-medium mr-1">•</span>
                <span>You are currently subscribed to {subscribedUserIds.length} team member{subscribedUserIds.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-start mb-2">
                <span className="font-medium mr-1">•</span>
                <span>Tasks from subscribed members appear in your calendar with color-coded indicators</span>
              </div>
              <div className="flex items-start">
                <span className="font-medium mr-1">•</span>
                <span>You can view details but only edit your own tasks</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarPage