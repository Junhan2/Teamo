import { useState, useEffect } from 'react';
import { invitationsApi } from '@/lib/api/invitations/client';
import { Database } from '@/types/supabase';

type Invitation = Database['public']['Tables']['space_invitations']['Row'];

export function useSpaceInvitations(spaceId: string | null) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!spaceId) {
      setInvitations([]);
      setIsLoading(false);
      return;
    }

    const loadInvitations = async () => {
      try {
        setIsLoading(true);
        const data = await invitationsApi.getSpaceInvitations(spaceId);
        setInvitations(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
        setInvitations([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadInvitations();
  }, [spaceId]);

  const sendInvitation = async (email: string, role: 'admin' | 'member' = 'member', message?: string) => {
    if (!spaceId) throw new Error('No space selected');
    
    const invitation = await invitationsApi.createInvitation(spaceId, email, role, message);
    setInvitations([invitation, ...invitations]);
    return invitation;
  };

  const cancelInvitation = async (invitationId: string) => {
    await invitationsApi.cancelInvitation(invitationId);
    setInvitations(invitations.filter(inv => inv.id !== invitationId));
  };

  return {
    invitations,
    isLoading,
    error,
    sendInvitation,
    cancelInvitation,
  };
}
