// lib/api/spaces/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import type { Space, UserSpace, CreateSpaceDto, UpdateSpaceDto, SpaceWithRole } from '@/types/space';

export class SpacesClient {
  private supabase;

  constructor() {
    this.supabase = createClientComponentClient<Database>();
  }

  // 사용자의 모든 스페이스 조회 (RPC 함수 사용)
  async getUserSpaces(): Promise<SpaceWithRole[]> {
    const { data, error } = await this.supabase
      .rpc('get_user_spaces_with_details');

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // RPC 결과를 SpaceWithRole 형식으로 변환
    return data.map(row => ({
      id: row.space_id,
      name: row.space_name,
      description: row.space_description,
      type: row.space_type,
      slug: row.space_slug,
      created_by: row.space_created_by,
      created_at: row.space_created_at,
      updated_at: row.space_updated_at,
      user_role: row.role,
      is_default: row.is_default,
      joined_at: row.joined_at
    }));
  }

  // 스페이스 생성
  async createSpace(dto: CreateSpaceDto): Promise<Space> {
    const user = (await this.supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Unauthorized');

    // 스페이스 생성
    const { data: space, error: spaceError } = await this.supabase
      .from('spaces')
      .insert({
        name: dto.name,
        description: dto.description,
        slug: dto.slug || dto.name.toLowerCase().replace(/\s+/g, '-'),
        created_by: user.id
      })
      .select()
      .single();

    if (spaceError) throw spaceError;

    // 생성자를 owner로 추가
    const { error: memberError } = await this.supabase
      .from('user_spaces')
      .insert({
        user_id: user.id,
        space_id: space.id,
        role: 'owner',
        is_default: false
      });

    if (memberError) throw memberError;

    return space;
  }

  // 스페이스 정보 조회
  async getSpace(spaceId: string): Promise<Space> {
    const { data, error } = await this.supabase
      .from('spaces')
      .select('*')
      .eq('id', spaceId)
      .single();

    if (error) throw error;
    return data;
  }

  // 스페이스 수정
  async updateSpace(spaceId: string, dto: UpdateSpaceDto): Promise<Space> {
    const { data, error } = await this.supabase
      .from('spaces')
      .update({
        ...dto,
        updated_at: new Date().toISOString()
      })
      .eq('id', spaceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 기본 스페이스 설정
  async setDefaultSpace(spaceId: string): Promise<void> {
    const user = (await this.supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Unauthorized');

    // 모든 스페이스의 is_default를 false로
    await this.supabase
      .from('user_spaces')
      .update({ is_default: false })
      .eq('user_id', user.id);

    // 선택한 스페이스를 기본으로
    const { error } = await this.supabase
      .from('user_spaces')
      .update({ is_default: true })
      .eq('user_id', user.id)
      .eq('space_id', spaceId);

    if (error) throw error;

    // user_settings에도 업데이트
    await this.supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        default_space_id: spaceId,
        updated_at: new Date().toISOString()
      });
  }

  // 스페이스 멤버 조회
  async getSpaceMembers(spaceId: string) {
    const { data, error } = await this.supabase
      .from('user_spaces')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('space_id', spaceId);

    if (error) throw error;
    return data;
  }
}

export const spacesClient = new SpacesClient();
