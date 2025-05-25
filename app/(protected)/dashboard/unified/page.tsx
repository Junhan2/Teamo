"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getSpaceGroupedTodos, getUnifiedStats, SpaceGroupedTodos, UnifiedStats } from "@/lib/api/todos/unified"
import Navbar from "@/components/Navbar"
import PageLoading from "@/components/PageLoading"
import SpaceGroupedTodoCard from "@/components/todos/SpaceGroupedTodoCard"
import UnifiedFilters, { UnifiedFilterOptions } from "@/components/todos/UnifiedFilters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { 
  LayoutGrid, 
  CheckCircle2, 
  Clock, 
  CircleDot, 
  Users, 
  Lock, 
  Globe,
  Sparkles,
  ArrowLeft,
  Plus
} from "lucide-react"
import Link from "next/link"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

export default function UnifiedDashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [groupedTodos, setGroupedTodos] = useState<SpaceGroupedTodos[]>([])
  const [filteredTodos, setFilteredTodos] = useState<SpaceGroupedTodos[]>([])
  const [stats, setStats] = useState<UnifiedStats | null>(null)
  const [filters, setFilters] = useState<UnifiedFilterOptions>({
    spaces: [],
    status: 'all',
    shareType: 'all'
  })
  
  const router = useRouter()
  const supabase = createClient()

  // 사용자 확인
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/auth/login')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUser(profile)
        }
      } catch (error) {
        console.error('Error checking user:', error)
        router.push('/auth/login')
      }
    }

    checkUser()
  }, [router, supabase])

  // 데이터 가져오기
  const fetchData = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      // 통계와 그룹핑된 할일 가져오기
      const [statsData, todosData] = await Promise.all([
        getUnifiedStats(user.id),
        getSpaceGroupedTodos(user.id)
      ])

      setStats(statsData)
      setGroupedTodos(todosData)
      setFilteredTodos(todosData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 필터 적용
  useEffect(() => {
    let filtered = [...groupedTodos]

    // 스페이스 필터
    if (filters.spaces.length > 0) {
      filtered = filtered.filter(group => 
        filters.spaces.includes(group.space.id)
      )
    }

    // 각 그룹의 할일을 필터링
    filtered = filtered.map(group => ({
      ...group,
      todos: group.todos.filter(todo => {
        // 상태 필터
        if (filters.status !== 'all' && todo.status !== filters.status) {
          return false
        }

        // 공유 타입 필터
        if (filters.shareType === 'personal' && todo.is_shared) {
          return false
        }
        if (filters.shareType === 'shared' && !todo.is_shared) {
          return false
        }

        return true
      })
    }))

    // 빈 그룹 제거 옵션 (현재는 유지)
    // filtered = filtered.filter(group => group.todos.length > 0)

    // 통계 재계산
    filtered = filtered.map(group => ({
      ...group,
      stats: {
        total: group.todos.length,
        completed: group.todos.filter(t => t.status === 'completed').length,
        inProgress: group.todos.filter(t => t.status === 'in_progress').length,
        pending: group.todos.filter(t => t.status === 'pending').length
      }
    }))

    setFilteredTodos(filtered)
  }, [filters, groupedTodos])

  if (loading) {
    return <PageLoading message="통합 대시보드를 불러오는 중..." />
  }

  if (!user) {
    return null
  }

  const allSpaces = groupedTodos.map(g => ({
    id: g.space.id,
    name: g.space.name,
    type: g.space.type
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar user={user} />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  기본 대시보드
                </Button>
              </Link>
            </div>
            
            <Link href="/spaces">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                새 스페이스
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">통합 대시보드</h1>
              <p className="text-gray-600">모든 스페이스의 할일을 한눈에</p>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">전체 스페이스</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalSpaces}</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">전체 할일</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalTodos}</p>
                  </div>
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <CircleDot className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">완료율</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.totalTodos > 0 
                        ? Math.round((stats.completedTodos / stats.totalTodos) * 100) 
                        : 0}%
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">공유 할일</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.sharedTodos}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Globe className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 필터 사이드바 */}
          <div className="lg:col-span-1">
            <UnifiedFilters
              spaces={allSpaces}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>

          {/* 할일 목록 */}
          <div className="lg:col-span-3 space-y-4">
            {filteredTodos.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">필터 조건에 맞는 할일이 없습니다</p>
                </CardContent>
              </Card>
            ) : (
              filteredTodos.map((group) => (
                <motion.div
                  key={group.space.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <SpaceGroupedTodoCard
                    groupedTodos={group}
                    onTodoUpdate={fetchData}
                    defaultExpanded={filteredTodos.length <= 3}
                  />
                </motion.div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
