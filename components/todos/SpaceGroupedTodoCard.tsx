"use client"

import { useState } from 'react'
import { SpaceGroupedTodos } from '@/lib/api/todos/unified'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Users, Lock, CheckCircle2, Clock, CircleDot, Activity, ListTodo } from 'lucide-react'
import TodoItem from './TodoItem'
import { motion, AnimatePresence } from 'framer-motion'

interface SpaceGroupedTodosProps {
  groupedTodos: SpaceGroupedTodos
  onTodoUpdate: () => void
  defaultExpanded?: boolean
}

export default function SpaceGroupedTodoCard({
  groupedTodos,
  onTodoUpdate,
  defaultExpanded = true
}: SpaceGroupedTodosProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const { space, todos, stats } = groupedTodos

  const getSpaceTypeColor = (type: string) => {
    switch (type) {
      case 'personal':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'team':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'project':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <Card className="overflow-hidden border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader 
        className="cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto hover:bg-transparent"
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </Button>
            
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {space.name}
              </h3>
              <Badge 
                variant="outline" 
                className={`text-xs ${getSpaceTypeColor(space.type)}`}
              >
                {space.type === 'personal' && <Lock className="h-3 w-3 mr-1" />}
                {space.type === 'team' && <Users className="h-3 w-3 mr-1" />}
                {space.type}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 통계 뱃지 */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-gray-100">
                <ListTodo className="h-3 w-3 mr-1" style={{ color: '#4D51CC' }} />
                {stats.total}
              </Badge>
              
              {stats.completed > 0 && (
                <Badge 
                  variant="secondary" 
                  className="text-white font-mono font-semibold border-0"
                  style={{ backgroundColor: '#3FCF8E' }}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1 text-white" />
                  {stats.completed}
                </Badge>
              )}
              
              {stats.doing > 0 && (
                <Badge 
                  variant="secondary" 
                  className="text-white font-mono font-semibold border-0"
                  style={{ backgroundColor: '#FF82C2' }}
                >
                  <Activity className="h-3 w-3 mr-1 text-white" />
                  {stats.doing}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* 설명 */}
        {space.description && !isExpanded && (
          <p className="text-sm text-gray-500 mt-1 ml-8 line-clamp-1">
            {space.description}
          </p>
        )}
      </CardHeader>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0">
              {space.description && (
                <p className="text-sm text-gray-600 mb-4">
                  {space.description}
                </p>
              )}

              {todos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">이 스페이스에 할일이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todos.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      onUpdate={onTodoUpdate}
                      showSpaceInfo={false}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
