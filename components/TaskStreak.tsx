"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { format, subDays, isToday, isYesterday, eachDayOfInterval } from "date-fns"
import { Flame, Trophy, Calendar, Star } from "lucide-react"

interface TaskStreakProps {
  userId: string
  className?: string
}

export default function TaskStreak({ userId, className }: TaskStreakProps) {
  const [currentStreak, setCurrentStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [todayContributed, setTodayContributed] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const calculateStreak = async () => {
      if (!userId) return
      
      try {
        setLoading(true)
        
        // Get activity for past 90 days
        const startDate = subDays(new Date(), 90)
        const { data, error } = await supabase
          .from('todos')
          .select('updated_at, status')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .gte('updated_at', startDate.toISOString())
          .order('updated_at', { ascending: false })
        
        if (error) {
          console.error('Error fetching streak data:', error)
          throw error
        }
        
        if (!data || data.length === 0) {
          setCurrentStreak(0)
          setLongestStreak(0)
          setTodayContributed(false)
          return
        }
        
        // Get unique contribution dates (only count each day once)
        const contributionDates = [...new Set(
          data.map(item => format(new Date(item.updated_at), 'yyyy-MM-dd'))
        )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        
        // Check if user contributed today
        const today = format(new Date(), 'yyyy-MM-dd')
        const hasContributedToday = contributionDates.includes(today)
        setTodayContributed(hasContributedToday)
        
        // Calculate current streak
        let streak = hasContributedToday ? 1 : 0
        let previousDate = hasContributedToday ? subDays(new Date(), 1) : new Date()
        
        for (let i = hasContributedToday ? 1 : 0; i < contributionDates.length; i++) {
          const currentDate = format(previousDate, 'yyyy-MM-dd')
          
          if (contributionDates.includes(currentDate)) {
            streak++
            previousDate = subDays(previousDate, 1)
          } else {
            // Break the streak if a day is missed, but only if we've moved past today
            if (hasContributedToday || i > 0) {
              break
            }
            previousDate = subDays(previousDate, 1)
          }
        }
        
        // Calculate longest streak
        let longestStrk = 0
        let currentStrk = 0
        let prevDate: Date | null = null
        
        // Convert string dates to Date objects for proper comparison
        const sortedDates = contributionDates
          .map(date => new Date(date))
          .sort((a, b) => a.getTime() - b.getTime())
        
        for (let i = 0; i < sortedDates.length; i++) {
          const currentDate = sortedDates[i]
          
          if (prevDate === null) {
            currentStrk = 1
          } else {
            // Check if dates are consecutive
            const prevDay = prevDate.getDate()
            const prevMonth = prevDate.getMonth()
            const prevYear = prevDate.getFullYear()
            
            const currDay = currentDate.getDate()
            const currMonth = currentDate.getMonth()
            const currYear = currentDate.getFullYear()
            
            const isConsecutive = 
              (currDay - prevDay === 1 && currMonth === prevMonth && currYear === prevYear) ||
              (currDay === 1 && prevDay >= 28 && currMonth - prevMonth === 1 && currYear === prevYear) ||
              (currDay === 1 && prevDay >= 28 && currMonth === 0 && prevMonth === 11 && currYear - prevYear === 1)
            
            if (isConsecutive) {
              currentStrk++
            } else {
              currentStrk = 1
            }
          }
          
          if (currentStrk > longestStrk) {
            longestStrk = currentStrk
          }
          
          prevDate = currentDate
        }
        
        setCurrentStreak(streak)
        setLongestStreak(longestStrk)
      } catch (err) {
        console.error('Error calculating streak:', err)
      } finally {
        setLoading(false)
      }
    }
    
    calculateStreak()
    
    // Subscribe to real-time changes to update streak
    const streakChannel = `streak-${userId}-${Date.now()}`
    const subscription = supabase
      .channel(streakChannel)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'todos',
        filter: `user_id=eq.${userId} AND status=eq.completed`
      }, () => {
        // Update streak when completed todos change
        calculateStreak()
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(subscription)
    }
  }, [userId, supabase])
  
  const getStreakColor = (streak: number) => {
    if (streak === 0) return 'bg-[#292C33] text-gray-400'
    if (streak < 3) return 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
    if (streak < 7) return 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
    if (streak < 14) return 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
    if (streak < 30) return 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
    return 'bg-gradient-to-r from-orange-600 to-red-600 text-white'
  }
  
  const getStreakEmoji = (streak: number) => {
    if (streak === 0) return ''
    if (streak < 3) return '🔥'
    if (streak < 7) return '🔥🔥'
    if (streak < 14) return '🔥🔥🔥'
    if (streak < 30) return '🏆'
    return '🏆🔥'
  }
  
  if (loading) {
    return (
      <div className={`animate-pulse bg-[#323741] rounded-xl p-5 ${className}`}>
        <div className="w-full h-16 bg-[#3A3F4B] rounded-md"></div>
      </div>
    )
  }
  
  return (
    <div className={`bg-[#292C33] rounded-xl overflow-hidden shadow-md border border-[#464c58]/20 p-5 ${className}`}>
      <h3 className="text-base text-white mb-4 flex items-center uppercase tracking-[.1em] leading-[1.5rem] font-[600] font-['Inter']">
        <Flame size={16} className="mr-2 text-orange-400" />
        PRODUCTIVITY STREAK
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="relative overflow-hidden rounded-lg border border-[#464c58]/20 p-4 bg-[#1F2125]/80">
          <div className="flex flex-col items-center z-10 relative">
            <div className={`w-16 h-16 rounded-full mb-2 flex items-center justify-center text-xl font-bold ${getStreakColor(currentStreak)}`}>
              {currentStreak}
            </div>
            <h4 className="text-sm text-gray-300 font-medium">Current Streak</h4>
            <p className="text-xs text-gray-400 mt-1">
              {currentStreak > 0 
                ? `${getStreakEmoji(currentStreak)} ${currentStreak} day${currentStreak === 1 ? '' : 's'} in a row!` 
                : 'Complete a task today to start!'}
            </p>
            
            {!todayContributed && (
              <motion.div 
                className="mt-2 bg-[#292C33] rounded-full px-3 py-1 text-xs text-white border border-[#464c58]/20"
                initial={{ scale: 0.9, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  repeat: Infinity, 
                  repeatType: "reverse", 
                  duration: 1.5 
                }}
              >
                <Calendar size={12} className="inline mr-1" />
                Complete a task today!
              </motion.div>
            )}
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-lg border border-[#464c58]/20 p-4 bg-[#1F2125]/80">
          <div className="flex flex-col items-center z-10 relative">
            <div className={`w-16 h-16 rounded-full mb-2 flex items-center justify-center text-xl font-bold ${getStreakColor(longestStreak)}`}>
              {longestStreak}
            </div>
            <h4 className="text-sm text-gray-300 font-medium">Longest Streak</h4>
            <p className="text-xs text-gray-400 mt-1">
              {longestStreak > 0 
                ? `${getStreakEmoji(longestStreak)} ${longestStreak} day${longestStreak === 1 ? '' : 's'} record!` 
                : 'Complete tasks regularly to build a streak!'}
            </p>
            
            {currentStreak > 0 && currentStreak === longestStreak && (
              <motion.div 
                className="mt-2 bg-[#292C33] rounded-full px-3 py-1 text-xs text-amber-300 border border-amber-700/30"
                initial={{ rotate: -3 }}
                animate={{ rotate: 3 }}
                transition={{ 
                  repeat: Infinity, 
                  repeatType: "reverse", 
                  duration: 1.5 
                }}
              >
                <Star size={12} className="inline mr-1" />
                New record in progress!
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}