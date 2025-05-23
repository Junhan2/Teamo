"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckSquare, Calendar, StickyNote } from "lucide-react"
import Navbar from "@/components/Navbar"
import CalendarPage from "@/components/Calendar/CalendarPage"
import PageLoading from "@/components/PageLoading"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

export default function CalendarPageRoute() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
          router.push('/auth/login')
          return
        }

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          
          // Create profile if it doesn't exist
          if (profileError.code === 'PGRST116') {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([{ 
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name,
                avatar_url: session.user.user_metadata?.avatar_url
              }])
              .select()
              .single()
              
            if (!createError && newProfile) {
              setUser(newProfile)
            } else {
              console.error('Error creating profile:', createError)
            }
          }
          return
        }

        setUser(profile)
      } catch (error) {
        console.error('Error checking auth session:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [router, supabase])

  if (loading) {
    return <PageLoading message="Loading Calendar..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-cool-25 via-gray-cool-50 to-gray-cool-100/50">
      <Navbar user={user} />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <CalendarPage user={user} />
      </main>
      
      {/* 화면 중앙 하단 플로팅 버튼 영역 */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white/90 backdrop-blur-md rounded-full shadow-2xl border border-gray-cool-100 p-2 flex items-center gap-2">
        <Link href="/dashboard">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-white/80 border border-gray-cool-200 text-gray-cool-700 hover:bg-gray-cool-50 hover:border-gray-cool-300 shadow-sm flex items-center gap-2 px-5 py-2.5 h-11 font-normal text-sm"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Tasks</span>
          </Button>
        </Link>
        
        <Link href="/calendar">
          <Button
            variant="default"
            size="sm"
            className="rounded-full bg-gray-cool-700 text-white hover:bg-gray-cool-800 shadow-lg flex items-center gap-2 px-5 py-2.5 h-11 relative border-0 font-bold text-sm"
          >
            <Calendar className="w-4 h-4" />
            <span>Calendar</span>
            {/* Active indicator */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse"></div>
          </Button>
        </Link>
        
        <Link href="/memos">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-white/80 border border-gray-cool-200 text-gray-cool-700 hover:bg-gray-cool-50 hover:border-gray-cool-300 shadow-sm flex items-center gap-2 px-5 py-2.5 h-11 font-normal text-sm"
          >
            <StickyNote className="w-4 h-4" />
            <span>Memos</span>
          </Button>
        </Link>
        </div>
      </div>
    </div>
  )
}