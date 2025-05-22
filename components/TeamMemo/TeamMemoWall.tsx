"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Edit3, Search, User, Users, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"

interface TeamMemo {
  id: string
  content: string
  color: string
  position_x: number
  position_y: number
  user_id: string
  team_id: string
  reactions: Record<string, string[]>
  tagged_todos: string[]
  created_at: string
  updated_at: string
  user?: {
    id: string
    full_name: string | null
    email: string
  }
}

interface Todo {
  id: string
  title: string
  description: string | null
  due_date: string | null
  status: "pending" | "in_progress" | "completed"
  priority: "high" | "medium" | "low" | null
  user_id: string
  team_id: string
  created_at: string
  updated_at: string
  user: {
    full_name: string | null
    email: string
  }
}

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

interface TeamMemoWallProps {
  user: UserProfile | null
}

const MEMO_COLORS = [
  { name: 'yellow', bg: 'bg-yellow-200', border: 'border-yellow-400', shadow: 'shadow-lg' },
  { name: 'pink', bg: 'bg-pink-200', border: 'border-pink-400', shadow: 'shadow-lg' },
  { name: 'blue', bg: 'bg-blue-200', border: 'border-blue-400', shadow: 'shadow-lg' },
  { name: 'green', bg: 'bg-green-200', border: 'border-green-400', shadow: 'shadow-lg' },
  { name: 'purple', bg: 'bg-purple-200', border: 'border-purple-400', shadow: 'shadow-lg' },
  { name: 'orange', bg: 'bg-orange-200', border: 'border-orange-400', shadow: 'shadow-lg' },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-[#3fcf8e]'
    case 'in_progress': return 'bg-[#FF82C2]'
    case 'pending': return 'bg-[#FFDA40]'
    default: return 'bg-gray-400'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed': return 'Done'
    case 'in_progress': return 'Doing'
    case 'pending': return 'To Do'
    default: return status
  }
}

export default function TeamMemoWall({ user }: TeamMemoWallProps) {
  const [memos, setMemos] = useState<TeamMemo[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'my' | 'team'>('my')
  const [showAddMemo, setShowAddMemo] = useState(false)
  const [newMemoContent, setNewMemoContent] = useState("")
  const [newMemoColor, setNewMemoColor] = useState("yellow")
  const [newMemoTaggedTodos, setNewMemoTaggedTodos] = useState<string[]>([])
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [searchText, setSearchText] = useState("")
  
  // Todo search functionality
  const [showTodoSearch, setShowTodoSearch] = useState(false)
  const [todoSearchQuery, setTodoSearchQuery] = useState("")
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>([])
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const supabase = createClient()

  // Fetch memos from database
  const fetchMemos = async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('team_memos')
        .select(`
          *,
          user:profiles(id, full_name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching memos:', error)
        return
      }

      setMemos(data || [])
    } catch (error) {
      console.error('Error in fetchMemos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch todos for tagging
  const fetchTodos = async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('todos')
        .select(`
          *,
          user:profiles(id, full_name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching todos:', error)
        return
      }

      setTodos(data || [])
    } catch (error) {
      console.error('Error in fetchTodos:', error)
    }
  }

  useEffect(() => {
    fetchMemos()
    fetchTodos()
  }, [user?.id])

  // Handle content changes and detect # for todo search
  const handleContentChange = (value: string, isEditing = false) => {
    if (isEditing) {
      setEditContent(value)
    } else {
      setNewMemoContent(value)
    }

    // Check for # to trigger todo search
    const textarea = textareaRef.current
    if (textarea) {
      const cursorPos = textarea.selectionStart
      const textBeforeCursor = value.substring(0, cursorPos)
      const hashIndex = textBeforeCursor.lastIndexOf('#')
      
      if (hashIndex !== -1) {
        const searchTerm = textBeforeCursor.substring(hashIndex + 1)
        if (searchTerm.length >= 0) {
          setTodoSearchQuery(searchTerm)
          setShowTodoSearch(true)
          setCursorPosition(cursorPos)
          
          // Filter todos based on search term
          const filtered = todos.filter(todo =>
            todo.title.toLowerCase().includes(searchTerm.toLowerCase())
          )
          setFilteredTodos(filtered)
        }
      } else {
        setShowTodoSearch(false)
      }
    }
  }

  // Select a todo from search results
  const selectTodo = (todo: Todo, isEditing = false) => {
    const currentContent = isEditing ? editContent : newMemoContent
    const textarea = textareaRef.current
    
    if (textarea) {
      const beforeCursor = currentContent.substring(0, cursorPosition)
      const afterCursor = currentContent.substring(cursorPosition)
      const hashIndex = beforeCursor.lastIndexOf('#')
      
      if (hashIndex !== -1) {
        const newContent = beforeCursor.substring(0, hashIndex) + 
                          `#${todo.title}` + 
                          afterCursor
        
        if (isEditing) {
          setEditContent(newContent)
        } else {
          setNewMemoContent(newContent)
          setNewMemoTaggedTodos(prev => [...new Set([...prev, todo.id])])
        }
      }
    }
    
    setShowTodoSearch(false)
    setTodoSearchQuery("")
  }

  // Get filtered memos based on active tab
  const getFilteredMemos = () => {
    const filtered = memos.filter(memo => {
      const matchesTab = activeTab === 'my' 
        ? memo.user_id === user?.id 
        : memo.user_id !== user?.id
        
      const matchesSearch = searchText === "" || 
        memo.content.toLowerCase().includes(searchText.toLowerCase())
      
      return matchesTab && matchesSearch
    })
    
    return filtered
  }

  // Create memo
  const createMemo = async () => {
    if (!user?.id || !newMemoContent.trim()) return

    try {
      const { data, error } = await supabase
        .from('team_memos')
        .insert([
          {
            content: newMemoContent.trim(),
            color: newMemoColor,
            position_x: Math.random() * 800,
            position_y: Math.random() * 600,
            user_id: user.id,
            team_id: 'default',
            reactions: {},
            tagged_todos: newMemoTaggedTodos
          }
        ])
        .select()

      if (error) {
        console.error('Error creating memo:', error)
        return
      }

      setNewMemoContent("")
      setNewMemoTaggedTodos([])
      setShowAddMemo(false)
      fetchMemos()
    } catch (error) {
      console.error('Error in createMemo:', error)
    }
  }

  // Update memo
  const updateMemo = async (memoId: string, updates: Partial<TeamMemo>) => {
    try {
      const { error } = await supabase
        .from('team_memos')
        .update(updates)
        .eq('id', memoId)

      if (error) {
        console.error('Error updating memo:', error)
        return
      }

      fetchMemos()
    } catch (error) {
      console.error('Error in updateMemo:', error)
    }
  }

  // Delete memo
  const deleteMemo = async (memoId: string) => {
    try {
      const { error } = await supabase
        .from('team_memos')
        .delete()
        .eq('id', memoId)

      if (error) {
        console.error('Error deleting memo:', error)
        return
      }

      fetchMemos()
    } catch (error) {
      console.error('Error in deleteMemo:', error)
    }
  }

  const getColorClasses = (colorName: string) => {
    return MEMO_COLORS.find(color => color.name === colorName) || MEMO_COLORS[0]
  }

  const getTaggedTodos = (todoIds: string[]) => {
    return todos.filter(todo => todoIds.includes(todo.id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-light-muted">Loading memos...</div>
      </div>
    )
  }

  const filteredMemos = getFilteredMemos()

  return (
    <div className="p-6 bg-light-background min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-light-primary">Memo</h1>
          <Button 
            onClick={() => setShowAddMemo(true)}
            className="bg-light-primary text-white hover:bg-light-accent transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Memo
          </Button>
        </div>
        
        {/* Tabs and Search */}
        <div className="flex flex-col gap-4">
          {/* Tab Navigation */}
          <div className="flex items-center gap-4">
            <div className="flex bg-white rounded-lg p-1 border border-light-border">
              <Button
                onClick={() => setActiveTab('my')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'my'
                    ? 'bg-light-primary text-white shadow-sm'
                    : 'text-light-muted hover:bg-[#E6EAF1] hover:text-light-primary'
                }`}
              >
                <User className="w-4 h-4 mr-2" />
                MY
              </Button>
              <Button
                onClick={() => setActiveTab('team')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'team'
                    ? 'bg-light-primary text-white shadow-sm'
                    : 'text-light-muted hover:bg-[#E6EAF1] hover:text-light-primary'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                TEAM
              </Button>
            </div>
            
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-light-border">
              <Search className="w-4 h-4 text-light-muted" />
              <Input
                placeholder="Search memos..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-64 h-8 border-none shadow-none focus:ring-0"
              />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-light-muted ml-auto">
              {filteredMemos.length} memo{filteredMemos.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Memos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {filteredMemos.map((memo, index) => {
            const colorClasses = getColorClasses(memo.color)
            const isEditing = editingMemoId === memo.id
            const taggedTodos = getTaggedTodos(memo.tagged_todos || [])
            
            return (
              <motion.div
                key={memo.id}
                layout
                initial={{ opacity: 0, scale: 0.8, rotateZ: Math.random() * 10 - 5 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  rotateZ: Math.random() * 6 - 3,
                  transition: { delay: index * 0.05 }
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05, rotateZ: 0, zIndex: 10 }}
                className={`relative min-h-[250px] p-4 ${colorClasses.bg} ${colorClasses.border} border-2 rounded-none ${colorClasses.shadow} hover:shadow-xl transition-all duration-200 group cursor-pointer transform`}
                style={{
                  transform: `rotate(${Math.random() * 6 - 3}deg)`,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                {/* Delete button */}
                {memo.user_id === user?.id && (
                  <Button
                    onClick={() => deleteMemo(memo.id)}
                    className="absolute top-2 right-2 w-6 h-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}

                {/* Edit button */}
                {memo.user_id === user?.id && (
                  <Button
                    onClick={() => {
                      setEditingMemoId(memo.id)
                      setEditContent(memo.content)
                    }}
                    className="absolute top-2 right-10 w-6 h-6 p-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                )}

                {/* Content */}
                <div className="mb-4">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        ref={textareaRef}
                        value={editContent}
                        onChange={(e) => handleContentChange(e.target.value, true)}
                        className="bg-white/80 border-none resize-none text-sm"
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            updateMemo(memo.id, { content: editContent })
                            setEditingMemoId(null)
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-6"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setEditingMemoId(null)}
                          className="bg-gray-500 hover:bg-gray-600 text-white text-xs px-2 py-1 h-6"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-800 text-sm font-medium whitespace-pre-wrap leading-relaxed">
                      {memo.content}
                    </p>
                  )}
                </div>

                {/* Tagged Todos */}
                {taggedTodos.length > 0 && (
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Hash className="w-3 h-3" />
                      <span>Linked Tasks</span>
                    </div>
                    {taggedTodos.map(todo => (
                      <div key={todo.id} className="bg-white/80 p-2 rounded text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate flex-1 mr-2">
                            {todo.title}
                          </span>
                          <div className="flex items-center gap-1">
                            {todo.due_date && (
                              <span className="text-gray-500">
                                {format(new Date(todo.due_date), 'MM/dd')}
                              </span>
                            )}
                            <span className={`px-1.5 py-0.5 rounded text-white text-xs ${getStatusColor(todo.status)}`}>
                              {getStatusText(todo.status)}
                            </span>
                            <span className="text-gray-500 ml-1">
                              {todo.user?.full_name?.split(' ')[0] || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Author and date */}
                <div className="text-xs text-gray-600 mt-auto">
                  <div className="font-medium">
                    {memo.user?.full_name || memo.user?.email || 'Unknown User'}
                  </div>
                  <div className="opacity-70">
                    {new Date(memo.created_at).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Add Memo Modal */}
      <AnimatePresence>
        {showAddMemo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowAddMemo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4 text-light-primary">Add New Memo</h2>
              
              <div className="space-y-4">
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Write your memo... (Type # to link tasks)"
                    value={newMemoContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="resize-none"
                    rows={4}
                  />
                  
                  {/* Todo Search Dropdown */}
                  {showTodoSearch && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                      {filteredTodos.length > 0 ? (
                        filteredTodos.map(todo => (
                          <div
                            key={todo.id}
                            onClick={() => selectTodo(todo)}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate flex-1 mr-2 text-sm">
                                {todo.title}
                              </span>
                              <div className="flex items-center gap-2 text-xs">
                                {todo.due_date && (
                                  <span className="text-gray-500">
                                    {format(new Date(todo.due_date), 'MM/dd')}
                                  </span>
                                )}
                                <span className={`px-1.5 py-0.5 rounded text-white ${getStatusColor(todo.status)}`}>
                                  {getStatusText(todo.status)}
                                </span>
                                <span className="text-gray-500">
                                  {todo.user?.full_name?.split(' ')[0] || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-gray-500 text-sm">
                          No tasks found for "{todoSearchQuery}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <div className="flex gap-2">
                    {MEMO_COLORS.map(color => (
                      <button
                        key={color.name}
                        onClick={() => setNewMemoColor(color.name)}
                        className={`w-8 h-8 rounded ${color.bg} ${color.border} border-2 ${
                          newMemoColor === color.name ? 'ring-2 ring-light-accent' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowAddMemo(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createMemo}
                  className="bg-light-primary text-white hover:bg-light-accent"
                  disabled={!newMemoContent.trim()}
                >
                  Create Memo
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}