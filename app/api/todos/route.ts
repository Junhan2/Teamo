import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { todosServerApi } from '@/lib/api/todos/server';

// GET /api/todos - Get todos based on filters
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { searchParams } = new URL(request.url);
  
  const spaceId = searchParams.get('spaceId');
  const teamId = searchParams.get('teamId');
  const includeShared = searchParams.get('includeShared') !== 'false';
  const onlyShared = searchParams.get('onlyShared') === 'true';

  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!spaceId) {
      // Get personal todos across all spaces
      const { data, error } = await supabase
        .from('todos')
        .select(`
          *,
          space:spaces(id, name),
          team:teams(id, name)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json(data || []);
    }

    // Get space-specific todos
    const todos = await todosServerApi.getSpaceTodos(
      spaceId,
      session.user.id,
      { includeShared, onlyShared, teamId }
    );

    return NextResponse.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    );
  }
}

// POST /api/todos - Create a new todo
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const body = await request.json();

  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { space_id, team_id, title, description, status, priority, due_date, is_shared } = body;

  if (!space_id || !title) {
    return NextResponse.json(
      { error: 'Space ID and title are required' },
      { status: 400 }
    );
  }

  // Verify user has access to space
  const { data: userSpace } = await supabase
    .from('user_spaces')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('space_id', space_id)
    .single();

  if (!userSpace) {
    return NextResponse.json(
      { error: 'You do not have access to this space' },
      { status: 403 }
    );
  }

  // Create todo
  const { data, error } = await supabase
    .from('todos')
    .insert({
      space_id,
      team_id,
      user_id: session.user.id,
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      due_date,
      is_shared: is_shared || false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
