"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { CalendarIcon, Lock, Users, Clock, Send } from "lucide-react"
import { toast } from "sonner"

interface TeamSpace {
  id: string;
  name: string;
  color_theme: string;
  is_personal?: boolean;
}

interface AddTodoFormProps {
  userId: string;
  currentTeamSpace?: TeamSpace | null;
  onTodoAdded: () => void;
}

export default function AddTodoForm({ userId, currentTeamSpace, onTodoAdded }: AddTodoFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [isSharedToTeam, setIsSharedToTeam] = useState(false)
  const [estimatedHours, setEstimatedHours] = useState<number | "">("")
  const [loading, setLoading] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  
  const supabase = createClient()

  const isTeamSpace = currentTeamSpace && !currentTeamSpace.is_personal;

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter a task title")
      return
    }

    try {
      setLoading(true)

      const todoData = {
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate ? dueDate.toISOString() : null,
        priority,
        user_id: userId,
        team_space_id: isTeamSpace ? currentTeamSpace.id : null,
        is_shared_to_team: isTeamSpace ? isSharedToTeam : false,
        estimated_hours: estimatedHours || null,
        status: "pending" as const,
      }

      const { error } = await supabase
        .from("todos")
        .insert([todoData])

      if (error) throw error

      // Reset form
      setTitle("")
      setDescription("")
      setDueDate(undefined)
      setPriority("medium")
      setIsSharedToTeam(false)
      setEstimatedHours("")

      toast.success("Task created successfully! 🎉")
      onTodoAdded()

    } catch (error) {
      console.error("Error creating todo:", error)
      toast.error("Failed to create task")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Current Space Indicator */}
      {currentTeamSpace && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <div className={`w-2 h-2 rounded-full ${
            currentTeamSpace.color_theme === 'blue' ? 'bg-blue-500' :
            currentTeamSpace.color_theme === 'purple' ? 'bg-purple-500' :
            currentTeamSpace.color_theme === 'green' ? 'bg-green-500' :
            currentTeamSpace.color_theme === 'orange' ? 'bg-orange-500' :
            currentTeamSpace.color_theme === 'pink' ? 'bg-pink-500' :
            'bg-indigo-500'
          }`}></div>
          <span>Adding to <strong>{currentTeamSpace.name}</strong></span>
        </div>
      )}

      {/* Task Title */}
      <div>
        <Input
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-base border-[#DCDFEA] focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
        />
      </div>

      {/* Description */}
      <div>
        <Textarea
          placeholder="Add more details... (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="text-sm border-[#DCDFEA] focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none"
        />
      </div>

      {/* Due Date and Priority */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal border-[#DCDFEA] hover:border-[#7D89AF]"
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {dueDate ? format(dueDate, "yyyy-MM-dd") : "Due date"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={(date) => {
                  setDueDate(date)
                  setShowCalendar(false)
                }}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
            className="w-full px-3 py-2 border border-[#DCDFEA] rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>
      </div>

      {/* Estimated Hours */}
      <div>
        <div className="relative">
          <input
            type="number"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value ? parseInt(e.target.value) : "")}
            placeholder="Estimated hours (optional)"
            min="0"
            max="999"
            className="w-full pl-3 pr-10 py-2 border border-[#DCDFEA] rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
          />
          <Clock size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Team Sharing Option (Only for team spaces) */}
      {isTeamSpace && (
        <div className="border-t border-gray-100 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Team Visibility
          </label>
          <div className="space-y-3">
            <motion.div
              className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                !isSharedToTeam 
                  ? 'border-blue-200 bg-blue-50' 
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
              onClick={() => setIsSharedToTeam(false)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  !isSharedToTeam ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Lock size={16} className={!isSharedToTeam ? 'text-blue-600' : 'text-gray-500'} />
                </div>
                <div>
                  <div className={`font-medium text-sm ${!isSharedToTeam ? 'text-blue-800' : 'text-gray-700'}`}>
                    Private to me
                  </div>
                  <div className="text-xs text-gray-500">
                    Only you can see this task
                  </div>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                !isSharedToTeam 
                  ? 'border-blue-500 bg-blue-500' 
                  : 'border-gray-300'
              }`}>
                {!isSharedToTeam && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>
            </motion.div>

            <motion.div
              className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                isSharedToTeam 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
              onClick={() => setIsSharedToTeam(true)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isSharedToTeam ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Users size={16} className={isSharedToTeam ? 'text-green-600' : 'text-gray-500'} />
                </div>
                <div>
                  <div className={`font-medium text-sm ${isSharedToTeam ? 'text-green-800' : 'text-gray-700'}`}>
                    Share with team
                  </div>
                  <div className="text-xs text-gray-500">
                    Team members can see and track this task
                  </div>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                isSharedToTeam 
                  ? 'border-green-500 bg-green-500' 
                  : 'border-gray-300'
              }`}>
                {isSharedToTeam && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <Button
          onClick={handleSubmit}
          disabled={!title.trim() || loading}
          className="w-full bg-sky-100 text-sky-700 border border-sky-600 hover:bg-sky-200 hover:border-sky-700 font-[500] flex items-center gap-2"
        >
          <Send size={16} />
          {loading ? "Creating..." : "ADD TASK"}
        </Button>
      </div>
    </div>
  )
}