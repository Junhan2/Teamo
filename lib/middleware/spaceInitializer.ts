// lib/middleware/spaceInitializer.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { spacesServer } from '@/lib/api/spaces/server';
import type { Database } from '@/types/supabase';

export async function initializeUserSpace(userId: string) {
  const supabase = createServerComponentClient<Database>({ cookies });

  // 사용자의 스페이스 확인
  const { data: userSpaces } = await supabase
    .from('user_spaces')
    .select('space_id')
    .eq('user_id', userId);

  // 스페이스가 없으면 기본 스페이스 생성
  if (!userSpaces || userSpaces.length === 0) {
    await spacesServer.createDefaultSpaceForUser(userId);
  }
}

// 로그인 후 호출할 함수
export async function onUserLogin(userId: string) {
  await initializeUserSpace(userId);
}
