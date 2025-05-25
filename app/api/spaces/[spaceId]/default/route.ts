// app/api/spaces/[spaceId]/default/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

interface RouteParams {
  params: {
    spaceId: string;
  };
}

// POST /api/spaces/[spaceId]/default - 기본 스페이스로 설정
export async function POST(request: NextRequest, { params }: RouteParams) {
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
      .select('id')
      .eq('user_id', user.id)
      .eq('space_id', spaceId)
      .single();

    if (!access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 모든 스페이스의 is_default를 false로
    await supabase
      .from('user_spaces')
      .update({ is_default: false })
      .eq('user_id', user.id);

    // 선택한 스페이스를 기본으로
    const { error } = await supabase
      .from('user_spaces')
      .update({ is_default: true })
      .eq('user_id', user.id)
      .eq('space_id', spaceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // user_settings에도 업데이트
    await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        default_space_id: spaceId,
        updated_at: new Date().toISOString()
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
