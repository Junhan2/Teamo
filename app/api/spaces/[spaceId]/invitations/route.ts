import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { checkSpaceAccess } from '@/lib/middleware/spaceAccess';
import { invitationsServerApi } from '@/lib/api/invitations/server';

// GET /api/spaces/[spaceId]/invitations - Get all pending invitations
export async function GET(
  request: NextRequest,
  { params }: { params: { spaceId: string } }
) {
  const accessError = await checkSpaceAccess(request, params.spaceId, 'admin');
  if (accessError) return accessError;

  const supabase = createRouteHandlerClient<Database>({ cookies });

  const { data, error } = await supabase
    .from('space_invitations')
    .select(`
      *,
      invited_by_user:auth.users!space_invitations_invited_by_fkey(email)
    `)
    .eq('space_id', params.spaceId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/spaces/[spaceId]/invitations - Create new invitation
export async function POST(
  request: NextRequest,
  { params }: { params: { spaceId: string } }
) {
  const accessError = await checkSpaceAccess(request, params.spaceId, 'admin');
  if (accessError) return accessError;

  const supabase = createRouteHandlerClient<Database>({ cookies });
  const body = await request.json();
  const { email, role = 'member', message } = body;

  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    );
  }

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already exists in space
    const { data: existingMember } = await supabase
      .from('user_spaces')
      .select('id')
      .eq('space_id', params.spaceId)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this space' },
        { status: 400 }
      );
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await supabase
      .from('space_invitations')
      .select('id')
      .eq('space_id', params.spaceId)
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: 'Invitation already sent to this email' },
        { status: 400 }
      );
    }

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('space_invitations')
      .insert({
        space_id: params.spaceId,
        email,
        role,
        invited_by: user.id,
        message,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    // Get space name for email
    const { data: space } = await supabase
      .from('spaces')
      .select('name')
      .eq('id', params.spaceId)
      .single();

    // Send invitation email
    try {
      await invitationsServerApi.sendInvitationEmail(
        invitation,
        space?.name || 'Unknown Space',
        user.email || 'Someone'
      );
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(invitation);
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
