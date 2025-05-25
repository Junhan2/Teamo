import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface TeamSpace {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  avatar_url?: string;
  color_theme: string;
  member_count?: number;
  role: 'owner' | 'admin' | 'member';
  unread_count?: number;
  is_personal?: boolean;
  created_at: string;
  updated_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export function useTeamSpaces(userId?: string) {
  const [teamSpaces, setTeamSpaces] = useState<TeamSpace[]>([]);
  const [currentTeamSpace, setCurrentTeamSpace] = useState<TeamSpace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  // 팀 스페이스 목록 조회
  const fetchTeamSpaces = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // 사용자가 속한 팀 스페이스 조회
      const { data: memberData, error: memberError } = await supabase
        .from('team_space_members')
        .select(`
          role,
          team_space_id,
          team_spaces!inner (
            id,
            name,
            description,
            owner_id,
            avatar_url,
            color_theme,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId);

      if (memberError) throw memberError;

      // 각 팀 스페이스의 멤버 수 조회
      const teamSpaceIds = memberData?.map(m => m.team_space_id) || [];
      const { data: memberCounts, error: countError } = await supabase
        .from('team_space_members')
        .select('team_space_id')
        .in('team_space_id', teamSpaceIds);

      if (countError) throw countError;

      // 멤버 수 집계
      const memberCountMap = memberCounts?.reduce((acc, member) => {
        acc[member.team_space_id] = (acc[member.team_space_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // 팀 스페이스 데이터 구성
      const spaces: TeamSpace[] = memberData?.map(member => ({
        id: member.team_spaces.id,
        name: member.team_spaces.name,
        description: member.team_spaces.description,
        owner_id: member.team_spaces.owner_id,
        avatar_url: member.team_spaces.avatar_url,
        color_theme: member.team_spaces.color_theme,
        member_count: memberCountMap[member.team_space_id] || 0,
        role: member.role,
        unread_count: 0, // TODO: 실제 미읽음 수 구현
        is_personal: member.team_spaces.name === 'Personal Space',
        created_at: member.team_spaces.created_at,
        updated_at: member.team_spaces.updated_at,
      })) || [];

      setTeamSpaces(spaces);

      // 현재 팀 스페이스가 설정되지 않았으면 개인 스페이스로 설정
      if (!currentTeamSpace && spaces.length > 0) {
        const personalSpace = spaces.find(s => s.is_personal) || spaces[0];
        setCurrentTeamSpace(personalSpace);
      }

    } catch (err) {
      console.error('Error fetching team spaces:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch team spaces');
    } finally {
      setLoading(false);
    }
  }, [userId, supabase, currentTeamSpace]);

  // 팀 스페이스 생성
  const createTeamSpace = useCallback(async (data: {
    name: string;
    description?: string;
    color_theme?: string;
  }) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { data: newTeamSpace, error } = await supabase
        .from('team_spaces')
        .insert([{
          name: data.name,
          description: data.description,
          owner_id: userId,
          color_theme: data.color_theme || 'purple',
        }])
        .select()
        .single();

      if (error) throw error;

      // 소유자를 멤버로 추가
      const { error: memberError } = await supabase
        .from('team_space_members')
        .insert([{
          team_space_id: newTeamSpace.id,
          user_id: userId,
          role: 'owner',
        }]);

      if (memberError) throw memberError;

      // 목록 새로고침
      await fetchTeamSpaces();

      return newTeamSpace;
    } catch (err) {
      console.error('Error creating team space:', err);
      throw err;
    }
  }, [userId, supabase, fetchTeamSpaces]);

  // 팀 스페이스 업데이트
  const updateTeamSpace = useCallback(async (
    teamSpaceId: string,
    updates: Partial<Pick<TeamSpace, 'name' | 'description' | 'color_theme' | 'avatar_url'>>
  ) => {
    try {
      const { error } = await supabase
        .from('team_spaces')
        .update(updates)
        .eq('id', teamSpaceId);

      if (error) throw error;

      // 목록 새로고침
      await fetchTeamSpaces();
    } catch (err) {
      console.error('Error updating team space:', err);
      throw err;
    }
  }, [supabase, fetchTeamSpaces]);

  // 팀 스페이스 삭제
  const deleteTeamSpace = useCallback(async (teamSpaceId: string) => {
    try {
      const { error } = await supabase
        .from('team_spaces')
        .delete()
        .eq('id', teamSpaceId);

      if (error) throw error;

      // 현재 선택된 팀이 삭제된 경우 개인 스페이스로 전환
      if (currentTeamSpace?.id === teamSpaceId) {
        const personalSpace = teamSpaces.find(s => s.is_personal);
        if (personalSpace) {
          setCurrentTeamSpace(personalSpace);
        }
      }

      // 목록 새로고침
      await fetchTeamSpaces();
    } catch (err) {
      console.error('Error deleting team space:', err);
      throw err;
    }
  }, [supabase, fetchTeamSpaces, currentTeamSpace, teamSpaces]);

  // 팀 멤버 초대
  const inviteToTeamSpace = useCallback(async (data: {
    teamSpaceId: string;
    email: string;
    role: 'admin' | 'member';
    message?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('team_space_invitations')
        .insert([{
          team_space_id: data.teamSpaceId,
          invited_by: userId,
          email: data.email,
          role: data.role,
          message: data.message,
        }]);

      if (error) throw error;

      // TODO: 초대 이메일 발송 로직 추가
      console.log('Invitation sent to:', data.email);
    } catch (err) {
      console.error('Error sending invitation:', err);
      throw err;
    }
  }, [supabase, userId]);

  // 초기 로드
  useEffect(() => {
    if (userId) {
      fetchTeamSpaces();
    }
  }, [userId, fetchTeamSpaces]);

  // 실시간 구독
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('team_spaces_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'team_spaces',
      }, () => {
        fetchTeamSpaces();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'team_space_members',
        filter: `user_id=eq.${userId}`,
      }, () => {
        fetchTeamSpaces();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, fetchTeamSpaces]);

  return {
    teamSpaces,
    currentTeamSpace,
    setCurrentTeamSpace,
    loading,
    error,
    createTeamSpace,
    updateTeamSpace,
    deleteTeamSpace,
    inviteToTeamSpace,
    refreshTeamSpaces: fetchTeamSpaces,
  };
}