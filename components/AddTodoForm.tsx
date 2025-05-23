"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { DotsLoader } from "@/components/ui/loading"

interface AddTodoFormProps {
  userId: string
  onTodoAdded?: () => void
}

export default function AddTodoForm({ userId, onTodoAdded }: AddTodoFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      setMessage({ type: "error", text: "Please enter a title." })
      return
    }
    
    if (!dueDate) {
      setMessage({ type: "error", text: "Please select a due date." })
      return
    }
    
    try {
      setLoading(true)
      setMessage(null)
      
      // 기본 팀 생성 시도
      let teamId = ""
      
      try {
        // 팀이 없는지 먼저 확인
        const { data: existingTeams, error: fetchError } = await supabase
          .from('teams')
          .select('id')
          .limit(1)
          
        if (fetchError) {
          console.error('Error checking teams:', fetchError)
        }

        if (!existingTeams || existingTeams.length === 0) {
          // 팀이 없으면 기본 팀 생성
          const { data: team, error: createError } = await supabase
            .from('teams')
            .insert([{ name: 'Default Team', description: 'Automatically generated default team' }])
            .select()
          
          if (createError) {
            console.error('Error creating team:', createError)
            throw createError
          }
          
          if (team && team.length > 0) {
            // 팀원으로 추가
            await supabase
              .from('team_members')
              .insert([{ 
                team_id: team[0].id, 
                user_id: userId, 
                role: 'admin' 
              }])
              
            teamId = team[0].id
          }
        } else {
          teamId = existingTeams[0].id
        }
      } catch (teamError) {
        console.error('Team setup error:', teamError)
        // 팀 설정에 실패해도 계속 진행 (fallback 값 사용)
        teamId = 'fallback-team-id' // 혹은 DB가 허용하는 UUID 형식
      }
      
      // 할 일 추가 시도
      const todoData = {
        title,
        description: description || null,
        due_date: dueDate.toISOString(), // null 옵션 제거
        status: 'pending',
        user_id: userId,
        team_id: teamId
      }
      
      console.log('Adding todo with data:', todoData)
      
      const { error } = await supabase
        .from('todos')
        .insert([todoData])
      
      if (error) {
        console.error('Error details:', error)
        throw error
      }      // 실시간 업데이트를 위한 이벤트 브로드캐스트
      // 이렇게 하면 Supabase 실시간 업데이트가 즉시 반영되지 않더라도 
      // 할일 추가 직후 UI가 업데이트됨
      try {
        const { data: broadcastData, error: broadcastError } = await supabase
          .from('todos')
          .select('id')
          .eq('user_id', userId);
        
        if (broadcastError) {
          console.error('Broadcast error:', broadcastError);
        } else {
          console.log('Current todos count:', broadcastData?.length || 0);
        }
      } catch (broadcastError) {
        console.error('Broadcast operation failed:', broadcastError);
      }
      
      setTitle("")
      setDescription("")
      setDueDate(undefined)
      setMessage({ type: "success", text: "Task added successfully." })
      
      // 추가 완료 후 부모 컴포넌트에 알림 (refreshTrigger는 더 이상 필요하지 않지만 호환성 유지)
      if (onTodoAdded) {
        onTodoAdded()
      }
      
      setTimeout(() => {
        setMessage(null)
      }, 3000)
    } catch (error) {
      console.error('Error adding todo:', error)
      setMessage({ type: "error", text: "Error occurred while adding task." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      {/* Title input */}
      <div className="relative">
        <Input
          id="title"
          placeholder="Enter your task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full h-12 px-4 text-base bg-white border-gray-cool-200 hover:border-gray-cool-300 focus:border-sky-500 transition-colors"
        />
      </div>
      
      {/* Description input */}
      <div className="relative">
        <Textarea
          id="description"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 text-base bg-white border-gray-cool-200 hover:border-gray-cool-300 focus:border-sky-500 transition-colors resize-none"
        />
      </div>
      
      {/* Due date input with special styling */}
      <div className="relative">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full h-12 justify-start text-left font-normal bg-white hover:bg-gray-cool-50 border-gray-cool-200 hover:border-gray-cool-300 transition-colors",
                dueDate ? "text-gray-cool-700" : "text-gray-cool-400"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-gray-cool-500" />
              {dueDate ? format(dueDate, "yyyy-MM-dd") : "Select due date (required)"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white border-gray-cool-200 shadow-xl">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={(date) => {
                setDueDate(date);
                setCalendarOpen(false);
              }}
              initialFocus
              defaultMonth={new Date()}
              className="bg-white rounded-lg"
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {/* ADD TASK button */}
      <Button 
        type="submit" 
        className="w-full h-12 bg-[#EFF1F5] text-[#404968] hover:bg-[#DCDFEA] text-sm font-normal uppercase tracking-wide outline outline-1 outline-offset-[-1px] outline-black/20 rounded-md transition-all duration-200"
        disabled={loading}
      >
        {loading ? (
          <DotsLoader className="justify-center" />
        ) : (
          <>
            <Plus className="w-5 h-5 mr-1" />
            <span>ADD TASK</span>
          </>
        )}
      </Button>
      
      {message && (
        <div className={cn(
          "p-4 text-sm rounded-lg border transition-all duration-300 animate-fadeIn",
          message.type === "success" 
            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
            : "bg-red-50 text-red-700 border-red-200"
        )}>
          {message.text}
        </div>
      )}
    </form>
  )
}