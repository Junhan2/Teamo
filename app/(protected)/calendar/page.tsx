"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckSquare, Calendar } from "lucide-react"
import Navbar from "@/components/Navbar"
import CalendarPage from "@/components/Calendar/CalendarPage"

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
    return (
      <div className="flex min-h-screen items-center justify-center bg-light-background">
        <div className="text-lg text-light-primary relative z-10 font-medium">Loading Calendar...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light-background">
      <Navbar user={user} />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <CalendarPage user={user} />
      </main>
      
      {/* 화면 중앙 하단 플로팅 버튼 영역 */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2">
        <Link href="/dashboard">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full shadow-lg bg-light-background text-light-primary hover:bg-gray-100 flex items-center gap-2 px-4 py-2 h-10 outline outline-1 outline-light-border outline-offset-[-1px]"
          >
            <CheckSquare className="w-4 h-4" />
            <span className="font-medium">My Tasks</span>
          </Button>
        </Link>
        
        <Link href="/calendar">
          <Button
            variant="default"
            size="sm"
            className="rounded-full shadow-lg bg-[#525252] text-white hover:bg-[#404040] flex items-center gap-2 px-4 py-2 h-10 relative outline outline-1 outline-light-border outline-offset-[-1px]"
          >
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Calendar</span>
            {/* Active indicator */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#3fcf8e] rounded-full border-2 border-light-background"></div>
          </Button>
        </Link>
      </div>
    </div>
  )
}