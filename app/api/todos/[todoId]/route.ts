import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// PATCH /api/todos/[todoId] - Update todo including sharing status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { todoId: string } }
) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const body = await request.json();

  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify ownership
  const { data: todo } = await supabase
    .from('todos')
    .select('user_id')
    .eq('id', params.todoId)
    .single();

  if (!todo || todo.user_id !== session.user.id) {
    return NextResponse.json(
      { error: 'You can only update your own todos' },
      { status: 403 }
    );
  }

  // Update todo
  const { data, error } = await supabase
    .from('todos')
    .update(body)
    .eq('id', params.todoId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/todos/[todoId] - Delete todo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { todoId: string } }
) {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Delete todo (RLS will ensure only owner can delete)
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', params.todoId)
    .eq('user_id', session.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
