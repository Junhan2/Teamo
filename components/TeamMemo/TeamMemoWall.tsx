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
  { name: 'default', bg: 'bg-gray-cool-50', border: 'border-gray-cool-200', shadow: 'shadow-md' },
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
  return MEMO_COLORS[0].name // Always return default color
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
  const contentEditableRef = useRef<HTMLDivElement>(null)
  
  const supabase = createClient()

  // Fetch memos from database
  const fetchMemos = async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('team_memos')
        .select(`
          *,
          user:profiles!team_memos_user_id_fkey(id, full_name, email)
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
          user:profiles!todos_user_id_fkey(id, full_name, email)
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

  // Handle content changes in contentEditable
  const handleContentEditableChange = () => {
    const element = contentEditableRef.current
    if (!element) return

    const selection = window.getSelection()
    const cursorPos = selection?.focusOffset || 0
    const textContent = element.textContent || ""
    
    // Check for # to trigger todo search
    const textBeforeCursor = textContent.substring(0, cursorPos)
    const hashIndex = textBeforeCursor.lastIndexOf('#')
    
    if (hashIndex !== -1 && hashIndex === textBeforeCursor.length - 1) {
      setShowTodoSearch(true)
      setTodoSearchQuery("")
      setCursorPosition(cursorPos)
    } else if (hashIndex !== -1 && textBeforeCursor.substring(hashIndex).match(/^#[^\s]*$/)) {
      const searchTerm = textBeforeCursor.substring(hashIndex + 1)
      setTodoSearchQuery(searchTerm)
      setShowTodoSearch(true)
      setCursorPosition(cursorPos)
      
      // Filter todos based on search term
      const filtered = todos.filter(todo =>
        todo.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredTodos(filtered)
    } else {
      setShowTodoSearch(false)
    }

    // Update content state
    setEditContent(textContent)
  }

  // Select a todo from search results
  const selectTodo = (todo: Todo) => {
    const element = contentEditableRef.current
    if (!element) return

    const textContent = element.textContent || ""
    const hashIndex = textContent.lastIndexOf('#')
    
    if (hashIndex !== -1) {
      // Create todo badge element
      const todoSpan = document.createElement('span')
      todoSpan.className = 'inline-flex items-center gap-1 px-2 py-0.5 bg-gray-cool-100 text-gray-cool-700 rounded-md text-xs font-medium mx-0.5 border border-gray-cool-200'
      todoSpan.contentEditable = 'false'
      todoSpan.dataset.todoId = todo.id
      todoSpan.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9V5a2 2 0 012-2h12a2 2 0 012 2v4M4 15v4a2 2 0 002 2h12a2 2 0 002-2v-4M9 9h6M9 15h6"/></svg>${todo.title}`
      
      // Replace the hash and search text with the badge
      const beforeHash = textContent.substring(0, hashIndex)
      element.textContent = beforeHash
      element.appendChild(todoSpan)
      
      // Add a space after the badge for continued typing
      const space = document.createTextNode(' ')
      element.appendChild(space)
      
      // Move cursor after the space
      const range = document.createRange()
      const selection = window.getSelection()
      range.setStartAfter(space)
      range.collapse(true)
      selection?.removeAllRanges()
      selection?.addRange(range)
      
      setEditTaggedTodos(prev => [...new Set([...prev, todo.id])])
    }
    
    setShowTodoSearch(false)
    setTodoSearchQuery("")
  }

  // Get content from contentEditable including tagged todos
  const getContentFromElement = () => {
    const element = contentEditableRef.current
    if (!element) return ""

    let content = ""
    const taggedTodoIds: string[] = []

    element.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        content += node.textContent
      } else if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).dataset.todoId) {
        const todoId = (node as HTMLElement).dataset.todoId!
        const todo = todos.find(t => t.id === todoId)
        if (todo) {
          content += `#${todo.title}`
          taggedTodoIds.push(todoId)
        }
      }
    })

    return { content, taggedTodoIds }
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
    
    // Set content in contentEditable after render
    setTimeout(() => {
      const element = contentEditableRef.current
      if (element) {
        element.innerHTML = ""
        
        // Parse content and recreate with badges
        const parts = memo.content.split(/(#[^#\s]+)/g)
        parts.forEach(part => {
          if (part.startsWith('#')) {
            const todoTitle = part.substring(1)
            const linkedTodo = todos.find(todo => todo.title === todoTitle)
            if (linkedTodo) {
              const todoSpan = document.createElement('span')
              todoSpan.className = 'inline-flex items-center gap-1 px-2 py-0.5 bg-gray-cool-100 text-gray-cool-700 rounded-md text-xs font-medium mx-0.5 border border-gray-cool-200'
              todoSpan.contentEditable = 'false'
              todoSpan.dataset.todoId = linkedTodo.id
              todoSpan.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9V5a2 2 0 012-2h12a2 2 0 012 2v4M4 15v4a2 2 0 002 2h12a2 2 0 002-2v-4M9 9h6M9 15h6"/></svg>${linkedTodo.title}`
              element.appendChild(todoSpan)
            } else {
              element.appendChild(document.createTextNode(part))
            }
          } else {
            element.appendChild(document.createTextNode(part))
          }
        })
        
        // Focus at end
        element.focus()
        const range = document.createRange()
        const selection = window.getSelection()
        range.selectNodeContents(element)
        range.collapse(false)
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
    }, 50)
  }

  // Save memo changes
  const saveMemo = async (memoId: string) => {
    const { content, taggedTodoIds } = getContentFromElement()
    
    if (!content.trim()) {
      // Delete empty memo
      await deleteMemo(memoId)
      return
    }

    try {
      const { error } = await supabase
        .from('team_memos')
        .update({ 
          content: content.trim(),
          tagged_todos: taggedTodoIds
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
    return MEMO_COLORS[0] // Always return default color
  }

  const getTaggedTodos = (todoIds: string[]) => {
    return todos.filter(todo => todoIds.includes(todo.id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-cool-500">Loading memos...</div>
      </div>
    )
  }

  const filteredMemos = getFilteredMemos()

  return (
    <div className="p-6 bg-gray-cool-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-cool-800">Memo</h1>
          <Button 
            onClick={createNewMemo}
            className="bg-[#3b82f6] text-white hover:bg-[#2563eb] text-sm font-normal uppercase tracking-wide outline outline-2 outline-offset-[-2px] outline-[#1e40af] rounded-md transition-all duration-200 px-4 py-2 shadow-sm"
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
              <TabsList className="relative bg-transparent border border-[#DCDFEA] rounded-xl p-1 h-auto">
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
            
            <div className="flex items-center gap-2 text-sm text-gray-cool-500">
              {filteredMemos.length} memo{filteredMemos.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
      {/* Memos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        <AnimatePresence>
          {filteredMemos.map((memo, index) => {
            const colorClasses = getColorClasses(memo.color)
            const isEditing = editingMemoId === memo.id
            const taggedTodos = getTaggedTodos(isEditing ? editTaggedTodos : (memo.tagged_todos || []))
            
            return (
              <motion.div
                key={memo.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  transition: { delay: index * 0.05 }
                }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                className={`relative p-6 ${colorClasses.bg} ${colorClasses.border} border rounded-lg ${colorClasses.shadow} hover:shadow-lg transition-all duration-200 group cursor-pointer`}
                onDoubleClick={() => !isEditing && startEditing(memo)}
              >
                {/* Delete button */}
                {memo.user_id === user?.id && !isEditing && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteMemo(memo.id)
                    }}
                    className="absolute top-2 right-2 w-6 h-6 p-0 bg-gray-cool-50 hover:bg-red-50 text-gray-cool-600 hover:text-red-600 border border-gray-cool-200 hover:border-red-300 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}

                {/* Content */}
                <div className="flex flex-col h-full">
                  {isEditing ? (
                    <div className="flex flex-col h-full relative">
                      <div
                        ref={contentEditableRef}
                        contentEditable
                        className="bg-white/80 border border-gray-cool-200 rounded-md text-base flex-1 mb-3 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                        onInput={handleContentEditableChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            cancelEditing()
                          } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            saveMemo(memo.id)
                          }
                        }}
                        style={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}
                      />
                      
                      {/* Todo Search Dropdown */}
                      {showTodoSearch && (
                        <div className="absolute top-[120px] left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                          {filteredTodos.length > 0 ? (
                            filteredTodos.map(todo => (
                              <div
                                key={todo.id}
                                onClick={() => selectTodo(todo)}
                                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium truncate flex-1 mr-2 text-base">
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
                            <div className="p-3 text-gray-500 text-base">
                              No tasks found for "{todoSearchQuery}"
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex gap-3 mt-auto">
                        <Button
                          size="sm"
                          onClick={() => saveMemo(memo.id)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 hover:border-blue-400 active:bg-blue-200 px-4 py-2 h-10 font-medium flex-1"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          onClick={cancelEditing}
                          className="bg-[#F9F9FB] hover:bg-[#EFF1F5] text-[#7D89AF] border border-[#B9C0D4] hover:border-[#7D89AF] active:bg-[#DCDFEA] px-4 py-2 h-10 flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={`text-gray-cool-700 text-base font-medium whitespace-pre-wrap leading-relaxed mb-3 ${
                        memo.content === "Double click to edit..." ? "text-gray-cool-400 italic" : ""
                      }`}>
                        {memo.content.split(/(#[^#\s]+)/g).map((part, index) => {
                          if (part.startsWith('#')) {
                            const todoTitle = part.substring(1)
                            const linkedTodo = todos.find(todo => todo.title === todoTitle)
                            return linkedTodo ? (
                              <span 
                                key={index} 
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-cool-100 text-gray-cool-700 rounded-md text-xs font-medium mx-0.5 border border-gray-cool-200"
                              >
                                <Hash className="w-3 h-3" />
                                {todoTitle}
                              </span>
                            ) : (
                              <span key={index} className="text-gray-cool-400">#{todoTitle}</span>
                            )
                          }
                          return part
                        })}
                      </div>

                      {/* Tagged Todos */}
                      {taggedTodos.length > 0 && (
                        <div className="space-y-2 mt-auto">
                          <div className="flex items-center gap-1 text-sm text-gray-cool-600 font-semibold uppercase tracking-wide">
                            <Hash className="w-3 h-3" />
                            <span>LINKED TASKS</span>
                          </div>
                          {taggedTodos.map(todo => (
                            <div key={todo.id} className="bg-white/60 p-2 rounded text-sm border border-gray-cool-100">
                              <div className="flex items-center justify-between">
                                <span className="font-medium truncate flex-1 mr-2">
                                  {todo.title}
                                </span>
                                <div className="flex items-center gap-1">
                                  {todo.due_date && (
                                    <span className="text-gray-500 text-xs">
                                      {format(new Date(todo.due_date), 'MM/dd')}
                                    </span>
                                  )}
                                  <span className={`px-1.5 py-0.5 rounded text-white text-xs ${getStatusColor(todo.status)}`}>
                                    {getStatusText(todo.status)}
                                  </span>
                                  <span className="text-gray-500 ml-1 text-xs">
                                    {todo.user?.full_name?.split(' ')[0] || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Author and date */}
                      <div className="text-sm text-gray-cool-600 mt-auto pt-3">
                        <div className="font-medium">
                          {memo.user?.full_name || memo.user?.email || 'Unknown User'}
                        </div>
                        <div className="opacity-70">
                          {new Date(memo.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredMemos.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-20 h-20 mb-4 rounded-full bg-gray-cool-100 flex items-center justify-center">
            <Plus size={32} className="text-gray-cool-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-cool-800 mb-2">No memos yet</h3>
          <p className="text-gray-cool-500 max-w-xs mb-4">
            Click "Add Memo" to create your first {activeTab === 'my-todos' ? 'personal' : 'team'} memo!
          </p>
          <Button
            onClick={createNewMemo}
            variant="outline"
            className="bg-gray-cool-50 text-gray-cool-700 border-2 border-gray-cool-300 hover:bg-gray-cool-100 hover:border-gray-cool-400 transition-all duration-200 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Memo
          </Button>
        </div>
      )}
    </div>
  )
}