"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { motion, AnimatePresence } from "framer-motion"
import { Users, ChevronDown, Check } from "lucide-react"
import { InlineSpinner } from "@/components/ui/UnifiedSpinner"

interface TeamMember {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

interface Subscription {
  id: string
  user_id: string
  subscribed_to_user_id: string
  created_at: string
}

interface TeamMemberSubscriptionProps {
  userId: string
  onSubscriptionChange: (subscribedUserIds: string[]) => void
}

const snappyTransition = {
  type: "spring",
  stiffness: 400,
  damping: 25
}

const TeamMemberSubscription = ({ userId, onSubscriptionChange }: TeamMemberSubscriptionProps) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [subscribedUserIds, setSubscribedUserIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()

  // Fetch team members and current subscriptions
  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Get all users except current user
      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', userId)
      
      if (membersError) {
        console.error('Error fetching team members:', membersError)
        setTeamMembers([])
        setSubscribedUserIds([userId]) // 기본값: 본인만 체크
        return
      }
      
      setTeamMembers(members || [])
      
      // localStorage에서 이전 설정 확인
      const savedSubscriptions = localStorage.getItem(`calendar-subscriptions-${userId}`)
      let defaultSubscriptions: string[] = []
      
      if (savedSubscriptions) {
        // 이전 설정이 있으면 사용
        defaultSubscriptions = JSON.parse(savedSubscriptions)
      } else {
        // 처음 사용자는 본인만 기본 선택
        defaultSubscriptions = [userId]
      }
      
      // Get current user's subscriptions from database
      try {
        const { data: subscriptionsData, error: subscriptionsError } = await supabase
          .from('calendar_subscriptions')
          .select('*')
          .eq('user_id', userId)
        
        if (subscriptionsError) {
          console.error('Error fetching subscriptions:', subscriptionsError)
          setSubscribedUserIds(defaultSubscriptions)
        } else {
          const dbSubscriptions = subscriptionsData?.map(sub => sub.subscribed_to_user_id) || []
          // DB 구독과 본인 ID를 합쳐서 설정
          const finalSubscriptions = [...new Set([userId, ...dbSubscriptions])]
          setSubscribedUserIds(finalSubscriptions)
          
          // localStorage에 저장
          localStorage.setItem(`calendar-subscriptions-${userId}`, JSON.stringify(finalSubscriptions))
        }
      } catch (subError) {
        console.error('Subscription fetch failed:', subError)
        setSubscribedUserIds(defaultSubscriptions)
      }
    } catch (error) {
      console.error('Error in fetchData:', error)
      setTeamMembers([])
      setSubscribedUserIds([userId]) // 기본값: 본인만 체크
    } finally {
      setLoading(false)
    }
  }

  // Load initial data
  useEffect(() => {
    if (userId) {
      fetchData()
    }
  }, [userId])

  // Toggle subscription for a team member
  const toggleSubscription = (memberId: string) => {
    setSubscribedUserIds(prev => {
      let newSubscriptions: string[]
      if (prev.includes(memberId)) {
        newSubscriptions = prev.filter(id => id !== memberId)
      } else {
        newSubscriptions = [...prev, memberId]
      }
      
      // localStorage에 저장
      localStorage.setItem(`calendar-subscriptions-${userId}`, JSON.stringify(newSubscriptions))
      
      return newSubscriptions
    })
  }

  // Save subscriptions to database
  const saveSubscriptions = async () => {
    try {
      setSaving(true)
      
      // Check if calendar_subscriptions table exists, create if not
      try {
        const { error: tableCheckError } = await supabase.rpc('check_table_exists', {
          table_name: 'calendar_subscriptions'
        }).single()
        
        if (tableCheckError && tableCheckError.message.includes('does not exist')) {
          // Create the table
          const { error: createTableError } = await supabase.rpc('create_calendar_subscriptions_table')
          
          if (createTableError) {
            console.error('Error creating calendar_subscriptions table:', createTableError)
            throw createTableError
          }
        }
      } catch (error) {
        console.error('Table check failed:', error)
        // Continue without table check if RPC fails
      }
      
      // Delete existing subscriptions
      const { error: deleteError } = await supabase
        .from('calendar_subscriptions')
        .delete()
        .eq('user_id', userId)
      
      if (deleteError) {
        console.error('Error deleting existing subscriptions:', deleteError)
        throw deleteError
      }
      
      // Insert new subscriptions
      if (subscribedUserIds.length > 0) {
        const newSubscriptions = subscribedUserIds.map(subUserId => ({
          user_id: userId,
          subscribed_to_user_id: subUserId
        }))
        
        const { error: insertError } = await supabase
          .from('calendar_subscriptions')
          .insert(newSubscriptions)
        
        if (insertError) {
          console.error('Error inserting new subscriptions:', insertError)
          throw insertError
        }
      }
      
      // Notify parent component
      onSubscriptionChange(subscribedUserIds)
      
      // localStorage에도 저장
      localStorage.setItem(`calendar-subscriptions-${userId}`, JSON.stringify(subscribedUserIds))
      
      toast.success('Team member subscriptions updated!')
    } catch (error) {
      console.error('Error saving subscriptions:', error)
      toast.error('Failed to save subscriptions')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-[#fcfcfc] rounded-xl shadow-md border border-[rgba(0,0,0,0.20)] p-4">
        <div className="flex items-center justify-center py-8">
          <InlineSpinner className="w-6 h-6" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#fcfcfc] rounded-xl shadow-md border border-[rgba(0,0,0,0.20)]">
      <div className="p-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent focus:outline-none focus:ring-0 border-0 bg-transparent cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#171717]" />
            <span className="text-sm text-[#171717]">Subscription</span>
          </div>
          <ChevronDown 
            size={16} 
            className={`text-[#707070] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={snappyTransition}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3">
                {/* My Tasks 옵션 추가 */}
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="my-tasks"
                    checked={subscribedUserIds.includes(userId)}
                    onCheckedChange={() => toggleSubscription(userId)}
                    className="data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center overflow-hidden ring-2 ring-sky-200 ring-offset-1 shadow-sm">
                      <span className="text-xs font-medium text-sky-700">
                        Me
                      </span>
                    </div>
                    <label htmlFor="my-tasks" className="flex-1 cursor-pointer">
                      <div className="text-sm font-medium text-gray-cool-700 font-dm-sans">
                        My Tasks
                      </div>
                      <div className="text-xs text-gray-cool-500 font-dm-sans">Show your own tasks</div>
                    </label>
                  </div>
                </div>
                
                {teamMembers.length === 0 ? (
                  <p className="text-sm text-gray-cool-500 font-dm-sans">No team members found</p>
                ) : (
                  teamMembers.map(member => (
                    <div key={member.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={member.id}
                        checked={subscribedUserIds.includes(member.id)}
                        onCheckedChange={() => toggleSubscription(member.id)}
                        className="data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden ring-2 ring-gray-cool-200 ring-offset-1 shadow-sm">
                          {member.avatar_url ? (
                            <img 
                              src={member.avatar_url} 
                              alt={member.full_name || member.email}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium text-gray-cool-700">
                              {(member.full_name || member.email).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <label htmlFor={member.id} className="flex-1 cursor-pointer">
                          <div className="text-sm font-medium text-gray-cool-700 font-dm-sans">
                            {member.full_name || member.email}
                          </div>
                          {member.full_name && (
                            <div className="text-xs text-gray-cool-500 font-dm-sans">{member.email}</div>
                          )}
                        </label>
                      </div>
                    </div>
                  ))
                )}
                
                <div className="pt-3 border-t border-gray-cool-200">
                  <Button
                    onClick={saveSubscriptions}
                    disabled={saving}
                    className="w-full bg-sky-500 hover:bg-sky-600 text-white font-dm-sans"
                  >
                    {saving ? (
                      <div className="flex items-center gap-2">
                        <InlineSpinner className="w-4 h-4" />
                        Saving...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Check size={16} />
                        Save Changes
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default TeamMemberSubscription