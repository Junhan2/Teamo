'use client';

import { useState, useEffect } from 'react';
import { useSpace } from '@/contexts/SpaceContext';
import { useTodos } from '@/hooks/todos/useTodos';
import { ShareToggle } from '@/components/todos/ShareToggle';
import { SpaceInfo } from '@/components/spaces/SpaceInfo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AddTodoForm from '@/components/AddTodoForm';
import { todosApi } from '@/lib/api/todos/client';
import { Database } from '@/types/supabase';
import {
  Calendar,
  Clock,
  Users,
  Filter,
  Plus,
  Loader2,
  CheckCircle2,
  Circle,
  AlertCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

type Todo = Database['public']['Tables']['todos']['Row'];

interface SpaceTodoListProps {
  teamId?: string;
  userId?: string;
  showSpaceInfo?: boolean;
  showSpaceSelector?: boolean;
  limit?: number;
}

export function SpaceTodoList({ 
  teamId, 
  userId, 
  showSpaceInfo = true,
  showSpaceSelector = false,
  limit 
}: SpaceTodoListProps) {
  const { currentSpace } = useSpace();
  const [filter, setFilter] = useState<'all' | 'personal' | 'shared'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const { todos, isLoading, error, toggleSharing, refresh } = useTodos({
    teamId,
    includeShared: filter !== 'personal',
    onlyShared: filter === 'shared',
  });

  const handleStatusChange = async (todoId: string, newStatus: string) => {
    try {
      await todosApi.updateTodo(todoId, { status: newStatus });
      toast({
        title: 'Status updated',
        description: 'Todo status has been updated',
      });
      refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update todo status',
        variant: 'destructive',
      });
    }
  };

  const handleTodoAdded = () => {
    setIsAddDialogOpen(false);
    refresh();
  };

  const filteredTodos = todos.filter(todo => {
    if (userId && todo.user_id !== userId) return false;
    if (statusFilter !== 'all' && todo.status !== statusFilter) return false;
    return true;
  }).slice(0, limit);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'doing':
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'text-green-600 bg-green-50';
      case 'doing':
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Failed to load todos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">Tasks</h2>
          {showSpaceInfo && <SpaceInfo />}
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            {userId && (
              <AddTodoForm 
                userId={userId} 
                spaceId={currentSpace?.id}
                onTodoAdded={handleTodoAdded}
                showSpaceSelector={showSpaceSelector}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="personal">Personal Only</SelectItem>
            <SelectItem value="shared">Shared Only</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="doing">Doing</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Todo List */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : filteredTodos.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No tasks found</p>
              <Button variant="link" className="mt-2" onClick={() => setFilter('all')}>
                Clear filters
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTodos.map((todo) => (
            <Card key={todo.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 flex-1">
                  <Checkbox
                    checked={todo.status === 'done'}
                    onCheckedChange={(checked) => 
                      handleStatusChange(todo.id, checked ? 'done' : 'todo')
                    }
                  />
                  
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      todo.status === 'done' ? 'line-through text-muted-foreground' : ''
                    }`}>
                      {todo.title}
                    </h3>
                    {todo.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {todo.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Badge 
                            variant="outline" 
                            className={`cursor-pointer hover:bg-opacity-80 transition-colors ${getStatusColor(todo.status)}`}
                          >
                            {getStatusIcon(todo.status)}
                            <span className="ml-1 capitalize">
                              {todo.status.replace('_', ' ')}
                            </span>
                          </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(todo.id, 'todo')}
                            className="flex items-center gap-2"
                          >
                            <Circle className="h-4 w-4 text-gray-400" />
                            To Do
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(todo.id, 'doing')}
                            className="flex items-center gap-2"
                          >
                            <Clock className="h-4 w-4 text-blue-600" />
                            Doing
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(todo.id, 'done')}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            Done
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      {todo.due_date && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(todo.due_date), 'MMM d')}
                        </div>
                      )}
                      
                      {todo.team_id && (
                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3 w-3" />
                          Team
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <ShareToggle
                    todoId={todo.id}
                    isShared={todo.is_shared || false}
                    hasTeam={!!todo.team_id}
                    compact
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
