"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Search, User, Users, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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
    case 'completed': return 'bg-emerald-100 text-emerald-800 border border-emerald-300'
    case 'in_progress': return 'bg-blue-100 text-blue-800 border border-blue-300'
    case 'pending': return 'bg-amber-100 text-amber-800 border border-amber-300'
    default: return 'bg-gray-100 text-gray-800 border border-gray-300'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed': return 'Done'
    case 'in_progress': return 'Doing'
    case 'pending': return 'Not yet'
    default: return status
  }
}

const getRandomColor = () => {
  return MEMO_COLORS[Math.floor(Math.random() * MEMO_COLORS.length)].name
}

export default function TeamMemoWall({ user }: TeamMemoWallProps) {
  const [memos, setMemos] = useState<TeamMemo[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'my-todos' | 'team-todos'>('my-todos')
  const myTabRef = useRef<HTMLButtonElement>(null)
  const teamTabRef = useRef<HTMLButtonElement>(null)
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [searchText, setSearchText] = useState("")
  
  // Todo search functionality
  const [showTodoSearch, setShowTodoSearch] = useState(false)
  const [todoSearchQuery, setTodoSearchQuery] = useState("")
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>([])
  const [cursorPosition, setCursorPosition] = useState(0)
  const [editTaggedTodos, setEditTaggedTodos] = useState<string[]>([])
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
  const handleContentChange = (value: string) => {
    setEditContent(value)

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
  const selectTodo = (todo: Todo) => {
    const textarea = textareaRef.current
    
    if (textarea) {
      const beforeCursor = editContent.substring(0, cursorPosition)
      const afterCursor = editContent.substring(cursorPosition)
      const hashIndex = beforeCursor.lastIndexOf('#')
      
      if (hashIndex !== -1) {
        const newContent = beforeCursor.substring(0, hashIndex) + 
                          `#${todo.title}` + 
                          afterCursor
        
        setEditContent(newContent)
        setEditTaggedTodos(prev => [...new Set([...prev, todo.id])])
      }
    }
    
    setShowTodoSearch(false)
    setTodoSearchQuery("")
  }

  // Get filtered memos based on active tab
  const getFilteredMemos = () => {
    const filtered = memos.filter(memo => {
      const matchesTab = activeTab === 'my-todos' 
        ? memo.user_id === user?.id 
        : memo.user_id !== user?.id
        
      const matchesSearch = searchText === "" || 
        memo.content.toLowerCase().includes(searchText.toLowerCase())
      
      return matchesTab && matchesSearch
    })
    
    return filtered
  }

  // Create new empty memo
  const createNewMemo = async () => {
    if (!user?.id) return

    try {
      console.log('Creating memo with user:', user.id) // 디버깅용
      
      const { data, error } = await supabase
        .from('team_memos')
        .insert([
          {
            content: "Double click to edit...",
            color: getRandomColor(),
            position_x: Math.floor(Math.random() * 800),
            position_y: Math.floor(Math.random() * 600),
            user_id: user.id,
            team_id: null,
            reactions: {},
            tagged_todos: []
          }
        ])
        .select()

      if (error) {
        console.error('Error creating memo:', error)
        console.error('Error details:', error.message, error.details)
        return
      }

      if (data && data[0]) {
        setEditingMemoId(data[0].id)
        setEditContent("")
        setEditTaggedTodos([])
      }

      fetchMemos()
    } catch (error) {
      console.error('Error in createNewMemo:', error)
    }
  }

  // Start editing memo
  const startEditing = (memo: TeamMemo) => {
    setEditingMemoId(memo.id)
    setEditContent(memo.content === "Double click to edit..." ? "" : memo.content)
    setEditTaggedTodos(memo.tagged_todos || [])
  }

  // Save memo changes
  const saveMemo = async (memoId: string) => {
    if (!editContent.trim()) {
      // Delete empty memo
      await deleteMemo(memoId)
      return
    }

    try {
      const { error } = await supabase
        .from('team_memos')
        .update({ 
          content: editContent.trim(),
          tagged_todos: editTaggedTodos
        })
        .eq('id', memoId)

      if (error) {
        console.error('Error saving memo:', error)
        return
      }

      setEditingMemoId(null)
      setEditContent("")
      setEditTaggedTodos([])
      fetchMemos()
    } catch (error) {
      console.error('Error in saveMemo:', error)
    }
  }

  // Cancel editing
  const cancelEditing = () => {
    const memo = memos.find(m => m.id === editingMemoId)
    if (memo && memo.content === "Double click to edit...") {
      // Delete the placeholder memo
      deleteMemo(editingMemoId!)
    }
    setEditingMemoId(null)
    setEditContent("")
    setEditTaggedTodos([])
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
            onClick={createNewMemo}
            className="bg-[#EFF1F5] text-[#404968] hover:bg-[#DCDFEA] text-sm font-normal uppercase tracking-wide outline outline-1 outline-offset-[-1px] outline-black/20 rounded-md transition-all duration-200 px-4 py-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            ADD MEMO
          </Button>
        </div>
        
        {/* Tabs and Search */}
        <div className="flex items-center justify-between mb-6">
          <Tabs 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'my-todos' | 'team-todos')}
            className="w-full text-base"
          >
            <div className="flex justify-start mb-4">
              <TabsList className="relative bg-transparent border border-slate-200 rounded-xl p-1 h-auto">
                {/* Animated background slider */}
                <motion.div
                  className="absolute bg-[#F9F9FB] border border-[#DCDFEA] shadow-sm rounded-lg"
                  initial={false}
                  animate={{
                    left: activeTab === 'my-todos' ? '4px' : `${(myTabRef.current?.offsetLeft || 0) + (myTabRef.current?.offsetWidth || 0)}px`,
                    width: activeTab === 'my-todos' 
                      ? `${myTabRef.current?.offsetWidth || 0}px`
                      : `${teamTabRef.current?.offsetWidth || 0}px`,
                    top: '4px',
                    bottom: '4px',
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8,
                  }}
                />
                
                <TabsTrigger 
                  ref={myTabRef}
                  value="my-todos" 
                  className="relative z-10 rounded-lg transition-all duration-500 px-4 py-2.5 text-sm font-medium font-dm-sans flex items-center gap-2 bg-transparent border-transparent hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-current"
                >
                  <motion.div
                    animate={{
                      color: activeTab === 'my-todos' ? '#475569' : '#94a3b8',
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <User size={16} />
                  </motion.div>
                  <motion.span
                    animate={{
                      color: activeTab === 'my-todos' ? '#374151' : '#94a3b8',
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    MY
                  </motion.span>
                </TabsTrigger>
                
                <TabsTrigger 
                  ref={teamTabRef}
                  value="team-todos" 
                  className="relative z-10 rounded-lg transition-all duration-500 px-4 py-2.5 text-sm font-medium font-dm-sans flex items-center gap-2 bg-transparent border-transparent hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-current"
                >
                  <motion.div
                    animate={{
                      color: activeTab === 'team-todos' ? '#475569' : '#94a3b8',
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <Users size={16} />
                  </motion.div>
                  <motion.span
                    animate={{
                      color: activeTab === 'team-todos' ? '#374151' : '#94a3b8',
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    TEAM
                  </motion.span>
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#F9F9FB] p-2 rounded-lg border-2 border-[#B9C0D4] hover:bg-[#EFF1F5] hover:border-[#7D89AF] transition-all duration-200">
              <Search className="w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search memos..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-64 h-8 border-none shadow-none focus:ring-0 bg-transparent"
              />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-light-muted">
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
            const taggedTodos = getTaggedTodos(isEditing ? editTaggedTodos : (memo.tagged_todos || []))
            
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
                onDoubleClick={() => !isEditing && startEditing(memo)}
              >
                {/* Delete button */}
                {memo.user_id === user?.id && !isEditing && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteMemo(memo.id)
                    }}
                    className="absolute top-2 right-2 w-6 h-6 p-0 bg-[#EFF1F5] hover:bg-red-50 text-[#5D6A97] hover:text-red-600 border border-[#B9C0D4] hover:border-red-300 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}

                {/* Content */}
                <div className="mb-4">
                  {isEditing ? (
                    <div className="space-y-2 relative">
                      <Textarea
                        ref={textareaRef}
                        value={editContent}
                        onChange={(e) => handleContentChange(e.target.value)}
                        className="bg-white/80 border-none resize-none text-sm min-h-[100px]"
                        rows={4}
                        placeholder="Type # to link tasks..."
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            cancelEditing()
                          } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            saveMemo(memo.id)
                          }
                        }}
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
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveMemo(memo.id)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 hover:border-blue-400 active:bg-blue-200 text-xs px-2 py-1 h-6 font-medium"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          onClick={cancelEditing}
                          className="bg-[#F9F9FB] hover:bg-[#EFF1F5] text-[#7D89AF] border border-[#B9C0D4] hover:border-[#7D89AF] active:bg-[#DCDFEA] text-xs px-2 py-1 h-6"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={`text-gray-800 text-sm font-medium whitespace-pre-wrap leading-relaxed ${
                      memo.content === "Double click to edit..." ? "text-gray-500 italic" : ""
                    }`}>
                      {memo.content.split(/(#[^#\s]+)/g).map((part, index) => {
                        if (part.startsWith('#')) {
                          const todoTitle = part.substring(1)
                          const linkedTodo = todos.find(todo => todo.title === todoTitle)
                          return linkedTodo ? (
                            <span 
                              key={index} 
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#EFF1F5] text-[#5D6A97] rounded-md text-xs font-medium mx-0.5 border border-[#B9C0D4]"
                            >
                              <Hash className="w-3 h-3" />
                              {todoTitle}
                            </span>
                          ) : (
                            <span key={index} className="text-gray-500">#{todoTitle}</span>
                          )
                        }
                        return part
                      })}
                    </div>
                  )}
                </div>

                {/* Tagged Todos */}
                {taggedTodos.length > 0 && !isEditing && (
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
                {!isEditing && (
                  <div className="text-xs text-gray-600 mt-auto">
                    <div className="font-medium">
                      {memo.user?.full_name || memo.user?.email || 'Unknown User'}
                    </div>
                    <div className="opacity-70">
                      {new Date(memo.created_at).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredMemos.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-20 h-20 mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
            <Plus size={32} className="text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-light-primary mb-2">No memos yet</h3>
          <p className="text-light-muted max-w-xs mb-4">
            Click "Add Memo" to create your first {activeTab === 'my-todos' ? 'personal' : 'team'} memo!
          </p>
          <Button
            onClick={createNewMemo}
            variant="outline"
            className="bg-[#e0f2fe] text-[#0369a1] border-2 border-[#7dd3fc] hover:bg-[#bae6fd] hover:border-[#0284c7] active:bg-[#7dd3fc] active:border-[#0369a1] transition-all duration-200 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Memo
          </Button>
        </div>
      )}
    </div>
  )
}