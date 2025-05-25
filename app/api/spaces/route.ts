// app/api/spaces/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

// GET /api/spaces - 사용자의 모든 스페이스 조회
export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userSpaces, error } = await supabase
      .from('user_spaces')
      .select(`
        *,
        space:spaces(*)
      `)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const spaces = userSpaces?.map(us => ({
      ...us.space,
      user_role: us.role,
      is_default: us.is_default
    })) || [];

    return NextResponse.json(spaces);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/spaces - 새 스페이스 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const body = await request.json();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 스페이스 생성
    const { data: space, error: spaceError } = await supabase
      .from('spaces')
      .insert({
        name: body.name,
        description: body.description,
        slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
        created_by: user.id
      })
      .select()
      .single();

    if (spaceError) {
      return NextResponse.json({ error: spaceError.message }, { status: 500 });
    }

    // 생성자를 owner로 추가
    const { error: memberError } = await supabase
      .from('user_spaces')
      .insert({
        user_id: user.id,
        space_id: space.id,
        role: 'owner',
        is_default: false
      });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    return NextResponse.json(space);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
