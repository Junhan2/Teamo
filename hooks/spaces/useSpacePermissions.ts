import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Database } from '@/types/supabase';

type UserRole = Database['public']['Tables']['user_spaces']['Row']['role'];

interface SpacePermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canManageMembers: boolean;
  role: UserRole | null;
  isLoading: boolean;
  error: Error | null;
}

export function useSpacePermissions(spaceId: string | null): SpacePermissions {
  const { supabase, session } = useSupabase();
  const [permissions, setPermissions] = useState<SpacePermissions>({
    canView: false,
    canEdit: false,
    canDelete: false,
    canInvite: false,
    canManageMembers: false,
    role: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!spaceId || !session?.user?.id) {
      setPermissions({
        canView: false,
        canEdit: false,
        canDelete: false,
        canInvite: false,
        canManageMembers: false,
        role: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    const checkPermissions = async () => {
      try {
        setPermissions(prev => ({ ...prev, isLoading: true, error: null }));

        // Get user's role in the space
        const { data, error } = await supabase
          .from('user_spaces')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('space_id', spaceId)
          .single();

        if (error) {
          throw error;
        }

        const role = data?.role || null;

        // Define permissions based on role
        const perms: SpacePermissions = {
          canView: !!role,
          canEdit: role === 'owner' || role === 'admin' || role === 'member',
          canDelete: role === 'owner',
          canInvite: role === 'owner' || role === 'admin',
          canManageMembers: role === 'owner' || role === 'admin',
          role,
          isLoading: false,
          error: null,
        };

        setPermissions(perms);
      } catch (error) {
        console.error('Error checking space permissions:', error);
        setPermissions({
          canView: false,
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageMembers: false,
          role: null,
          isLoading: false,
          error: error as Error,
        });
      }
    };

    checkPermissions();
  }, [spaceId, session?.user?.id, supabase]);

  return permissions;
}

// Helper hook to check if user has access to current route's space
export function useRequireSpaceAccess(spaceId: string | null, redirectTo: string = '/') {
  const { canView, isLoading } = useSpacePermissions(spaceId);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!isLoading && spaceId && !canView) {
      setShouldRedirect(true);
    }
  }, [canView, isLoading, spaceId]);

  return { hasAccess: canView, isLoading, shouldRedirect };
}
