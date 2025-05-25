import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// PATCH /api/invitations/[invitationId] - Accept or decline invitation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { invitationId: string } }
) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const body = await request.json();
  const { action } = body;

  if (!action || !['accept', 'decline'].includes(action)) {
    return NextResponse.json(
      { error: 'Invalid action. Must be "accept" or "decline"' },
      { status: 400 }
    );
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get invitation
  const { data: invitation, error: invError } = await supabase
    .from('space_invitations')
    .select('*')
    .eq('id', params.invitationId)
    .eq('email', user.email)
    .eq('status', 'pending')
    .single();

  if (invError || !invitation) {
    return NextResponse.json(
      { error: 'Invitation not found or already processed' },
      { status: 404 }
    );
  }

  // Check expiration
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase
      .from('space_invitations')
      .update({ status: 'expired' })
      .eq('id', params.invitationId);

    return NextResponse.json(
      { error: 'Invitation has expired' },
      { status: 400 }
    );
  }

  if (action === 'accept') {
    // Add user to space
    const { error: joinError } = await supabase
      .from('user_spaces')
      .insert({
        user_id: user.id,
        space_id: invitation.space_id,
        role: invitation.role,
      });

    if (joinError) {
      return NextResponse.json(
        { error: 'Failed to join space' },
        { status: 500 }
      );
    }
  }

  // Update invitation status
  const { error: updateError } = await supabase
    .from('space_invitations')
    .update({
      status: action === 'accept' ? 'accepted' : 'declined',
      [action === 'accept' ? 'accepted_at' : 'declined_at']: new Date().toISOString()
    })
    .eq('id', params.invitationId);

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to update invitation' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, action });
}

// DELETE /api/invitations/[invitationId] - Cancel invitation (by inviter)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { invitationId: string } }
) {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get invitation
  const { data: invitation, error: invError } = await supabase
    .from('space_invitations')
    .select('space_id, invited_by')
    .eq('id', params.invitationId)
    .eq('status', 'pending')
    .single();

  if (invError || !invitation) {
    return NextResponse.json(
      { error: 'Invitation not found' },
      { status: 404 }
    );
  }

  // Check permissions
  const isInviter = invitation.invited_by === user.id;
  
  if (!isInviter) {
    const { data: userSpace } = await supabase
      .from('user_spaces')
      .select('role')
      .eq('user_id', user.id)
      .eq('space_id', invitation.space_id)
      .single();

    if (!userSpace || (userSpace.role !== 'owner' && userSpace.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
  }

  // Cancel invitation
  const { error: cancelError } = await supabase
    .from('space_invitations')
    .update({ status: 'cancelled' })
    .eq('id', params.invitationId);

  if (cancelError) {
    return NextResponse.json(
      { error: 'Failed to cancel invitation' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
