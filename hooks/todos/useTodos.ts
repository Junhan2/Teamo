import { useState, useEffect } from 'react';
import { todosApi } from '@/lib/api/todos/client';
import { Database } from '@/types/supabase';
import { useSpace } from '@/contexts/SpaceContext';

type Todo = Database['public']['Tables']['todos']['Row'];

interface UseTodosOptions {
  includeShared?: boolean;
  onlyShared?: boolean;
  teamId?: string;
}

export function useTodos(options: UseTodosOptions = {}) {
  const { currentSpace } = useSpace();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentSpace) {
      setTodos([]);
      setIsLoading(false);
      return;
    }

    loadTodos();
  }, [currentSpace, options.includeShared, options.onlyShared, options.teamId]);

  const loadTodos = async () => {
    if (!currentSpace) return;

    try {
      setIsLoading(true);
      const data = await todosApi.getSpaceTodos(currentSpace.id, options);
      setTodos(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      setTodos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSharing = async (todoId: string, isShared: boolean) => {
    try {
      const updatedTodo = await todosApi.toggleTodoSharing(todoId, isShared);
      setTodos(todos.map(t => t.id === todoId ? updatedTodo : t));
      return updatedTodo;
    } catch (err) {
      throw err;
    }
  };

  const createTodo = async (todo: Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!currentSpace) throw new Error('No space selected');
    
    const newTodo = await todosApi.createTodo({
      ...todo,
      space_id: currentSpace.id,
    });
    setTodos([newTodo, ...todos]);
    return newTodo;
  };

  return {
    todos,
    isLoading,
    error,
    toggleSharing,
    createTodo,
    refresh: loadTodos,
  };
}
