'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useSpace } from '@/contexts/SpaceContext';
import { SpaceTodoList } from '@/components/todos/SpaceTodoList';
import { SpaceInfo } from '@/components/spaces/SpaceInfo';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import ContributionGraph from '@/components/ContributionGraph/ContributionGraph';
import PageLoading from '@/components/PageLoading';
import { 
  CheckSquare, 
  Calendar, 
  Users, 
  User,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export default function SpaceDashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-todos');
  const router = useRouter();
  const supabase = createClient();
  const { currentSpace, isLoading: spaceLoading } = useSpace();

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUser(profile);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [supabase, router]);

  if (loading || spaceLoading) {
    return <PageLoading />;
  }

  if (!user || !currentSpace) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar user={user} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, {user.full_name || user.email}
              </p>
            </div>
            <SpaceInfo className="scale-110" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Tasks
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +2 from yesterday
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completed This Week
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                +20% from last week
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Team Members
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">
                In {currentSpace.name}
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

        {/* Todo Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="my-todos" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              My Tasks
            </TabsTrigger>
            <TabsTrigger value="team-todos" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Tasks
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-todos">
            <SpaceTodoList userId={user.id} />
          </TabsContent>
          
          <TabsContent value="team-todos">
            <SpaceTodoList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
