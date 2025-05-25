import { useState } from 'react';
import { todosApi } from '@/lib/api/todos/client';

export function useTodoSharing() {
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const toggleSharing = async (todoId: string, currentSharedState: boolean) => {
    try {
      setIsToggling(todoId);
      setError(null);
      
      const updatedTodo = await todosApi.toggleTodoSharing(todoId, !currentSharedState);
      return updatedTodo;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsToggling(null);
    }
  };

  const batchToggleSharing = async (todoIds: string[], isShared: boolean) => {
    try {
      setError(null);
      const updatedTodos = await todosApi.batchToggleSharing(todoIds, isShared);
      return updatedTodos;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    toggleSharing,
    batchToggleSharing,
    isToggling,
    error,
  };
}
