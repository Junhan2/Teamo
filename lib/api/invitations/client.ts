import { supabaseClient } from '@/lib/auth/supabase';
import { Database } from '@/types/supabase';

type Invitation = Database['public']['Tables']['space_invitations']['Row'];
type InvitationInsert = Database['public']['Tables']['space_invitations']['Insert'];
type InvitationUpdate = Database['public']['Tables']['space_invitations']['Update'];

export const invitationsApi = {
  // Create a new invitation
  async createInvitation(
    spaceId: string,
    email: string,
    role: 'admin' | 'member' = 'member',
    message?: string
  ): Promise<Invitation> {
    const supabase = await supabaseClient();
    
    // Get current user as inviter
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    // Check if user has permission to invite
    const { data: userSpace, error: permError } = await supabase
      .from('user_spaces')
      .select('role')
      .eq('user_id', user.id)
      .eq('space_id', spaceId)
      .single();

    if (permError || !userSpace || (userSpace.role !== 'owner' && userSpace.role !== 'admin')) {
      throw new Error('Insufficient permissions to invite users');
    }

    // Check if invitation already exists
    const { data: existingInvite } = await supabase
      .from('space_invitations')
      .select('*')
      .eq('space_id', spaceId)
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      throw new Error('Invitation already sent to this email');
    }

    // Create invitation
    const { data, error } = await supabase
      .from('space_invitations')
      .insert({
        space_id: spaceId,
        email,
        role,
        invited_by: user.id,
        message,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get pending invitations for a space
  async getSpaceInvitations(spaceId: string): Promise<Invitation[]> {
    const supabase = await supabaseClient();
    
    const { data, error } = await supabase
      .from('space_invitations')
      .select('*')
      .eq('space_id', spaceId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get invitations for current user's email
  async getMyInvitations(): Promise<Invitation[]> {
    const supabase = await supabaseClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('space_invitations')
      .select('*')
      .eq('email', user.email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Accept an invitation
  async acceptInvitation(invitationId: string): Promise<void> {
    const supabase = await supabaseClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    // Get invitation details
    const { data: invitation, error: invError } = await supabase
      .from('space_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('email', user.email)
      .eq('status', 'pending')
      .single();

    if (invError || !invitation) throw new Error('Invalid invitation');

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('Invitation has expired');
    }

    // Start transaction to add user to space and update invitation
    const { error: joinError } = await supabase
      .from('user_spaces')
      .insert({
        user_id: user.id,
        space_id: invitation.space_id,
        role: invitation.role,
      });

    if (joinError) throw joinError;

    // Update invitation status
    const { error: updateError } = await supabase
      .from('space_invitations')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitationId);

    if (updateError) throw updateError;
  },

  // Decline an invitation
  async declineInvitation(invitationId: string): Promise<void> {
    const supabase = await supabaseClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('space_invitations')
      .update({ status: 'declined' })
      .eq('id', invitationId)
      .eq('email', user.email)
      .eq('status', 'pending');

    if (error) throw error;
  },

  // Cancel an invitation (by inviter)
  async cancelInvitation(invitationId: string): Promise<void> {
    const supabase = await supabaseClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    // Verify user has permission to cancel
    const { data: invitation, error: invError } = await supabase
      .from('space_invitations')
      .select('space_id, invited_by')
      .eq('id', invitationId)
      .single();

    if (invError || !invitation) throw new Error('Invitation not found');

    // Check if user is the inviter or has admin/owner role in the space
    const isInviter = invitation.invited_by === user.id;
    
    if (!isInviter) {
      const { data: userSpace, error: permError } = await supabase
        .from('user_spaces')
        .select('role')
        .eq('user_id', user.id)
        .eq('space_id', invitation.space_id)
        .single();

      if (permError || !userSpace || (userSpace.role !== 'owner' && userSpace.role !== 'admin')) {
        throw new Error('Insufficient permissions to cancel invitation');
      }
    }

    // Cancel the invitation
    const { error } = await supabase
      .from('space_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId)
      .eq('status', 'pending');

    if (error) throw error;
  },
};
