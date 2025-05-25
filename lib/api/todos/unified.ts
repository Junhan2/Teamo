import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

type Todo = Database['public']['Tables']['todos']['Row']
type Space = Database['public']['Tables']['spaces']['Row']

export interface TodoWithSpace extends Todo {
  space: Space
}

export interface SpaceGroupedTodos {
  space: Space
  todos: Todo[]
  stats: {
    total: number
    completed: number
    inProgress: number
    pending: number
  }
}

// 모든 스페이스의 내 할일 가져오기
export async function getUnifiedTodos(userId: string) {
  const supabase = createClient()
  
  try {
    // 사용자가 속한 모든 스페이스의 할일 가져오기
    const { data: todos, error } = await supabase
      .from('todos')
      .select(`
        *,
        space:spaces(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching unified todos:', error)
      throw error
    }

    return todos as TodoWithSpace[]
  } catch (error) {
    console.error('Failed to fetch unified todos:', error)
    throw error
  }
}

// 스페이스별로 그룹핑된 할일 가져오기
export async function getSpaceGroupedTodos(userId: string): Promise<SpaceGroupedTodos[]> {
  const supabase = createClient()
  
  try {
    // 1. 사용자가 속한 모든 스페이스 가져오기
    const { data: memberSpaces, error: spacesError } = await supabase
      .from('space_members')
      .select(`
        space:spaces(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)

    if (spacesError) {
      console.error('Error fetching user spaces:', spacesError)
      throw spacesError
    }

    if (!memberSpaces || memberSpaces.length === 0) {
      return []
    }

    // 2. 각 스페이스별로 할일 가져오기
    const spaceIds = memberSpaces.map(ms => ms.space.id)
    
    const { data: todos, error: todosError } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .in('space_id', spaceIds)
      .order('created_at', { ascending: false })

    if (todosError) {
      console.error('Error fetching todos:', todosError)
      throw todosError
    }

    // 3. 스페이스별로 그룹핑
    const groupedData: SpaceGroupedTodos[] = memberSpaces.map(ms => {
      const space = ms.space
      const spaceTodos = todos?.filter(todo => todo.space_id === space.id) || []
      
      return {
        space,
        todos: spaceTodos,
        stats: {
          total: spaceTodos.length,
          completed: spaceTodos.filter(t => t.status === 'completed').length,
          inProgress: spaceTodos.filter(t => t.status === 'in_progress').length,
          pending: spaceTodos.filter(t => t.status === 'pending').length
        }
      }
    })

    // 할일이 있는 스페이스를 먼저 정렬
    return groupedData.sort((a, b) => b.todos.length - a.todos.length)
  } catch (error) {
    console.error('Failed to fetch space grouped todos:', error)
    throw error
  }
}

// 특정 스페이스들의 할일 필터링
export async function filterTodosBySpaces(
  userId: string,
  spaceIds: string[]
): Promise<TodoWithSpace[]> {
  const supabase = createClient()
  
  try {
    const { data: todos, error } = await supabase
      .from('todos')
      .select(`
        *,
        space:spaces(*)
      `)
      .eq('user_id', userId)
      .in('space_id', spaceIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error filtering todos by spaces:', error)
      throw error
    }

    return todos as TodoWithSpace[]
  } catch (error) {
    console.error('Failed to filter todos by spaces:', error)
    throw error
  }
}

// 통합 대시보드 통계
export interface UnifiedStats {
  totalSpaces: number
  totalTodos: number
  completedTodos: number
  inProgressTodos: number
  pendingTodos: number
  sharedTodos: number
  personalTodos: number
}

export async function getUnifiedStats(userId: string): Promise<UnifiedStats> {
  const supabase = createClient()
  
  try {
    // 사용자가 속한 스페이스 수
    const { count: spacesCount } = await supabase
      .from('space_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true)

    // 모든 할일 가져오기
    const { data: todos, error } = await supabase
      .from('todos')
      .select('status, is_shared')
      .eq('user_id', userId)

    if (error) throw error

    const stats: UnifiedStats = {
      totalSpaces: spacesCount || 0,
      totalTodos: todos?.length || 0,
      completedTodos: todos?.filter(t => t.status === 'completed').length || 0,
      inProgressTodos: todos?.filter(t => t.status === 'in_progress').length || 0,
      pendingTodos: todos?.filter(t => t.status === 'pending').length || 0,
      sharedTodos: todos?.filter(t => t.is_shared).length || 0,
      personalTodos: todos?.filter(t => !t.is_shared).length || 0
    }

    return stats
  } catch (error) {
    console.error('Failed to fetch unified stats:', error)
    throw error
  }
}
