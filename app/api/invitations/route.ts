import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// GET /api/invitations - Get current user's pending invitations
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('space_invitations')
    .select(`
      *,
      space:spaces(id, name, description),
      invited_by_user:auth.users!space_invitations_invited_by_fkey(email)
    `)
    .eq('email', user.email)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
