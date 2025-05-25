// Teamo 멀티 스페이스 타입 정의
// types/space.ts

export interface Space {
  id: string;
  name: string;
  description?: string;
  slug: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface UserSpace {
  id: string;
  user_id: string;
  space_id: string;
  role: 'owner' | 'admin' | 'member';
  is_default: boolean;
  joined_at: string;
  updated_at: string;
  // Relations
  space?: Space;
}

export interface SpaceInvitation {
  id: string;
  space_id: string;
  email: string;
  role: 'admin' | 'member';
  token: string;
  invited_by: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  // Relations
  space?: Space;
}

export interface UserSettings {
  id: string;
  user_id: string;
  default_space_id?: string;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Relations
  default_space?: Space;
}

// 기존 Todo 타입 확장
export interface Todo {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed';
  user_id: string;
  team_id: string;
  space_id: string; // 새로 추가
  is_shared: boolean; // 새로 추가
  labels?: any[];
  estimated_hours?: number;
  created_at: string;
  updated_at: string;
  // Relations
  user?: any;
  team?: any;
  space?: Space;
}

// API 응답 타입
export interface SpaceWithRole extends Space {
  user_role: 'owner' | 'admin' | 'member';
  is_default: boolean;
}

// 스페이스 생성/수정 DTO
export interface CreateSpaceDto {
  name: string;
  description?: string;
  slug?: string;
}

export interface UpdateSpaceDto {
  name?: string;
  description?: string;
}

// 초대 관련 DTO
export interface CreateInvitationDto {
  email: string;
  role: 'admin' | 'member';
}

export interface AcceptInvitationDto {
  token: string;
}
