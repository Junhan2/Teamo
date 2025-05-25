// lib/api/spaces/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import type { Space, UserSpace, CreateSpaceDto, UpdateSpaceDto, SpaceWithRole } from '@/types/space';

export class SpacesClient {
  private supabase;

  constructor() {
    this.supabase = createClientComponentClient<Database>();
  }

  // 사용자의 모든 스페이스 조회 - API 라우트 사용
  async getUserSpaces(): Promise<SpaceWithRole[]> {
    const response = await fetch('/api/spaces');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch spaces');
    }
    
    return response.json();
  }

  // 스페이스 생성 - API 라우트 사용
  async createSpace(dto: CreateSpaceDto): Promise<Space> {
    const response = await fetch('/api/spaces', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create space');
    }

    return response.json();
  }

  // 스페이스 정보 조회
  async getSpace(spaceId: string): Promise<Space> {
    const response = await fetch(`/api/spaces/${spaceId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch space');
    }
    
    return response.json();
  }

  // 스페이스 수정
  async updateSpace(spaceId: string, dto: UpdateSpaceDto): Promise<Space> {
    const response = await fetch(`/api/spaces/${spaceId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update space');
    }

    return response.json();
  }
  // 기본 스페이스 설정
  async setDefaultSpace(spaceId: string): Promise<void> {
    const response = await fetch(`/api/spaces/${spaceId}/default`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to set default space');
    }
  }
  }

  // 스페이스 멤버 조회
  async getSpaceMembers(spaceId: string) {
    const response = await fetch(`/api/spaces/${spaceId}/members`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch members');
    }
    
    return response.json();
  }

  // 초대 링크 생성
  async createInvitation(spaceId: string, role: 'member' | 'admin'): Promise<{ invitation_link: string }> {
    const response = await fetch(`/api/spaces/${spaceId}/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create invitation');
    }

    return response.json();
  }
}

export const spacesClient = new SpacesClient();
