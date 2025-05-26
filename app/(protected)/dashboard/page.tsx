'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import PageLoading from '@/components/PageLoading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SpaceTodoList } from '@/components/todos/SpaceTodoList';
import { 
  CheckSquare, 
  Users, 
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2,
  BarChart3,
  Plus
} from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface QuickStats {
  activeTasks: number;
  completedToday: number;
  totalSpaces: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickStats, setQuickStats] = useState<QuickStats>({
    activeTasks: 0,
    completedToday: 0,
    totalSpaces: 0
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUserAndQuickStats() {
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

        // Load quick stats
        await loadQuickStats(user.id);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserAndQuickStats();
  }, [supabase, router]);

  const loadQuickStats = async (userId: string) => {
    try {
      // Get active todos count
      const { data: todos } = await supabase
        .from('todos')
        .select('status, updated_at')
        .eq('user_id', userId)
        .in('status', ['pending', 'in_progress']);

      const activeTasks = todos?.length || 0;

      // Get today's completed count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: completedTodos } = await supabase
        .from('todos')
        .select('updated_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('updated_at', today.toISOString());

      const completedToday = completedTodos?.length || 0;

      // Get spaces count
      const { data: spaces } = await supabase
        .from('user_spaces')
        .select('space_id')
        .eq('user_id', userId);

      const totalSpaces = new Set(spaces?.map(s => s.space_id) || []).size;

      setQuickStats({
        activeTasks,
        completedToday,
        totalSpaces
      });
    } catch (error) {
      console.error('Error loading quick stats:', error);
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
      
      <main className="container-responsive py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user.full_name || user.email}
          </p>
        </div>

        {/* Quick Actions & Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quickStats.activeTasks}</div>
              <p className="text-xs text-muted-foreground">Pending & In Progress</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quickStats.completedToday}</div>
              <p className="text-xs text-muted-foreground">Tasks completed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spaces</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quickStats.totalSpaces}</div>
              <p className="text-xs text-muted-foreground">Workspaces</p>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/overview" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Overview
                </Button>
              </Link>
              <Link href="/spaces" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Building2 className="h-4 w-4 mr-2" />
                  Manage Spaces
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Tasks */}
        <Card>
          <CardContent className="pt-6">
            <SpaceTodoList 
              userId={user.id}
              showSpaceInfo={true}
              limit={10}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
