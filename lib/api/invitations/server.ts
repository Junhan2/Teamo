import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

type Invitation = Database['public']['Tables']['space_invitations']['Row'];

export const invitationsServerApi = {
  // Send invitation email using Supabase Auth
  async sendInvitationEmail(
    invitation: Invitation,
    spaceName: string,
    inviterName: string
  ): Promise<void> {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // For existing users, we'll send a custom email
    // For new users, we'll use Supabase's invite user feature
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', invitation.email)
      .single();

    if (existingUser) {
      // Send custom notification email (would integrate with email service)
      // For now, we'll just log it
      console.log(`Sending invitation email to existing user: ${invitation.email}`);
      console.log(`Space: ${spaceName}, Inviter: ${inviterName}`);
      
      // In production, integrate with email service like SendGrid, Resend, etc.
      // await sendEmail({
      //   to: invitation.email,
      //   subject: `You're invited to join ${spaceName} on Teamo`,
      //   template: 'space-invitation',
      //   data: { spaceName, inviterName, invitationId: invitation.id }
      // });
    } else {
      // For new users, use Supabase Auth invite
      // This will send them a signup link
      const { error } = await supabase.auth.admin.inviteUserByEmail(invitation.email, {
        data: {
          invitation_id: invitation.id,
          space_id: invitation.space_id,
          invited_to_space: spaceName,
        }
      });

      if (error) {
        console.error('Error sending invite:', error);
        throw error;
      }
    }
  },

  // Process invitation after user signs up
  async processSignupInvitation(userId: string, email: string): Promise<void> {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Find pending invitations for this email
    const { data: invitations, error: invError } = await supabase
      .from('space_invitations')
      .select('*')
      .eq('email', email)
      .eq('status', 'pending');

    if (invError || !invitations || invitations.length === 0) {
      return; // No pending invitations
    }

    // Accept all pending invitations
    for (const invitation of invitations) {
      // Check if not expired
      if (new Date(invitation.expires_at) > new Date()) {
        // Add user to space
        await supabase
          .from('user_spaces')
          .insert({
            user_id: userId,
            space_id: invitation.space_id,
            role: invitation.role,
          });

        // Update invitation status
        await supabase
          .from('space_invitations')
          .update({ 
            status: 'accepted',
            accepted_at: new Date().toISOString()
          })
          .eq('id', invitation.id);
      } else {
        // Mark expired invitations
        await supabase
          .from('space_invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id);
      }
    }
  },
};
