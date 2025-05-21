'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  PlusCircle, MessageSquare, CheckSquare, Trash2, User, Calendar, Search, 
  Grid, List, Clock, CheckCircle2, AlertCircle 
} from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"

interface Todo {
  id: string
  title: string
  description: string | null
  due_date: string | null
  completed: boolean
  created_at: string
  user_id: string
  user_email?: string
  priority: 'low' | 'medium' | 'high'
  category: string
}

interface Memo {
  id: string
  title: string
  content: string
  created_at: string
  user_id: string
  user_email?: string
  priority: 'low' | 'medium' | 'high'
  category: string
}

type ItemType = 'todo' | 'memo'

export default function UnifiedTaskGrid() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [memos, setMemos] = useState<Memo[]>([])
  const [activeTab, setActiveTab] = useState<ItemType>('todo')
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Form states
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const categories = ['회의', '업무', '아이디어', '기타']

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('team_todos')
        .select(`
          *,
          profiles:user_id (
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const todosWithUserEmail = data?.map(todo => ({
        ...todo,
        user_email: todo.profiles?.email || 'Unknown',
        priority: todo.priority || 'medium',
        category: todo.category || '업무'
      })) || []

      setTodos(todosWithUserEmail)
    } catch (error) {
      console.error('Error fetching todos:', error)
    }
  }

  const fetchMemos = async () => {
    try {
      const { data, error } = await supabase
        .from('team_memos')
        .select(`
          *,
          profiles:user_id (
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const memosWithUserEmail = data?.map(memo => ({
        ...memo,
        user_email: memo.profiles?.email || 'Unknown',
        priority: memo.priority || 'medium',
        category: memo.category || '기타'
      })) || []

      setMemos(memosWithUserEmail)
    } catch (error) {
      console.error('Error fetching memos:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      if (activeTab === 'todo') {
        const { error } = await supabase
          .from('team_todos')
          .insert({
            title,
            description: content,
            due_date: dueDate || null,
            priority,
            category: category || '업무',
            user_id: userData.user?.id,
            completed: false
          })

        if (error) throw error
        fetchTodos()
      } else {
        const { error } = await supabase
          .from('team_memos')
          .insert({
            title,
            content,
            priority,
            category: category || '기타',
            user_id: userData.user?.id
          })

        if (error) throw error
        fetchMemos()
      }

      setTitle('')
      setContent('')
      setDueDate('')
      setCategory('')
      setPriority('medium')
      setShowForm(false)
      
      toast({
        title: "성공!",
        description: `${activeTab === 'todo' ? '할일' : '메모'}이 추가되었습니다.`,
      })
    } catch (error) {
      console.error('Error adding item:', error)
      toast({
        title: "오류",
        description: "추가에 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('team_todos')
        .update({ completed: !completed })
        .eq('id', id)

      if (error) throw error

      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, completed: !completed } : todo
      ))
    } catch (error) {
      console.error('Error toggling todo:', error)
    }
  }

  const deleteItem = async (id: string, type: ItemType) => {
    if (!confirm(`정말로 이 ${type === 'todo' ? '할일' : '메모'}을 삭제하시겠습니까?`)) return

    try {
      const table = type === 'todo' ? 'team_todos' : 'team_memos'
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

      if (error) throw error

      if (type === 'todo') {
        setTodos(todos.filter(todo => todo.id !== id))
      } else {
        setMemos(memos.filter(memo => memo.id !== id))
      }
      
      toast({
        title: "삭제 완료",
        description: `${type === 'todo' ? '할일' : '메모'}이 삭제되었습니다.`,
      })
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const getFilteredItems = () => {
    const items = activeTab === 'todo' ? todos : memos
    
    return items.filter(item => {
      // 검색어 필터
      if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !(activeTab === 'memo' ? (item as Memo).content : (item as Todo).description)?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      // 우선순위 필터
      if (filterPriority !== 'all' && item.priority !== filterPriority) {
        return false
      }

      // 카테고리 필터
      if (filterCategory !== 'all' && item.category !== filterCategory) {
        return false
      }

      // 상태 필터 (할일만)
      if (activeTab === 'todo' && filterStatus !== 'all') {
        const todo = item as Todo
        if (filterStatus === 'completed' && !todo.completed) return false
        if (filterStatus === 'pending' && todo.completed) return false
      }

      return true
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '높음'
      case 'medium': return '보통'
      case 'low': return '낮음'
      default: return '보통'
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      '회의': 'bg-blue-100 text-blue-800 border-blue-200',
      '업무': 'bg-green-100 text-green-800 border-green-200',
      '아이디어': 'bg-purple-100 text-purple-800 border-purple-200',
      '기타': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[category] || colors['기타']
  }

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  useEffect(() => {
    Promise.all([fetchTodos(), fetchMemos()]).finally(() => setIsLoading(false))

    const todosChannel = supabase
      .channel('todos_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_todos' }, fetchTodos)
      .subscribe()

    const memosChannel = supabase
      .channel('memos_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_memos' }, fetchMemos)
      .subscribe()

    return () => {
      supabase.removeChannel(todosChannel)
      supabase.removeChannel(memosChannel)
    }
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">로딩 중...</div>
        </CardContent>
      </Card>
    )
  }

  const filteredItems = getFilteredItems()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              {activeTab === 'todo' ? (
                <>
                  <CheckSquare className="h-5 w-5" />
                  업무 관리 보드
                </>
              ) : (
                <>
                  <MessageSquare className="h-5 w-5" />
                  메모 보드
                </>
              )}
              <span className="text-muted-foreground">({filteredItems.length})</span>
            </CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* 검색 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`${activeTab === 'todo' ? '할일' : '메모'} 검색...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              {/* 필터 */}
              <div className="flex gap-2">
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="우선순위" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="high">높음</SelectItem>
                    <SelectItem value="medium">보통</SelectItem>
                    <SelectItem value="low">낮음</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="카테고리" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {activeTab === 'todo' && (
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="상태" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="pending">진행중</SelectItem>
                      <SelectItem value="completed">완료</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              {/* 뷰 모드 토글 */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              
              <Button 
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                새 {activeTab === 'todo' ? '할일' : '메모'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* 추가 폼 */}
        {showForm && (
          <CardContent className="border-t">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder={`${activeTab === 'todo' ? '할일' : '메모'} 제목`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Textarea
                placeholder={activeTab === 'todo' ? '할일 설명' : '메모 내용'}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                required={activeTab === 'memo'}
              />
              
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">우선순위</label>
                    <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">낮음</SelectItem>
                        <SelectItem value="medium">보통</SelectItem>
                        <SelectItem value="high">높음</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {activeTab === 'todo' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">마감일</label>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-40"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? '추가 중...' : `${activeTab === 'todo' ? '할일' : '메모'} 추가`}
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    취소
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* 탭 컨트롤 */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ItemType)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="todo" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            할일 ({todos.length})
          </TabsTrigger>
          <TabsTrigger value="memo" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            메모 ({memos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todo" className="mt-6">
          <div className={
            viewMode === 'grid' 
              ? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "space-y-4"
          }>
            {filteredItems.length === 0 ? (
              <Card className={viewMode === 'grid' ? "col-span-full" : ""}>
                <CardContent className="p-6">
                  <div className="text-center text-muted-foreground">
                    조건에 맞는 할일이 없습니다.
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredItems.map((todo) => {
                const daysUntilDue = getDaysUntilDue((todo as Todo).due_date)
                return (
                  <Card key={todo.id} className={`relative ${viewMode === 'list' ? 'flex' : ''}`}>
                    <CardHeader className={`${viewMode === 'list' ? 'flex-1' : 'pb-2'}`}>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={(todo as Todo).completed}
                          onCheckedChange={() => toggleTodo(todo.id, (todo as Todo).completed)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <CardTitle className={`text-lg mb-2 ${(todo as Todo).completed ? 'line-through opacity-60' : ''}`}>
                              {todo.title}
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteItem(todo.id, 'todo')}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(todo.category)}`}>
                              {todo.category}
                            </span>
                            <Badge variant={getPriorityColor(todo.priority)}>
                              {getPriorityText(todo.priority)}
                            </Badge>
                            {(todo as Todo).due_date && daysUntilDue !== null && (
                              <Badge
                                variant={daysUntilDue <= 0 ? "destructive" : daysUntilDue <= 3 ? "secondary" : "outline"}
                              >
                                {daysUntilDue <= 0 ? '지연됨' : `${daysUntilDue}일 남음`}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className={viewMode === 'list' ? 'flex-1' : ''}>
                      {(todo as Todo).description && (
                        <p className={`text-sm text-muted-foreground whitespace-pre-wrap mb-4 ${(todo as Todo).completed ? 'line-through opacity-60' : ''}`}>
                          {(todo as Todo).description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {todo.user_email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(todo.created_at)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="memo" className="mt-6">
          <div className={
            viewMode === 'grid' 
              ? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "space-y-4"
          }>
            {filteredItems.length === 0 ? (
              <Card className={viewMode === 'grid' ? "col-span-full" : ""}>
                <CardContent className="p-6">
                  <div className="text-center text-muted-foreground">
                    조건에 맞는 메모가 없습니다.
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredItems.map((memo) => (
                <Card key={memo.id} className={`relative ${viewMode === 'list' ? 'flex' : ''}`}>
                  <CardHeader className={`${viewMode === 'list' ? 'flex-1' : 'pb-2'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{memo.title}</CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(memo.category)}`}>
                            {memo.category}
                          </span>
                          <Badge variant={getPriorityColor(memo.priority)}>
                            {getPriorityText(memo.priority)}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteItem(memo.id, 'memo')}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className={viewMode === 'list' ? 'flex-1' : ''}>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-4 line-clamp-3">
                      {(memo as Memo).content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {memo.user_email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(memo.created_at)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}