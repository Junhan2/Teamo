import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

type Todo = Database['public']['Tables']['todos']['Row'];

export const todosServerApi = {
  // Get todos with space access check
  async getSpaceTodos(spaceId: string, userId: string, options?: {
    includeShared?: boolean;
    onlyShared?: boolean;
    teamId?: string;
  }) {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Verify user has access to space
    const { data: userSpace } = await supabase
      .from('user_spaces')
      .select('role')
      .eq('user_id', userId)
      .eq('space_id', spaceId)
      .single();

    if (!userSpace) {
      throw new Error('Access denied to this space');
    }

    let query = supabase
      .from('todos')
      .select(`
        *,
        user:auth.users(id, email),
        team:teams(id, name)
      `)
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (options?.onlyShared) {
      query = query.eq('is_shared', true);
    } else if (options?.includeShared === false) {
      query = query.eq('is_shared', false);
    }

    if (options?.teamId) {
      query = query.eq('team_id', options.teamId);
    }

    // Filter by ownership and sharing
    if (!options?.onlyShared) {
      query = query.or(`user_id.eq.${userId},is_shared.eq.true`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Get aggregated todo stats for a space
  async getSpaceTodoStats(spaceId: string) {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    const { data: todos, error } = await supabase
      .from('todos')
      .select('status, is_shared, user_id')
      .eq('space_id', spaceId);

    if (error) throw error;

    const stats = {
      total: todos.length,
      shared: todos.filter(t => t.is_shared).length,
      personal: todos.filter(t => !t.is_shared).length,
      byStatus: {
        todo: todos.filter(t => t.status === 'todo').length,
        in_progress: todos.filter(t => t.status === 'in_progress').length,
        done: todos.filter(t => t.status === 'done').length,
      },
      byUser: {} as Record<string, number>,
    };

    // Count by user
    todos.forEach(todo => {
      if (todo.user_id) {
        stats.byUser[todo.user_id] = (stats.byUser[todo.user_id] || 0) + 1;
      }
    });

    return stats;
  },
};
