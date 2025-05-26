'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import PageLoading from '@/components/PageLoading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Users,
  Plus,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AddTodoForm from '@/components/AddTodoForm';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  user_id: string;
  space_id: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

export default function SpaceTasksPage() {
  const params = useParams();
  const spaceId = params.spaceId as string;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [myTodos, setMyTodos] = useState<Todo[]>([]);
  const [teamTodos, setTeamTodos] = useState<Todo[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'team'>('my');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [spaceName, setSpaceName] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUser(profile);
        }

        await loadTasks(user.id, spaceId);
        await loadSpaceName(spaceId);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [spaceId, supabase]);

  const loadSpaceName = async (spaceId: string) => {
    try {
      const { data } = await supabase
        .from('spaces')
        .select('name')
        .eq('id', spaceId)
        .single();
      
      if (data) {
        setSpaceName(data.name);
      }
    } catch (error) {
      console.error('Error loading space name:', error);
    }
  };

  const loadTasks = async (userId: string, spaceId: string) => {
    try {
      const { data: myTasks } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .eq('space_id', spaceId)
        .order('created_at', { ascending: false });

      const { data: allTasks } = await supabase
        .from('todos')
        .select(`
          *,
          profiles!inner(full_name, email)
        `)
        .eq('space_id', spaceId)
        .order('created_at', { ascending: false });

      setMyTodos(myTasks || []);
      setTeamTodos(allTasks || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleTodoAdded = async () => {
    if (user) {
      await loadTasks(user.id, spaceId);
      setIsAddDialogOpen(false);
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{spaceName} Tasks</h1>
          <p className="text-muted-foreground mt-1">
            Manage your tasks and collaborate with your team
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tasks</CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                  </DialogHeader>
                  <AddTodoForm
                    userId={user.id}
                    spaceId={spaceId}
                    onTodoAdded={handleTodoAdded}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'my' | 'team')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="my" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  My Tasks ({myTodos.length})
                </TabsTrigger>
                <TabsTrigger value="team" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Tasks ({teamTodos.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="my">
                <TaskList tasks={myTodos} userId={user.id} onTaskUpdate={handleTodoAdded} />
              </TabsContent>
              
              <TabsContent value="team">
                <TaskList tasks={teamTodos} userId={user.id} onTaskUpdate={handleTodoAdded} isTeamView={true} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function TaskList({ 
  tasks, 
  userId, 
  onTaskUpdate, 
  isTeamView = false 
}: { 
  tasks: Todo[]; 
  userId: string; 
  onTaskUpdate: () => void; 
  isTeamView?: boolean; 
}) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-2">
          {isTeamView ? <Users className="h-12 w-12 mx-auto" /> : <User className="h-12 w-12 mx-auto" />}
        </div>
        <p className="text-gray-500">
          {isTeamView ? 'No team tasks yet' : 'No tasks yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard 
          key={task.id} 
          task={task} 
          userId={userId} 
          onTaskUpdate={onTaskUpdate}
          isTeamView={isTeamView}
        />
      ))}
    </div>
  );
}

function TaskCard({ 
  task, 
  userId, 
  onTaskUpdate, 
  isTeamView 
}: { 
  task: Todo; 
  userId: string; 
  onTaskUpdate: () => void; 
  isTeamView?: boolean; 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const supabase = createClient();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Not Yet';
      case 'in_progress': return 'Doing';
      case 'completed': return 'Complete';
      default: return status;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ status: newStatus })
        .eq('id', task.id);

      if (error) throw error;
      onTaskUpdate();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', task.id);

      if (error) throw error;
      onTaskUpdate();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-all duration-200">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-4">
            <div className="flex items-center gap-3">
              <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
              
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={task.user_id !== userId}
                className={`text-xs font-medium px-2 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(task.status)} ${
                  task.user_id !== userId ? 'cursor-not-allowed opacity-75' : ''
                }`}
              >
                <option value="pending">Not Yet</option>
                <option value="in_progress">Doing</option>
                <option value="completed">Complete</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              {task.description && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  Details
                </button>
              )}
              
              {isTeamView && (
                <span className="text-xs text-gray-500">
                  by {task.profiles?.full_name || task.profiles?.email || 'Unknown'}
                </span>
              )}
              
              <span className="text-xs text-gray-400">
                {new Date(task.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {task.user_id === userId && (
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {task.description && isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">
            {task.description}
          </p>
        </div>
      )}
    </div>
  );
}
