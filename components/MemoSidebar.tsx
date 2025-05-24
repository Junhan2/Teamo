'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Hash, CheckSquare, Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

interface Todo {
  id: string
  title: string
  status: string
  user_id: string
}

interface MemoSidebarProps {
  isOpen: boolean
  onClose: () => void
  memo: {
    id: string
    title: string
    content: string
    tags?: string[]
    tagged_todos?: string[]
  } | null
  onSave: (memo: {
    id: string
    title: string
    content: string
    tags: string[]
    tagged_todos: string[]
  }) => void
  onRealtimeUpdate?: (memo: {
    id: string
    title: string
    content: string
    tags: string[]
    tagged_todos: string[]
  }) => void
  onCloseSidebar?: () => void // 사이드바 닫힐 때 호출할 함수 추가
}

export default function MemoSidebar({ isOpen, onClose, memo, onSave, onRealtimeUpdate, onCloseSidebar }: MemoSidebarProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [taggedTodos, setTaggedTodos] = useState<string[]>([])
  const [todoSearch, setTodoSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Todo[]>([])
  const [showTodoSearch, setShowTodoSearch] = useState(false)
  const [loading, setLoading] = useState(false)
  const [linkedTodos, setLinkedTodos] = useState<Todo[]>([])
  const sidebarRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (memo) {
      setTitle(memo.title || '')
      setContent(memo.content || '')
      setTags(memo.tags || [])
      setTaggedTodos(memo.tagged_todos || [])
    }
  }, [memo])

  // 연결된 할일 정보 가져오기
  useEffect(() => {
    const fetchLinkedTodos = async () => {
      if (!taggedTodos.length) {
        setLinkedTodos([])
        return
      }

      try {
        const { data, error } = await supabase
          .from('todos')
          .select('id, title, status, user_id')
          .in('id', taggedTodos)

        if (error) throw error
        setLinkedTodos(data || [])
      } catch (error) {
        console.error('Error fetching linked todos:', error)
      }
    }

    fetchLinkedTodos()
  }, [taggedTodos])

  // 태그와 할일 변경 시 즉시 업데이트
  useEffect(() => {
    if (memo && onRealtimeUpdate) {
      onRealtimeUpdate({
        id: memo.id,
        title,
        content,
        tags,
        tagged_todos: taggedTodos
      })
    }
  }, [tags, taggedTodos])

  // 타이틀과 내용 변경 시 디바운스 업데이트
  useEffect(() => {
    if (!memo || !onRealtimeUpdate) return
    
    const timer = setTimeout(() => {
      onRealtimeUpdate({
        id: memo.id,
        title,
        content,
        tags,
        tagged_todos: taggedTodos
      })
    }, 300) // 300ms 디바운스

    return () => clearTimeout(timer)
  }, [title, content, memo, onRealtimeUpdate, tags, taggedTodos])

  // 할일 검색
  const searchTodos = async () => {
    if (!todoSearch.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('id, title, status, user_id')
        .ilike('title', `%${todoSearch}%`)
        .limit(10)

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('Error searching todos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchTodos()
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [todoSearch])

  // 자동 저장 (DB 저장용)
  useEffect(() => {
    if (!memo) return
    
    const saveTimeout = setTimeout(() => {
      onSave({
        id: memo.id,
        title,
        content,
        tags,
        tagged_todos: taggedTodos
      })
    }, 1000) // 1초 후 DB 저장

    return () => clearTimeout(saveTimeout)
  }, [title, content, tags, taggedTodos, memo, onSave])

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose()
        // 사이드바가 닫힐 때 추가 콜백 호출
        if (onCloseSidebar) {
          onCloseSidebar()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose, onCloseSidebar])

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()]
      setTags(newTags)
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove)
    setTags(newTags)
  }

  const addTodo = (todo: Todo) => {
    if (!taggedTodos.includes(todo.id)) {
      const newTodos = [...taggedTodos, todo.id]
      setTaggedTodos(newTodos)
      setLinkedTodos([...linkedTodos, todo])
      setTodoSearch('')
      setShowTodoSearch(false)
    }
  }

  const removeTodo = (todoId: string) => {
    const newTodos = taggedTodos.filter(id => id !== todoId)
    setTaggedTodos(newTodos)
    setLinkedTodos(linkedTodos.filter(todo => todo.id !== todoId))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={sidebarRef}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-20 right-4 bottom-4 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">MEMO</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onClose()
                // 사이드바가 닫힐 때 추가 콜백 호출
                if (onCloseSidebar) {
                  onCloseSidebar()
                }
              }}
              className="hover:bg-gray-100 rounded-full h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter memo title"
                className="w-full"
              />
            </div>

            {/* 내용 */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                Content
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your memo content..."
                className="w-full min-h-[200px] resize-none"
              />
            </div>

            {/* 할일 태깅 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Tasks
              </Label>
              
              {/* 할일 검색 */}
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={todoSearch}
                      onChange={(e) => {
                        setTodoSearch(e.target.value)
                        setShowTodoSearch(true)
                      }}
                      onFocus={() => setShowTodoSearch(true)}
                      placeholder="Search tasks..."
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* 검색 결과 */}
                {showTodoSearch && todoSearch && (
                  <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto z-10">
                    {loading ? (
                      <div className="p-4 text-center text-gray-500">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((todo) => (
                        <button
                          key={todo.id}
                          onClick={() => addTodo(todo)}
                          disabled={taggedTodos.includes(todo.id)}
                          className={`w-full text-left p-3 border-b border-gray-100 last:border-0 ${
                            taggedTodos.includes(todo.id) 
                              ? 'bg-gray-100 opacity-50 cursor-not-allowed' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{todo.title}</span>
                            <Badge 
                              variant={todo.status === 'completed' ? 'default' : 'secondary'} 
                              className="text-xs"
                            >
                              {todo.status === 'completed' ? 'completed' : todo.status === 'in_progress' ? 'in progress' : 'not yet'}
                            </Badge>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">No tasks found</div>
                    )}
                  </div>
                )}
              </div>

              {/* 연결된 할일 목록 */}
              <div className="space-y-2 mt-3">
                {linkedTodos.length > 0 && (
                  <div className="space-y-1">
                    {linkedTodos.map((todo) => (
                      <div key={todo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <span className="text-sm font-medium">{todo.title}</span>
                          <Badge 
                            variant={todo.status === 'completed' ? 'default' : todo.status === 'in_progress' ? 'secondary' : 'outline'} 
                            className="ml-2 text-xs"
                          >
                            {todo.status === 'completed' ? 'completed' : todo.status === 'in_progress' ? 'in progress' : 'not yet'}
                          </Badge>
                        </div>
                        <button
                          onClick={() => removeTodo(todo.id)}
                          className="text-gray-400 hover:text-gray-600 text-sm ml-2 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 태그 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Tags
              </Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add a tag"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  size="sm"
                  variant="outline"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => removeTag(tag)}
                  >
                    #{tag} ×
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
