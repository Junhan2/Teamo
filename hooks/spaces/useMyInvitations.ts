import { useState, useEffect } from 'react';
import { invitationsApi } from '@/lib/api/invitations/client';
import { Database } from '@/types/supabase';

type Invitation = Database['public']['Tables']['space_invitations']['Row'];

export function useMyInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setIsLoading(true);
      const data = await invitationsApi.getMyInvitations();
      setInvitations(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      setInvitations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    await invitationsApi.acceptInvitation(invitationId);
    setInvitations(invitations.filter(inv => inv.id !== invitationId));
  };

  const declineInvitation = async (invitationId: string) => {
    await invitationsApi.declineInvitation(invitationId);
    setInvitations(invitations.filter(inv => inv.id !== invitationId));
  };

  return {
    invitations,
    isLoading,
    error,
    acceptInvitation,
    declineInvitation,
    refresh: loadInvitations,
  };
}
