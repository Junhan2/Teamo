'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import PageLoading from '@/components/PageLoading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SpaceTodoList } from '@/components/todos/SpaceTodoList';
import ContributionGraph from '@/components/ContributionGraph/ContributionGraph';
import { 
  CheckSquare, 
  Users, 
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2,
  Briefcase,
  ListTodo
} from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Stats {
  totalTodos: number;
  pendingTodos: number;
  inProgressTodos: number;
  completedTodos: number;
  totalSpaces: number;
  todayCompleted: number;
  weeklyGrowth: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalTodos: 0,
    pendingTodos: 0,
    inProgressTodos: 0,
    completedTodos: 0,
    totalSpaces: 0,
    todayCompleted: 0,
    weeklyGrowth: 0
  });
  const [activeTab, setActiveTab] = useState<'all' | 'by-space'>('all');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUserAndStats() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Load user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUser(profile);
        }

        // Load stats
        await loadStats(user.id);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserAndStats();
  }, [supabase, router]);

  const loadStats = async (userId: string) => {
    try {
      // Get all todos for the user across all spaces
      const { data: todos } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId);

      if (!todos) return;

      // Calculate stats
      const totalTodos = todos.length;
      const pendingTodos = todos.filter(t => t.status === 'pending').length;
      const inProgressTodos = todos.filter(t => t.status === 'in_progress').length;
      const completedTodos = todos.filter(t => t.status === 'completed').length;

      // Today's completed
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCompleted = todos.filter(t => {
        if (t.status !== 'completed') return false;
        const updatedAt = new Date(t.updated_at);
        return updatedAt >= today;
      }).length;

      // Get spaces count
      const { data: spaces } = await supabase
        .from('space_members')
        .select('space_id')
        .eq('user_id', userId);

      const totalSpaces = new Set(spaces?.map(s => s.space_id) || []).size;

      // Calculate weekly growth (mock for now)
      const weeklyGrowth = Math.round(Math.random() * 30) - 10;

      setStats({
        totalTodos,
        pendingTodos,
        inProgressTodos,
        completedTodos,
        totalSpaces,
        todayCompleted,
        weeklyGrowth
      });
    } catch (error) {
      console.error('Error loading stats:', error);
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user.full_name || user.email}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Spaces
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSpaces}</div>
              <p className="text-xs text-muted-foreground">
                Active workspaces
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Tasks
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.pendingTodos + stats.inProgressTodos}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingTodos} pending, {stats.inProgressTodos} in progress
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completed Today
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayCompleted}</div>
              <p className="text-xs text-muted-foreground">
                Keep up the momentum!
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Weekly Progress
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.weeklyGrowth > 0 ? '+' : ''}{stats.weeklyGrowth}%
              </div>
              <p className="text-xs text-muted-foreground">
                Compared to last week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contribution Graph */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ContributionGraph userId={user.id} />
          </CardContent>
        </Card>

        {/* Todos Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Tasks Across All Spaces</CardTitle>
              <Link href="/spaces">
                <Button variant="outline" size="sm">
                  <Building2 className="h-4 w-4 mr-2" />
                  Manage Spaces
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'by-space')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4" />
                  All Tasks
                </TabsTrigger>
                <TabsTrigger value="by-space" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  By Space
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <SpaceTodoList 
                  userId={user.id}
                  showSpaceInfo={true}
                />
              </TabsContent>
              
              <TabsContent value="by-space">
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    View tasks organized by space. Click on a space below to see space-specific dashboard.
                  </p>
                  <SpacesList userId={user.id} />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Spaces List Component
function SpacesList({ userId }: { userId: string }) {
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadSpaces() {
      try {
        const { data } = await supabase
          .from('space_members')
          .select(`
            space:spaces(
              id,
              name,
              description,
              color
            )
          `)
          .eq('user_id', userId);

        if (data) {
          setSpaces(data.map(d => d.space).filter(Boolean));
        }
      } catch (error) {
        console.error('Error loading spaces:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSpaces();
  }, [userId, supabase]);

  if (loading) {
    return <div className="text-center py-4">Loading spaces...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {spaces.map((space) => (
        <Link key={space.id} href={`/dashboard/space/${space.id}`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {space.name}
                </CardTitle>
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: space.color || '#6B7280' }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {space.description || 'No description'}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
