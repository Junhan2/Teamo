'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import PageLoading from '@/components/PageLoading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface SpaceStats {
  myTodos: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  teamTodos: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  teamMembers: number;
  spaceName: string;
}

export default function SpaceOverviewPage() {
  const params = useParams();
  const spaceId = params.spaceId as string;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SpaceStats>({
    myTodos: { total: 0, pending: 0, inProgress: 0, completed: 0 },
    teamTodos: { total: 0, pending: 0, inProgress: 0, completed: 0 },
    teamMembers: 0,
    spaceName: ''
  });
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Load user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUser(profile);
        }

        await loadSpaceStats(user.id, spaceId);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [spaceId, supabase]);

  const loadSpaceStats = async (userId: string, spaceId: string) => {
    try {
      // Get space info
      const { data: space } = await supabase
        .from('spaces')
        .select('name')
        .eq('id', spaceId)
        .single();

      // Get my todos in this space
      const { data: myTodos } = await supabase
        .from('todos')
        .select('status')
        .eq('user_id', userId)
        .eq('space_id', spaceId);

      // Get all todos in this space
      const { data: allTodos } = await supabase
        .from('todos')
        .select('status')
        .eq('space_id', spaceId);

      // Get team members count
      const { data: members } = await supabase
        .from('user_spaces')
        .select('user_id')
        .eq('space_id', spaceId);

      const myStats = {
        total: myTodos?.length || 0,
        pending: myTodos?.filter(t => t.status === 'pending').length || 0,
        inProgress: myTodos?.filter(t => t.status === 'in_progress').length || 0,
        completed: myTodos?.filter(t => t.status === 'completed').length || 0
      };

      const teamStats = {
        total: allTodos?.length || 0,
        pending: allTodos?.filter(t => t.status === 'pending').length || 0,
        inProgress: allTodos?.filter(t => t.status === 'in_progress').length || 0,
        completed: allTodos?.filter(t => t.status === 'completed').length || 0
      };

      setStats({
        myTodos: myStats,
        teamTodos: teamStats,
        teamMembers: new Set(members?.map(m => m.user_id)).size || 0,
        spaceName: space?.name || 'Unknown Space'
      });
    } catch (error) {
      console.error('Error loading space stats:', error);
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
          <h1 className="text-3xl font-bold">{stats.spaceName} Overview</h1>
          <p className="text-muted-foreground mt-1">
            Your progress and team statistics in this space
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* My Progress */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                My Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Tasks</span>
                <span className="font-semibold">{stats.myTodos.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Not Yet
                </span>
                <span className="font-semibold text-orange-600">{stats.myTodos.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Doing
                </span>
                <span className="font-semibold text-blue-600">{stats.myTodos.inProgress}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Complete
                </span>
                <span className="font-semibold text-green-600">{stats.myTodos.completed}</span>
              </div>
              {/* Progress Bar */}
              <div className="pt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{stats.myTodos.total > 0 ? Math.round((stats.myTodos.completed / stats.myTodos.total) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${stats.myTodos.total > 0 ? (stats.myTodos.completed / stats.myTodos.total) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Progress */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Tasks</span>
                <span className="font-semibold">{stats.teamTodos.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Not Yet</span>
                <span className="font-semibold text-orange-600">{stats.teamTodos.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Doing</span>
                <span className="font-semibold text-blue-600">{stats.teamTodos.inProgress}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Complete</span>
                <span className="font-semibold text-green-600">{stats.teamTodos.completed}</span>
              </div>
              {/* Team Progress Bar */}
              <div className="pt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Team Progress</span>
                  <span>{stats.teamTodos.total > 0 ? Math.round((stats.teamTodos.completed / stats.teamTodos.total) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${stats.teamTodos.total > 0 ? (stats.teamTodos.completed / stats.teamTodos.total) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Info */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Team Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Team Members</span>
                <span className="font-semibold">{stats.teamMembers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completion Rate</span>
                <span className="font-semibold text-green-600">
                  {stats.teamTodos.total > 0 
                    ? Math.round((stats.teamTodos.completed / stats.teamTodos.total) * 100)
                    : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
        
        {/* Recent Activity Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* My Recent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>My Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTasks userId={user.id} spaceId={spaceId} />
            </CardContent>
          </Card>

          {/* Team Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Team Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <TeamActivity spaceId={spaceId} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

// Recent Tasks Component
function RecentTasks({ userId, spaceId }: { userId: string; spaceId: string }) {
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadRecentTasks() {
      try {
        const { data } = await supabase
          .from('todos')
          .select('id, title, status, updated_at')
          .eq('user_id', userId)
          .eq('space_id', spaceId)
          .order('updated_at', { ascending: false })
          .limit(5);

        setRecentTasks(data || []);
      } catch (error) {
        console.error('Error loading recent tasks:', error);
      } finally {
        setLoading(false);
      }
    }

    loadRecentTasks();
  }, [userId, spaceId, supabase]);

  if (loading) {
    return <div className="text-center py-4 text-sm text-gray-500">Loading...</div>;
  }

  if (recentTasks.length === 0) {
    return <div className="text-center py-4 text-sm text-gray-500">No recent tasks</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
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

  return (
    <div className="space-y-3">
      {recentTasks.map((task) => (
        <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
            <p className="text-xs text-gray-500">
              {new Date(task.updated_at).toLocaleDateString()}
            </p>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
            {getStatusLabel(task.status)}
          </span>
        </div>
      ))}
    </div>
  );
}

// Team Activity Component
function TeamActivity({ spaceId }: { spaceId: string }) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadTeamActivity() {
      try {
        const { data } = await supabase
          .from('todos')
          .select(`
            id, 
            title, 
            status, 
            updated_at,
            profiles!inner(full_name, email)
          `)
          .eq('space_id', spaceId)
          .order('updated_at', { ascending: false })
          .limit(5);

        setActivities(data || []);
      } catch (error) {
        console.error('Error loading team activity:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTeamActivity();
  }, [spaceId, supabase]);

  if (loading) {
    return <div className="text-center py-4 text-sm text-gray-500">Loading...</div>;
  }

  if (activities.length === 0) {
    return <div className="text-center py-4 text-sm text-gray-500">No recent activity</div>;
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
            {activity.profiles?.full_name?.[0] || activity.profiles?.email?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              <span className="font-medium">{activity.profiles?.full_name || 'User'}</span>
              {' '}updated{' '}
              <span className="font-medium">"{activity.title}"</span>
            </p>
            <p className="text-xs text-gray-500">
              {new Date(activity.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
