import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function checkSpaceAccess(
  request: NextRequest,
  spaceId: string,
  requiredRole?: 'owner' | 'admin' | 'member'
) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  
  // Get current user
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Check user's role in the space
  const { data: userSpace, error: roleError } = await supabase
    .from('user_spaces')
    .select('role')
    .eq('user_id', session.user.id)
    .eq('space_id', spaceId)
    .single();

  if (roleError || !userSpace) {
    return NextResponse.json(
      { error: 'Access denied to this space' },
      { status: 403 }
    );
  }

  // Check required role if specified
  if (requiredRole) {
    const roleHierarchy = { owner: 3, admin: 2, member: 1 };
    const userRoleLevel = roleHierarchy[userSpace.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return NextResponse.json(
        { error: `Insufficient permissions. Required role: ${requiredRole}` },
        { status: 403 }
      );
    }
  }

  return null; // Access granted
}
