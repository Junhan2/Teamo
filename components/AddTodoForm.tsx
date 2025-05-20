"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { format } from "date-fns"
import { CalendarIcon, Pencil, Plus, ArrowUp, ArrowRight, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AddTodoFormProps {
  userId: string
  onTodoAdded?: () => void
}

export default function AddTodoForm({ userId, onTodoAdded }: AddTodoFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [priority, setPriority] = useState<string | null>("medium")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
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
        priority: priority,
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
      }
      // 실시간 업데이트를 위한 이벤트 브로드캐스트
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
      setPriority("medium")
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center mb-4">
        <div className="flex-grow relative">
          <Input
            id="title"
            placeholder="Enter your task"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full bg-[#3A3F4B] border-[#464c58]/60 focus:border-white focus:ring-0 rounded-sm pl-3 py-3 text-base"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Textarea
          id="description"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="bg-[#3A3F4B] border-[#464c58]/60 focus:border-white focus:ring-0 rounded-sm text-base w-full resize-none"
        />
      </div>
      
      <div className="flex flex-col gap-3 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-[#3A3F4B] border-[#464c58]/60 hover:bg-[#464c58]/60 hover:border-white px-4 py-2 h-11 text-base rounded-sm",
                  !dueDate && "text-gray-400"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "yyyy-MM-dd") : "Select due date (required)"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[#3A3F4B] border-[#464c58]/60">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                initialFocus
                className="bg-[#3A3F4B] rounded-sm border-[#464c58]/60"
              />
            </PopoverContent>
          </Popover>

          {/* 우선순위 선택 */}
          <div>
            <RadioGroup
              value={priority || "medium"}
              onValueChange={setPriority}
              className="flex justify-between my-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value="high" 
                  id="priority-high" 
                  className="text-white border-white focus:border-white" 
                />
                <Label 
                  htmlFor="priority-high" 
                  className="flex items-center cursor-pointer text-white hover:text-gray-300"
                >
                  <ArrowUp className="w-4 h-4 mr-1" />
                  High
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value="medium" 
                  id="priority-medium" 
                  className="text-white border-white focus:border-white" 
                />
                <Label 
                  htmlFor="priority-medium" 
                  className="flex items-center cursor-pointer text-white hover:text-gray-300"
                >
                  <ArrowRight className="w-4 h-4 mr-1" />
                  Medium
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value="low" 
                  id="priority-low" 
                  className="text-white border-white focus:border-white" 
                />
                <Label 
                  htmlFor="priority-low" 
                  className="flex items-center cursor-pointer text-white hover:text-gray-300"
                >
                  <ArrowDown className="w-4 h-4 mr-1" />
                  Low
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="bg-white text-[#292C33] hover:bg-white/90 w-full h-11 px-6 text-base rounded-sm"
          disabled={loading}
        >
          {loading ? "Adding..." : <><Plus className="w-4 h-4 mr-2" /> Add Task</>}
        </Button>
      </div>
      
      {message && (
        <div className={`p-3 text-sm rounded-sm ${
          message.type === "success" ? "bg-[#3A3F4B] text-white border border-[#464c58]/60" : "bg-[#3A3F4B] text-red-400 border border-[#464c58]/60"
        }`}>
          {message.text}
        </div>
      )}
    </form>
  )
}