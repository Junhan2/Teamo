"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useSpace } from '@/contexts/SpaceContext'
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TeamTodoList from "@/components/TeamTodoList"
import AddTodoForm from "@/components/AddTodoForm"
import Navbar from "@/components/Navbar"
import ContributionGraph from "@/components/ContributionGraph/ContributionGraph"
import { motion } from "framer-motion"
import { CheckSquare, Calendar, Plus, BarChart3, ClipboardList, StickyNote, User, Users, LayoutGrid, Building2 } from "lucide-react"
import PageLoading from "@/components/PageLoading"
import { SpaceInfo } from '@/components/spaces/SpaceInfo'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState("my-todos")
  const router = useRouter()
  const supabase = createClient()
  const { currentSpace, isLoading: spaceLoading } = useSpace()
  
  const [todoStats, setTodoStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    today: 0,
  })

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUser({
            id: user.id,
            email: user.email || '',
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
          })
        } else {
          setUser({
            id: user.id,
            email: user.email || '',
            full_name: null,
            avatar_url: null,
          })
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router, supabase])

  useEffect(() => {
    if (!user || !currentSpace) return

    async function loadTodoStats() {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: todos } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .eq('space_id', currentSpace.id)

      if (todos) {
        setTodoStats({
          total: todos.length,
          completed: todos.filter(t => t.status === 'completed').length,
          pending: todos.filter(t => t.status === 'pending').length,
          today: todos.filter(t => {
            const createdAt = new Date(t.created_at)
            return createdAt >= today
          }).length,
        })
      }
    }

    loadTodoStats()
  }, [user, currentSpace, refreshTrigger, supabase])

  const refreshTodos = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  if (loading || spaceLoading) return <PageLoading />
  if (!user || !currentSpace) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Space Info Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-8 w-8 text-gray-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {currentSpace.name}
            </h1>
          </div>
          {currentSpace.description && (
            <p className="text-gray-600 dark:text-gray-400 ml-11">
              {currentSpace.description}
            </p>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todoStats.total}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{todoStats.completed}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{todoStats.pending}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Added Today</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{todoStats.today}</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Contribution Graph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Your Activity in {currentSpace.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <ContributionGraph userId={user.id} spaceId={currentSpace.id} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Tasks</CardTitle>
                <div className="flex gap-2">
                  <Link href="/calendar">
                    <Button variant="outline" size="sm">
                      <Calendar className="mr-2 h-4 w-4" />
                      Calendar View
                    </Button>
                  </Link>
                  <Link href="/dashboard/unified">
                    <Button variant="outline" size="sm">
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      All Spaces
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="my-todos">
                    <User className="mr-2 h-4 w-4" />
                    My Tasks
                  </TabsTrigger>
                  <TabsTrigger value="team-todos">
                    <Users className="mr-2 h-4 w-4" />
                    Team Tasks
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="my-todos" className="space-y-4">
                  <AddTodoForm 
                    userId={user.id} 
                    spaceId={currentSpace.id}
                    onTodoAdded={refreshTodos} 
                  />
                  <TeamTodoList 
                    userId={user.id} 
                    spaceId={currentSpace.id}
                    teamView={false} 
                    refreshTrigger={refreshTrigger}
                  />
                </TabsContent>

                <TabsContent value="team-todos" className="space-y-4">
                  <TeamTodoList 
                    userId={user.id} 
                    spaceId={currentSpace.id}
                    teamView={true} 
                    refreshTrigger={refreshTrigger}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Link href="/memos">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <StickyNote className="mr-2 h-5 w-5" />
                  Quick Memos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Capture quick thoughts and ideas
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/spaces">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="mr-2 h-5 w-5" />
                  Manage Spaces
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Switch between different workspaces
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/notifications">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View your productivity insights
                </p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </main>
    </div>
  )
}
