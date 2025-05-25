import { createClient } from '@/lib/supabase/client'

export async function getSpace(spaceId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('id', spaceId)
    .single()
    
  if (error) throw error
  return data
}

export async function getSpaceMembers(spaceId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_spaces')
    .select(`
      user_id,
      role,
      is_default,
      profiles:user_id(
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('space_id', spaceId)
    
  if (error) throw error
  
  // 데이터 형식 변환
  return data?.map(item => ({
    user_id: item.user_id,
    role: item.role,
    is_active: true,
    profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
  })) || []
}
