// app/api/spaces/[spaceId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

interface RouteParams {
  params: {
    spaceId: string;
  };
}

// GET /api/spaces/[spaceId] - 스페이스 정보 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { spaceId } = params;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 접근 권한 확인
    const { data: access } = await supabase
      .from('user_spaces')
      .select('role')
      .eq('user_id', user.id)
      .eq('space_id', spaceId)
      .single();

    if (!access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 스페이스 정보 조회
    const { data: space, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('id', spaceId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ...space, user_role: access.role });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/spaces/[spaceId] - 스페이스 수정
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { spaceId } = params;
    const body = await request.json();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 권한 확인 (owner 또는 admin만 수정 가능)
    const { data: access } = await supabase
      .from('user_spaces')
      .select('role')
      .eq('user_id', user.id)
      .eq('space_id', spaceId)
      .single();

    if (!access || !['owner', 'admin'].includes(access.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 스페이스 업데이트
    const { data: space, error } = await supabase
      .from('spaces')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', spaceId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(space);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
