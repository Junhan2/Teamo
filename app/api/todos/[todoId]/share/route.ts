import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// POST /api/todos/[todoId]/share - Toggle sharing status
export async function POST(
  request: NextRequest,
  { params }: { params: { todoId: string } }
) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const body = await request.json();
  const { is_shared } = body;

  if (typeof is_shared !== 'boolean') {
    return NextResponse.json(
      { error: 'is_shared must be a boolean value' },
      { status: 400 }
    );
  }

  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get todo with team info
  const { data: todo, error: todoError } = await supabase
    .from('todos')
    .select('user_id, team_id, space_id')
    .eq('id', params.todoId)
    .single();

  if (todoError || !todo) {
    return NextResponse.json(
      { error: 'Todo not found' },
      { status: 404 }
    );
  }

  if (todo.user_id !== session.user.id) {
    return NextResponse.json(
      { error: 'You can only share your own todos' },
      { status: 403 }
    );
  }

  // If sharing, verify team_id is set
  if (is_shared && !todo.team_id) {
    return NextResponse.json(
      { error: 'Cannot share todo without a team' },
      { status: 400 }
    );
  }

  // Update sharing status
  const { data, error } = await supabase
    .from('todos')
    .update({ is_shared })
    .eq('id', params.todoId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
