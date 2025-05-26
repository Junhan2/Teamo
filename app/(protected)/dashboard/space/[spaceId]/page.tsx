'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import PageLoading from '@/components/PageLoading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AddTodoForm from '@/components/AddTodoForm';
import TeamTodoList from '@/components/TeamTodoList';
import { 
  Users, 
  User,
  ArrowLeft,
  Settings,
  UserPlus,
  Share2,
  Lock
} from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Space {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_by: string;
}

interface SpaceMember {
  user_id: string;
  role: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export default function SpaceDashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [space, setSpace] = useState<Space | null>(null);
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'team'>('my');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const spaceId = params.spaceId as string;

  useEffect(() => {
    async function loadData() {
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

        // Load space details
        const { data: spaceData } = await supabase
          .from('spaces')
          .select('*')
          .eq('id', spaceId)
          .single();

        if (!spaceData) {
          router.push('/dashboard');
          return;
        }

        setSpace(spaceData);

        // Check if user is member of this space
        const { data: membership } = await supabase
          .from('user_spaces')
          .select('*')
          .eq('space_id', spaceId)
          .eq('user_id', user.id)
          .single();

        if (!membership) {
          router.push('/dashboard');
          return;
        }

        // Load space members
        const { data: membersData } = await supabase
          .from('user_spaces')
          .select(`
            user_id,
            role,
            user:profiles(
              id,
              email,
              full_name,
              avatar_url
            )
          `)
          .eq('space_id', spaceId);

        if (membersData) {
          setMembers(membersData as any);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase, router, spaceId]);

  const refreshTodos = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return <PageLoading />;
  }

  if (!user || !space) {
    return null;
  }

  const isOwner = space.created_by === user.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar user={user} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Overview
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-lg"
                style={{ backgroundColor: space.color || '#6B7280' }}
              />
              <div>
                <h1 className="text-3xl font-bold">{space.name}</h1>
                <p className="text-muted-foreground mt-1">
                  {space.description || 'No description'}
                </p>
              </div>
            </div>
            
            {isOwner && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Members
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Members */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {members.map((member) => (
                <Badge 
                  key={member.user_id} 
                  variant="secondary"
                  className="px-3 py-1.5"
                >
                  <User className="h-3 w-3 mr-1.5" />
                  {member.user.full_name || member.user.email.split('@')[0]}
                  {member.role === 'owner' && (
                    <span className="ml-1.5 text-xs">(Owner)</span>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Todos */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'my' | 'team')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="my" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  My Tasks
                </TabsTrigger>
                <TabsTrigger value="team" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Tasks
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="my" className="space-y-4">
                <AddTodoForm 
                  userId={user.id}
                  spaceId={spaceId}
                  onTodoAdded={refreshTodos}
                />
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span>Your personal tasks in this space</span>
                  </div>
                  <TeamTodoList
                    userId={user.id}
                    spaceId={spaceId}
                    filter="my"
                    refreshTrigger={refreshTrigger}
                    onDelete={refreshTodos}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="team" className="space-y-4">
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                    <Share2 className="h-4 w-4" />
                    <span>Shared tasks from team members</span>
                  </div>
                  <TeamTodoList
                    userId={user.id}
                    spaceId={spaceId}
                    filter="team"
                    refreshTrigger={refreshTrigger}
                    onDelete={refreshTodos}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
