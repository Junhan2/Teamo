"use client"

import { useState } from 'react'
import { Todo, TodoWithSpace } from '@/lib/types/todo'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MoreHorizontal, Edit2, Trash2, CheckCircle2, CircleDot } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { todosClient } from '@/lib/api/todos/client'
import { toast } from 'sonner'

interface TodoItemProps {
  todo: Todo | TodoWithSpace
  onUpdate?: () => void
  showSpace?: boolean
}

export default function TodoItem({ todo, onUpdate, showSpace = false }: TodoItemProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleToggleComplete = async () => {
    setIsUpdating(true)
    try {
      await todosClient.updateTodo(todo.id, {
        is_completed: !todo.is_completed,
        completed_at: !todo.is_completed ? new Date().toISOString() : null
      })
      
      toast.success(todo.is_completed ? '할일을 미완료로 변경했습니다.' : '할일을 완료했습니다.')
      onUpdate?.()
    } catch (error) {
      toast.error('할일 상태 변경에 실패했습니다.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말로 이 할일을 삭제하시겠습니까?')) return
    
    try {
      await todosClient.deleteTodo(todo.id)
      toast.success('할일을 삭제했습니다.')
      onUpdate?.()
    } catch (error) {
      toast.error('할일 삭제에 실패했습니다.')
    }
  }

  const getPriorityIcon = () => {
    switch (todo.priority) {
      case 'high':
        return <CircleDot className="h-4 w-4 text-red-500" />
      case 'medium':
        return <CircleDot className="h-4 w-4 text-yellow-500" />
      case 'low':
        return <CircleDot className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  const getStatusIcon = () => {
    switch (todo.status) {
      case 'todo':
        return <CircleDot className="h-4 w-4 text-gray-400" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'done':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && !todo.is_completed

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border transition-colors",
        todo.is_completed && "bg-gray-50 opacity-60",
        isOverdue && "border-red-200 bg-red-50/30"
      )}
    >
      <Checkbox
        checked={todo.is_completed}
        onCheckedChange={handleToggleComplete}
        disabled={isUpdating}
        className="mt-0.5"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className={cn(
              "font-medium",
              todo.is_completed && "line-through text-gray-500"
            )}>
              {todo.title}
            </h4>
            
            {todo.description && (
              <p className="text-sm text-gray-600 mt-1">
                {todo.description}
              </p>
            )}

            <div className="flex items-center gap-4 mt-2">
              {getPriorityIcon()}
              {getStatusIcon()}
              
              {todo.due_date && (
                <div className={cn(
                  "flex items-center gap-1 text-sm",
                  isOverdue ? "text-red-600" : "text-gray-500"
                )}>
                  <Calendar className="h-3 w-3" />
                  {format(new Date(todo.due_date), 'M월 d일', { locale: ko })}
                </div>
              )}

              {showSpace && 'space' in todo && todo.space && (
                <span className="text-sm text-gray-500">
                  {todo.space.name}
                </span>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit2 className="h-4 w-4 mr-2" />
                수정
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
