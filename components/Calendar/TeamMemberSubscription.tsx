"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { motion, AnimatePresence } from "framer-motion"
import { Users, ChevronDown, Check } from "lucide-react"
import { toast } from "sonner"

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
  stiffness: 500,
  damping: 30,
  mass: 1,
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
        throw membersError
      }
      
      // Get current user's subscriptions
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('calendar_subscriptions')
        .select('*')
        .eq('user_id', userId)
      
      if (subscriptionsError) {
        // If table doesn't exist yet, handle gracefully
        if (subscriptionsError.code === '42P01') {
          console.warn('Calendar subscriptions table does not exist yet')
          setSubscriptions([])
        } else {
          console.error('Error fetching calendar subscriptions:', subscriptionsError)
          throw subscriptionsError
        }
      } else {
        setSubscriptions(subscriptionsData || [])
        
        // Extract subscribed user IDs
        const subUserIds = subscriptionsData?.map(sub => sub.subscribed_to_user_id) || []
        setSubscribedUserIds(subUserIds)
        
        // Notify parent component
        onSubscriptionChange(subUserIds)
      }
      
      setTeamMembers(members || [])
    } catch (error) {
      console.error('Error loading subscription data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load initial data
  useEffect(() => {
    fetchData()
  }, [userId])

  // Toggle subscription for a team member
  const toggleSubscription = (memberId: string) => {
    setSubscribedUserIds(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId)
      } else {
        return [...prev, memberId]
      }
    })
  }

  // Save subscription changes
  const saveSubscriptions = async () => {
    try {
      setSaving(true)
      
      // Check if calendar_subscriptions table exists, create if not
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
      
      // Delete existing subscriptions
      const { error: deleteError } = await supabase
        .from('calendar_subscriptions')
        .delete()
        .eq('user_id', userId)
      
      if (deleteError) {
        console.error('Error deleting existing subscriptions:', deleteError)
        throw deleteError
      }
      
      // Add new subscriptions
      if (subscribedUserIds.length > 0) {
        const newSubscriptions = subscribedUserIds.map(subUserId => ({
          user_id: userId,
          subscribed_to_user_id: subUserId,
        }))
        
        const { error: insertError } = await supabase
          .from('calendar_subscriptions')
          .insert(newSubscriptions)
        
        if (insertError) {
          console.error('Error inserting new subscriptions:', insertError)
          throw insertError
        }
      }
      
      // Refresh subscriptions
      await fetchData()
      
      // Notify parent component of changes
      onSubscriptionChange(subscribedUserIds)
      
      toast.success('Calendar subscriptions updated', {
        position: 'top-center'
      })
    } catch (error) {
      console.error('Error saving subscriptions:', error)
      toast.error('Failed to update subscriptions', {
        position: 'top-center'
      })
    } finally {
      setSaving(false)
    }
  }

  // Toggle selecting all team members
  const toggleSelectAll = () => {
    if (subscribedUserIds.length === teamMembers.length) {
      // Deselect all
      setSubscribedUserIds([])
    } else {
      // Select all
      setSubscribedUserIds(teamMembers.map(member => member.id))
    }
  }

  // Get initials for an avatar
  const getInitials = (name: string | null, email: string): string => {
    if (name) {
      const nameParts = name.split(' ')
      if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      }
      return name[0].toUpperCase()
    }
    return email[0].toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-[#171717] p-2">
        <div className="w-5 h-5 border-t-2 border-l-2 border-[#3fcf8e] rounded-full animate-spin"></div>
        <span>Loading subscriptions...</span>
      </div>
    )
  }

  return (
    <div className="bg-[#fcfcfc] rounded-xl overflow-hidden shadow-md border border-[rgba(0,0,0,0.20)] text-[#171717]">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <Users size={18} className="mr-2" />
          <h3 className="font-medium">Subscription</h3>
        </div>
        <ChevronDown 
          size={18} 
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={snappyTransition}
          >
            <div className="px-4 pb-4 border-t border-[rgba(0,0,0,0.20)]">
              {teamMembers.length === 0 ? (
                <div className="py-4 text-center text-[#707070]">
                  No team members available
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center py-2 mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectAll}
                      className="text-xs px-2 py-1 h-7 bg-[#FDFDFD] text-[#171717] hover:bg-[#3fcf8e] hover:text-white outline outline-1 outline-[rgba(0,0,0,0.20)] outline-offset-[-1px] rounded-md"
                    >
                      {subscribedUserIds.length === teamMembers.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      onClick={saveSubscriptions}
                      disabled={saving}
                      className="text-xs px-3 py-1 h-7 bg-[#3fcf8e] hover:bg-[#3fcf8e]/90 text-white flex items-center gap-1 outline outline-1 outline-[rgba(0,0,0,0.20)] outline-offset-[-1px] rounded-md"
                    >
                      {saving ? (
                        <>
                          <div className="w-3 h-3 border-t-2 border-l-2 border-white rounded-full animate-spin mr-1"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check size={12} />
                          <span>Save Preferences</span>
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {teamMembers.map(member => (
                      <motion.div
                        key={member.id}
                        className="flex items-center justify-between p-2 bg-[#FDFDFD] rounded-md hover:bg-[#3fcf8e]/10 transition-colors border border-[rgba(0,0,0,0.10)]"
                        whileHover={{ scale: 1.01 }}
                        transition={snappyTransition}
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-[#FDFDFD] border border-[rgba(0,0,0,0.20)] flex items-center justify-center text-xs mr-3 text-[#171717]">
                            {member.avatar_url ? (
                              <img 
                                src={member.avatar_url}
                                alt={member.full_name || member.email}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              getInitials(member.full_name, member.email)
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {member.full_name || member.email.split('@')[0]}
                            </div>
                            {member.full_name && (
                              <div className="text-xs text-[#707070]">{member.email}</div>
                            )}
                          </div>
                        </div>
                        
                        <Checkbox
                          checked={subscribedUserIds.includes(member.id)}
                          onCheckedChange={() => toggleSubscription(member.id)}
                          className="data-[state=checked]:bg-[#3fcf8e] data-[state=checked]:border-[#3fcf8e]"
                        />
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TeamMemberSubscription