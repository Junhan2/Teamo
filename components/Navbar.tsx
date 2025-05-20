"use client"

import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, User, Plus, Calendar, CheckSquare } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

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
    <header className="sticky top-0 z-10 supertape-nav backdrop-blur-lg py-2 bg-[#292C33]">
      <div className="container mx-auto max-w-5xl">
        <div className="flex justify-between items-center px-4 py-2">
          <Link href="/dashboard" className="text-2xl tracking-tight flex items-center gap-2">
            <span className="font-serif text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-bold var(--font-playfair)">Mung.</span>
          </Link>

          <div className="flex items-center gap-4">
            {/* 플로팅 버튼으로 이동됨 */}

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 w-9 rounded-full p-0 hover:bg-[#2a2a3c]/50">
                    <Avatar className="h-9 w-9 ring-2 ring-indigo-500/30">
                      {user.avatar_url ? (
                        <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                          <User size={14} />
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card border-[#2a2a3c] text-white min-w-[180px]">
                  <DropdownMenuLabel className="text-gray-300 text-xs">
                    <p className="text-sm font-medium text-white">{user.full_name || 'User'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#2a2a3c]" />
                  <DropdownMenuItem className="cursor-pointer hover:bg-[#2a2a3c]/50 hover:text-white focus:bg-[#2a2a3c]/50 focus:text-white">
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:bg-[#2a2a3c]/50 hover:text-white focus:bg-[#2a2a3c]/50 focus:text-white">
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#2a2a3c]" />
                  <DropdownMenuItem 
                    onClick={handleSignOut} 
                    className="text-red-400 cursor-pointer hover:bg-red-400/10 hover:text-red-300 focus:bg-red-400/10 focus:text-red-300"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    Logout
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