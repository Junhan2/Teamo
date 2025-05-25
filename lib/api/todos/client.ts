import { supabaseClient } from '@/lib/auth/supabase';
import { Database } from '@/types/supabase';

type Todo = Database['public']['Tables']['todos']['Row'];
type TodoInsert = Database['public']['Tables']['todos']['Insert'];
type TodoUpdate = Database['public']['Tables']['todos']['Update'];

export const todosApi = {
  // Get todos for current space
  async getSpaceTodos(spaceId: string, options?: {
    includeShared?: boolean;
    onlyShared?: boolean;
    teamId?: string;
  }) {
    const supabase = await supabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('todos')
      .select('*')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false });

    // Filter by sharing status
    if (options?.onlyShared) {
      query = query.eq('is_shared', true);
    } else if (options?.includeShared === false) {
      query = query.eq('is_shared', false);
    }

    // Filter by team
    if (options?.teamId) {
      query = query.eq('team_id', options.teamId);
    }

    // Only show own todos or shared todos
    if (!options?.onlyShared) {
      query = query.or(`user_id.eq.${user.id},is_shared.eq.true`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Toggle todo sharing status
  async toggleTodoSharing(todoId: string, isShared: boolean) {
    const supabase = await supabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('todos')
      .update({ is_shared: isShared })
      .eq('id', todoId)
      .eq('user_id', user.id) // Only owner can toggle sharing
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Create todo with space context
  async createTodo(todo: Omit<TodoInsert, 'user_id'>) {
    const supabase = await supabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    if (!todo.space_id) {
      throw new Error('Space ID is required');
    }

    // Verify user has access to the space
    const { data: userSpace } = await supabase
      .from('user_spaces')
      .select('id')
      .eq('user_id', user.id)
      .eq('space_id', todo.space_id)
      .single();

    if (!userSpace) {
      throw new Error('You do not have access to this space');
    }

    const { data, error } = await supabase
      .from('todos')
      .insert({
        ...todo,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get personal todos across all spaces
  async getMyTodos(options?: {
    spaceId?: string;
    includeShared?: boolean;
  }) {
    const supabase = await supabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('todos')
      .select(`
        *,
        space:spaces(id, name),
        team:teams(id, name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (options?.spaceId) {
      query = query.eq('space_id', options.spaceId);
    }

    if (options?.includeShared === false) {
      query = query.eq('is_shared', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Get shared todos for a team
  async getTeamTodos(teamId: string, spaceId: string) {
    const supabase = await supabaseClient();
    
    const { data, error } = await supabase
      .from('todos')
      .select(`
        *,
        user:auth.users(email)
      `)
      .eq('team_id', teamId)
      .eq('space_id', spaceId)
      .eq('is_shared', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Batch update sharing status
  async batchToggleSharing(todoIds: string[], isShared: boolean) {
    const supabase = await supabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('todos')
      .update({ is_shared: isShared })
      .in('id', todoIds)
      .eq('user_id', user.id)
      .select();

    if (error) throw error;
    return data || [];
  },
};
