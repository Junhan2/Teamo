'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, MessageSquare, Trash2, User, Calendar, Search, Filter, Grid, List } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"

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

export default function TeamMemoGrid() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [filteredMemos, setFilteredMemos] = useState<Memo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const categories = ['회의', '업무', '아이디어', '기타']

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
        category: memo.category || '기타'
      })) || []

      setMemos(memosWithUserEmail)
      setFilteredMemos(memosWithUserEmail)
    } catch (error) {
      console.error('Error fetching memos:', error)
      toast({
        title: "오류",
        description: "메모 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 필터링 로직
  useEffect(() => {
    let filtered = memos

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(memo => 
        memo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memo.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 우선순위 필터
    if (filterPriority !== 'all') {
      filtered = filtered.filter(memo => memo.priority === filterPriority)
    }

    // 카테고리 필터
    if (filterCategory !== 'all') {
      filtered = filtered.filter(memo => memo.category === filterCategory)
    }

    setFilteredMemos(filtered)
  }, [memos, searchTerm, filterPriority, filterCategory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

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

      setTitle('')
      setContent('')
      setCategory('')
      setPriority('medium')
      setShowForm(false)
      fetchMemos()
      
      toast({
        title: "성공!",
        description: "메모가 추가되었습니다.",
      })
    } catch (error) {
      console.error('Error adding memo:', error)
      toast({
        title: "오류",
        description: "메모 추가에 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteMemo = async (id: string) => {
    if (!confirm('정말로 이 메모를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('team_memos')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMemos(memos.filter(memo => memo.id !== id))
      
      toast({
        title: "삭제 완료",
        description: "메모가 삭제되었습니다.",
      })
    } catch (error) {
      console.error('Error deleting memo:', error)
      toast({
        title: "오류",
        description: "메모 삭제에 실패했습니다.",
        variant: "destructive",
      })
    }
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

  useEffect(() => {
    fetchMemos()

    const channel = supabase
      .channel('memos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_memos'
        },
        () => {
          fetchMemos()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
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

  return (
    <div className="space-y-6">
      {/* 헤더와 컨트롤 */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              팀 메모 보드 ({filteredMemos.length})
            </CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* 검색 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="메모 검색..."
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
                새 메모
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* 메모 추가 폼 */}
        {showForm && (
          <CardContent className="border-t">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="메모 제목"
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
                placeholder="메모 내용"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                required
              />
              
              <div className="flex items-center justify-between">
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
                
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? '추가 중...' : '메모 추가'}
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

      {/* 메모 목록 */}
      <div className={
        viewMode === 'grid' 
          ? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
          : "space-y-4"
      }>
        {filteredMemos.length === 0 ? (
          <Card className={viewMode === 'grid' ? "col-span-full" : ""}>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                {searchTerm || filterPriority !== 'all' || filterCategory !== 'all' 
                  ? '조건에 맞는 메모가 없습니다.' 
                  : '아직 메모가 없습니다. 첫 번째 메모를 작성해보세요!'
                }
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredMemos.map((memo) => (
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
                    onClick={() => deleteMemo(memo.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className={viewMode === 'list' ? 'flex-1' : ''}>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-4 line-clamp-3">
                  {memo.content}
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
    </div>
  )
}