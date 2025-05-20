"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { format, subDays, eachDayOfInterval } from "date-fns"

interface ContributionGraphProps {
  userId: string
  days?: number // Number of days to show
}

interface DayContribution {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4 // Activity level for color intensity
}

export default function ContributionGraph({ userId, days = 90 }: ContributionGraphProps) { // Changed to 90 days (~ 3 months)
  const [contributions, setContributions] = useState<DayContribution[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  // Generate dates for the last 'days' days
  const generateDateRange = () => {
    const today = new Date()
    const startDate = subDays(today, days - 1)
    
    return eachDayOfInterval({
      start: startDate,
      end: today
    }).map(date => format(date, 'yyyy-MM-dd'))
  }
  
  useEffect(() => {
    const fetchContributions = async () => {
      try {
        setLoading(true)
        const dateRange = generateDateRange()
        
        // Fetch user activity data from todos table
        const { data: todoData, error: todoError } = await supabase
          .from('todos')
          .select('created_at, updated_at, status')
          .eq('user_id', userId)
        
        if (todoError) {
          console.error('Error fetching contribution data:', todoError)
          throw todoError
        }
        
        // Count activities by date
        const activityByDate: Record<string, number> = {}
        
        // Initialize all dates with 0 count
        dateRange.forEach(date => {
          activityByDate[date] = 0
        })
        
        // Process todo creations and completions
        todoData?.forEach(todo => {
          // Created date
          const createdDate = format(new Date(todo.created_at), 'yyyy-MM-dd')
          if (activityByDate[createdDate] !== undefined) {
            activityByDate[createdDate] += 1
          }
          
          // Status updates for all types
          if (todo.updated_at) {
            // Count all status updates (pending, in_progress, completed)
            const updatedDate = format(new Date(todo.updated_at), 'yyyy-MM-dd')
            if (activityByDate[updatedDate] !== undefined) {
              activityByDate[updatedDate] += 1
            }
          }
        })
        
        // Determine color level based on task completion count
        const contributionData: DayContribution[] = dateRange.map(date => {
          const count = activityByDate[date] || 0
          let level: 0 | 1 | 2 | 3 | 4 = 0
          
          if (count === 0) level = 0
          else if (count === 1) level = 1
          else if (count === 2) level = 2
          else if (count <= 4) level = 3
          else if (count >= 10) level = 4
          else level = 3
          
          return {
            date,
            count,
            level
          }
        })
        
        setContributions(contributionData)
      } catch (err) {
        console.error('Error processing contribution data:', err)
      } finally {
        setLoading(false)
      }
    }
    
    if (userId) {
      fetchContributions()
    }
  }, [userId, days, supabase])
  
  // Group contributions into weeks
  const weeks = []
  for (let i = 0; i < contributions.length; i += 7) {
    weeks.push(contributions.slice(i, i + 7))
  }
  
  // 툴팁은 이제 CSS absolute positioning으로 처리

  // Get color based on activity level
  const getLevelColor = (level: number) => {
    switch(level) {
      case 0: return 'bg-[#1a1a27] border border-[#2a2a3c]/30'
      case 1: return 'bg-green-900/60 border border-green-800/30'
      case 2: return 'bg-green-800/70 border border-green-700/30'
      case 3: return 'bg-green-700/80 border border-green-600/30'
      case 4: return 'bg-green-600/90 border border-green-500/30'
      default: return 'bg-[#1a1a27] border border-[#2a2a3c]/30'
    }
  }
  
  if (loading) {
    return (
      <div className="animate-pulse bg-[#1a1a27]/50 h-24 rounded-xl"></div>
    )
  }
  
  return (
    <div className="mb-8" style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
      <div className="flex flex-col gap-1" style={{ overflow: 'visible' }}>
        <div className="bg-[#1a1a27]/40 p-5 rounded-xl border border-[#2a2a3c] relative" style={{ overflow: 'visible', zIndex: 1 }}>
          <div className="flex gap-1.5 flex-wrap justify-center py-4">
            {/* 네모칸 상하 여백 추가 */}
            {weeks.map((week, weekIndex) => (
              <div key={`week-${weekIndex}`} className="flex flex-col gap-1.5">
                {week.map((day, dayIndex) => (
                  <motion.div
                    key={`day-${weekIndex}-${dayIndex}`}
                    className={`w-3.5 h-3.5 rounded-sm ${getLevelColor(day.level)} relative group hover:z-[5]`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: (weekIndex * 7 + dayIndex) * 0.005 }}
                    whileHover={{ scale: 1.2 }}
                    id={`day-${day.date}`}
                  >
                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-[9999] pointer-events-none" 
                         style={{ 
                           bottom: '140%', 
                           left: '-4rem', 
                           width: '8rem',
                           display: 'flex',
                           justifyContent: 'center'
                         }}>
                      <div className="bg-[#0a0a10] shadow-xl rounded-md px-3 py-1.5 text-sm text-white border border-[#2a2a3c] whitespace-nowrap" 
                           style={{ 
                             boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
                             maxWidth: 'none'
                           }}>
                        <strong>{day.count}</strong> {day.count === 1 ? 'contribution' : 'contributions'} on {format(new Date(day.date), 'MMMM do')}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
          <div className="flex justify-center items-center mt-4 mb-2 text-sm text-gray-400">
            <span className="mr-2">Less</span>
            <div className="flex gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${getLevelColor(0)}`}></div>
              <div className={`w-3 h-3 rounded-sm ${getLevelColor(1)}`}></div>
              <div className={`w-3 h-3 rounded-sm ${getLevelColor(2)}`}></div>
              <div className={`w-3 h-3 rounded-sm ${getLevelColor(3)}`}></div>
              <div className={`w-3 h-3 rounded-sm ${getLevelColor(4)}`}></div>
            </div>
            <span className="ml-2">More</span>
          </div>
        </div>
      </div>
    </div>
  )
}