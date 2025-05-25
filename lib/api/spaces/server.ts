// lib/api/spaces/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';
import type { Space, UserSpace } from '@/types/space';

export class SpacesServer {
  private supabase;

  constructor() {
    this.supabase = createServerComponentClient<Database>({ cookies });
  }

  // 현재 사용자의 기본 스페이스 가져오기
  async getDefaultSpace(): Promise<Space | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data } = await this.supabase
      .from('user_spaces')
      .select(`
        space:spaces(*)
      `)
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single();

    return data?.space || null;
  }

  // 사용자가 스페이스에 접근 권한이 있는지 확인
  async hasSpaceAccess(spaceId: string, userId?: string): Promise<boolean> {
    const targetUserId = userId || (await this.supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) return false;

    const { data } = await this.supabase
      .from('user_spaces')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('space_id', spaceId)
      .single();

    return !!data;
  }

  // 사용자의 스페이스 역할 가져오기
  async getUserSpaceRole(spaceId: string): Promise<'owner' | 'admin' | 'member' | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data } = await this.supabase
      .from('user_spaces')
      .select('role')
      .eq('user_id', user.id)
      .eq('space_id', spaceId)
      .single();

    return data?.role as 'owner' | 'admin' | 'member' | null;
  }

  // 스페이스가 없는 사용자를 위한 기본 스페이스 생성
  async createDefaultSpaceForUser(userId: string): Promise<Space> {
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    const spaceName = profile?.full_name ? `${profile.full_name}'s Workspace` : 'My Workspace';
    
    // 스페이스 생성
    const { data: space, error: spaceError } = await this.supabase
      .from('spaces')
      .insert({
        name: spaceName,
        description: 'Personal workspace',
        slug: `personal-${userId.substring(0, 8)}`,
        created_by: userId
      })
      .select()
      .single();

    if (spaceError) throw spaceError;

    // 사용자를 owner로 추가
    const { error: memberError } = await this.supabase
      .from('user_spaces')
      .insert({
        user_id: userId,
        space_id: space.id,
        role: 'owner',
        is_default: true
      });

    if (memberError) throw memberError;

    // user_settings 생성/업데이트
    await this.supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        default_space_id: space.id
      });

    return space;
  }
}

export const spacesServer = new SpacesServer();
