'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTodoSharing } from '@/hooks/todos/useTodoSharing';
import { toast } from '@/components/ui/use-toast';
import { Users, Lock, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ShareToggleProps {
  todoId: string;
  isShared: boolean;
  hasTeam: boolean;
  onToggle?: (newState: boolean) => void;
  compact?: boolean;
}

export function ShareToggle({
  todoId,
  isShared,
  hasTeam,
  onToggle,
  compact = false,
}: ShareToggleProps) {
  const { toggleSharing, isToggling } = useTodoSharing();
  const isLoading = isToggling === todoId;

  const handleToggle = async () => {
    if (!hasTeam && !isShared) {
      toast({
        title: 'Cannot share',
        description: 'This todo needs to be assigned to a team before sharing',
        variant: 'destructive',
      });
      return;
    }

    try {
      const updatedTodo = await toggleSharing(todoId, isShared);
      toast({
        title: updatedTodo.is_shared ? 'Shared' : 'Made private',
        description: updatedTodo.is_shared 
          ? 'This todo is now visible to your team' 
          : 'This todo is now private',
      });
      
      if (onToggle) {
        onToggle(updatedTodo.is_shared || false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update sharing status',
        variant: 'destructive',
      });
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              disabled={isLoading || (!hasTeam && !isShared)}
              className="h-8 w-8 p-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isShared ? (
                <Users className="h-4 w-4 text-blue-600" />
              ) : (
                <Lock className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isShared ? 'Shared with team' : 'Private'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id={`share-${todoId}`}
        checked={isShared}
        onCheckedChange={handleToggle}
        disabled={isLoading || (!hasTeam && !isShared)}
      />
      <Label
        htmlFor={`share-${todoId}`}
        className="flex items-center gap-2 cursor-pointer"
      >
        {isShared ? (
          <>
            <Users className="h-4 w-4" />
            Shared with team
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Private
          </>
        )}
      </Label>
    </div>
  );
}
