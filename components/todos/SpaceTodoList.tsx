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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  Activity,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ListTodo,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, differenceInDays } from 'date-fns';

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
  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set());
  
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

  const toggleTodoExpansion = (todoId: string) => {
    const newExpanded = new Set(expandedTodos);
    if (newExpanded.has(todoId)) {
      newExpanded.delete(todoId);
    } else {
      newExpanded.add(todoId);
    }
    setExpandedTodos(newExpanded);
  };

  const filteredTodos = todos.filter(todo => {
    if (userId && todo.user_id !== userId) return false;
    if (statusFilter !== 'all' && todo.status !== statusFilter) return false;
    return true;
  }).slice(0, limit);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="h-4 w-4 text-white" />;
      case 'in_progress':
        return <Activity className="h-4 w-4 text-white" />;
      case 'todo':
      default:
        return <ListTodo className="h-4 w-4 text-white" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'text-white font-mono font-semibold border-0';
      case 'in_progress':
        return 'text-white font-mono font-semibold border-0';
      case 'todo':
      default:
        return 'text-white font-mono font-semibold border-0';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'done':
        return '#3FCF8E';
      case 'in_progress':
        return '#FF82C2';
      case 'todo':
      default:
        return '#4D51CC';
    }
  };

  const formatDueDate = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffDays = differenceInDays(due, today);
    
    const formattedDate = format(due, 'yyyy.MM.dd');
    
    if (diffDays === 0) {
      return `~${formattedDate} (Today)`;
    } else if (diffDays > 0) {
      return `~${formattedDate} (D-${diffDays})`;
    } else {
      return `~${formattedDate} (D+${Math.abs(diffDays)})`;
    }
  };

  const getAssigneeName = (todo: any) => {
    // Team shared 할일에서 담당자 정보를 가져오는 로직
    // 실제 구현에서는 todo에 assignee 정보가 포함되어야 합니다
    if (todo.team_id && filter === 'shared') {
      return todo.assignee_name || 'Unassigned';
    }
    return null;
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Type Filter - Left side */}
        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="transition-colors"
          >
            All Tasks
          </Button>
          <Button
            variant={filter === 'personal' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('personal')}
            className="transition-colors"
          >
            Personal
          </Button>
          <Button
            variant={filter === 'shared' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('shared')}
            className="transition-colors"
          >
            Team Shared
          </Button>
        </div>

        {/* Status Filter - Right side */}
        <div className="flex items-center gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className="transition-colors"
          >
            All Status
          </Button>
          <Button
            variant={statusFilter === 'todo' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('todo')}
            className="transition-colors"
          >
            To Do
          </Button>
          <Button
            variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('in_progress')}
            className="transition-colors"
          >
            Doing
          </Button>
          <Button
            variant={statusFilter === 'done' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('done')}
            className="transition-colors"
          >
            Done
          </Button>
        </div>
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
              <Button variant="link" className="mt-2" onClick={() => {
                setFilter('all');
                setStatusFilter('all');
              }}>
                Clear filters
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTodos.map((todo) => {
            const isExpanded = expandedTodos.has(todo.id);
            const assigneeName = getAssigneeName(todo);
            
            return (
              <Card key={todo.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {/* Main Content */}
                  <div className="space-y-3">
                    {/* Title Row */}
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={todo.status === 'done'}
                        onCheckedChange={(checked) => 
                          handleStatusChange(todo.id, checked ? 'done' : 'todo')
                        }
                      />
                      <h3 className={`font-medium text-lg flex-1 ${
                        todo.status === 'done' ? 'line-through text-muted-foreground' : ''
                      }`}>
                        {todo.title}
                      </h3>
                      {todo.description && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTodoExpansion(todo.id)}
                          className="p-1 h-6 w-6"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Description - Collapsible */}
                    {todo.description && (
                      <Collapsible open={isExpanded}>
                        <CollapsibleContent>
                          <div className="ml-7 p-3 bg-gray-50 rounded-md border">
                            <p className="text-sm text-muted-foreground">
                              {todo.description}
                            </p>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* Bottom Row - Assignee and Due Date/Status */}
                    <div className="flex items-center justify-between ml-7">
                      {/* Left - Assignee */}
                      <div className="flex items-center gap-2">
                        {assigneeName ? (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{assigneeName}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Personal</span>
                        )}
                      </div>

                      {/* Right - Due Date and Status */}
                      <div className="flex items-center gap-3">
                        {/* Due Date */}
                        {todo.due_date && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Calendar className="h-3 w-3" />
                            {formatDueDate(todo.due_date)}
                          </Badge>
                        )}

                        {/* Status Badge with Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0 h-auto hover:bg-transparent"
                            >
                              <Badge 
                                variant="outline" 
                                className={`cursor-pointer hover:bg-opacity-80 transition-colors ${getStatusColor(todo.status)}`}
                                style={{ backgroundColor: getStatusBgColor(todo.status) }}
                              >
                                {getStatusIcon(todo.status)}
                                <span className="ml-1 capitalize font-mono font-semibold">
                                  {todo.status === 'todo' ? 'ToDo' : 
                                   todo.status === 'in_progress' ? 'Doing' : 
                                   'Complete'}
                                </span>
                              </Badge>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(todo.id, 'todo')}
                              className="flex items-center gap-2"
                            >
                              <ListTodo className="h-4 w-4" style={{ color: '#4D51CC' }} />
                              <span className="font-mono font-semibold">ToDo</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(todo.id, 'in_progress')}
                              className="flex items-center gap-2"
                            >
                              <Activity className="h-4 w-4" style={{ color: '#FF82C2' }} />
                              <span className="font-mono font-semibold">Doing</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(todo.id, 'done')}
                              className="flex items-center gap-2"
                            >
                              <CheckCircle2 className="h-4 w-4" style={{ color: '#3FCF8E' }} />
                              <span className="font-mono font-semibold">Complete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
