import { Database } from '@/types/supabase'

export type Todo = Database['public']['Tables']['todos']['Row']
export type TodoInsert = Database['public']['Tables']['todos']['Insert']
export type TodoUpdate = Database['public']['Tables']['todos']['Update']

// Todo with space information
export interface TodoWithSpace extends Todo {
  space: {
    id: string
    name: string
  } | null
}

// Todo status type - only 3 values allowed
export type TodoStatus = 'todo' | 'doing' | 'completed'

// Todo priority type  
export type TodoPriority = 'low' | 'medium' | 'high'
