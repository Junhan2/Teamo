import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

type Invitation = Database['public']['Tables']['invitations']['Row']

export interface CreateInvitationParams {
  spaceId: string
  email: string
  role: 'admin' | 'member'
  expiresInDays?: number
}

export interface InvitationWithSpace extends Invitation {
  space: {
    id: string
    name: string
    type: string
  }
}

// 초대 토큰 생성
function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

// 초대 생성
export async function createInvitation({
  spaceId,
  email,
  role,
  expiresInDays = 7
}: CreateInvitationParams) {
  const supabase = createClient()
  
  try {
    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // 만료 시간 계산
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    // 초대 생성
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        space_id: spaceId,
        inviter_id: user.id,
        email,
        role,
        token: generateInviteToken(),
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error creating invitation:', error)
    throw error
  }
}

// 스페이스의 초대 목록 가져오기
export async function getSpaceInvitations(spaceId: string) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data as Invitation[]
  } catch (error) {
    console.error('Error fetching invitations:', error)
    throw error
  }
}

// 토큰으로 초대 정보 가져오기
export async function getInvitationByToken(token: string) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        space:spaces(
          id,
          name,
          type
        )
      `)
      .eq('token', token)
      .single()

    if (error) throw error

    return data as InvitationWithSpace
  } catch (error) {
    console.error('Error fetching invitation:', error)
    throw error
  }
}

// 초대 수락
export async function acceptInvitation(token: string) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .rpc('accept_invitation', {
        invitation_token: token
      })

    if (error) throw error

    if (!data.success) {
      throw new Error(data.error || 'Failed to accept invitation')
    }

    return data
  } catch (error) {
    console.error('Error accepting invitation:', error)
    throw error
  }
}

// 초대 취소
export async function cancelInvitation(invitationId: string) {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('invitations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error cancelling invitation:', error)
    throw error
  }
}

// 만료된 초대 정리
export async function expireOldInvitations() {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .rpc('expire_old_invitations')

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error expiring invitations:', error)
    throw error
  }
}

// 이메일로 초대 전송 (Edge Function 활용 예정)
export async function sendInvitationEmail(invitation: Invitation, spaceName: string) {
  // TODO: Supabase Edge Function을 통한 이메일 전송 구현
  // 현재는 초대 링크만 생성
  const inviteUrl = `${window.location.origin}/invite/${invitation.token}`
  
  console.log('Invitation URL:', inviteUrl)
  
  return {
    success: true,
    inviteUrl
  }
}
