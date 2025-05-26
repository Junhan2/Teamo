"use client"

import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, User, Plus, Calendar, BarChart3, Settings } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { SpaceSelector } from "@/components/spaces/SpaceSelector"
import NotificationBell from "@/components/notifications/NotificationBell"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

interface NavbarProps {
  user: UserProfile | null
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/auth/login')
    }
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-gray-cool-25/90 border-b border-gray-cool-200">
      <div className="container-responsive">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Teamo Logo"
              className="h-8 w-auto navbar-logo"
            />
          </Link>

          <div className="flex items-center gap-4">
            {/* Space Selector */}
            {user && <SpaceSelector />}
            
            {/* Notification Bell */}
            {user && <NotificationBell />}
            
            {/* 플로팅 버튼으로 이동됨 */}

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 w-10 rounded-full p-0 hover:bg-gray-cool-100 transition-all duration-200">
                    <Avatar className="h-10 w-10 ring-2 ring-gray-cool-200 ring-offset-2 ring-offset-gray-cool-25 navbar-avatar">
                      {user.avatar_url ? (
                        <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-gray-cool-700 to-gray-cool-800 text-white">
                          <User size={16} />
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 bg-gray-cool-25 border-gray-cool-200 shadow-2xl rounded-2xl p-2">
                  <DropdownMenuLabel className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        {user.avatar_url ? (
                          <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-gray-cool-700 to-gray-cool-800 text-white text-sm">
                            {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-cool-700 truncate">{user.full_name || 'User'}</p>
                        <p className="text-xs text-gray-cool-400 truncate">{user.email}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-cool-100 my-1" />
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer hover:bg-gray-cool-100 focus:bg-gray-cool-100 text-gray-cool-500 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2">
                      <User className="w-4 h-4" />
                      My Profile
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/overview">
                    <DropdownMenuItem className="cursor-pointer hover:bg-gray-cool-100 focus:bg-gray-cool-100 text-gray-cool-500 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      My Overview
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/settings">
                    <DropdownMenuItem className="cursor-pointer hover:bg-gray-cool-100 focus:bg-gray-cool-100 text-gray-cool-500 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator className="bg-gray-cool-100 my-1" />
                  <DropdownMenuItem 
                    onClick={handleSignOut} 
                    className="text-gray-cool-500 cursor-pointer hover:bg-gray-cool-100 hover:text-gray-cool-700 focus:bg-gray-cool-100 focus:text-gray-cool-700 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}