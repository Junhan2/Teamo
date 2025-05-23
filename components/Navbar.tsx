"use client"

import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, User, Plus, Calendar, CheckSquare, Database } from "lucide-react"
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
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#FCFCFD]/90 border-b border-[#DCDFEA]">
      <div className="container mx-auto max-w-5xl">
        <div className="flex justify-between items-center px-4 h-16">
          <Link href="/dashboard" className="text-2xl tracking-tight flex items-center gap-2 relative">
            <div className="relative flex items-center">
              {/* Hero image behind text */}
              <div className="relative w-[60px] h-[40px] mr-[-20px]">
                <img
                  src="/images/hero-3d-svg.svg"
                  alt="tide"
                  className="w-full h-full object-contain opacity-30 relative z-0"
                  style={{ 
                    filter: "drop-shadow(0 2px 8px rgba(63, 207, 142, 0.15))"
                  }}
                />
              </div>
              
              {/* tide text overlapping with the image */}
              <span 
                className="text-[#404968] font-black font-dm-sans relative z-10 text-xl"
                style={{
                  textShadow: "0 1px 3px rgba(0, 0, 0, 0.05)"
                }}
              >
                tide.
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {/* 플로팅 버튼으로 이동됨 */}

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 w-10 rounded-full p-0 hover:bg-[#EFF1F5] transition-all duration-200">
                    <Avatar className="h-10 w-10 ring-2 ring-[#DCDFEA] ring-offset-2 ring-offset-[#FCFCFD]">
                      {user.avatar_url ? (
                        <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-[#404968] to-[#30374E] text-white">
                          <User size={16} />
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 bg-[#FCFCFD] border-[#DCDFEA] shadow-2xl rounded-2xl p-2">
                  <DropdownMenuLabel className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        {user.avatar_url ? (
                          <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-[#404968] to-[#30374E] text-white text-sm">
                            {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#404968] truncate">{user.full_name || 'User'}</p>
                        <p className="text-xs text-[#7D89AF] truncate">{user.email}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#EFF1F5] my-1" />
                  <DropdownMenuItem className="cursor-pointer hover:bg-[#EFF1F5] focus:bg-[#EFF1F5] text-[#5D6A97] rounded-lg px-4 py-2.5 text-sm font-medium transition-colors">
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:bg-[#EFF1F5] focus:bg-[#EFF1F5] text-[#5D6A97] rounded-lg px-4 py-2.5 text-sm font-medium transition-colors">
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#EFF1F5] my-1" />
                  <DropdownMenuItem 
                    onClick={handleSignOut} 
                    className="text-[#5D6A97] cursor-pointer hover:bg-[#EFF1F5] hover:text-[#404968] focus:bg-[#EFF1F5] focus:text-[#404968] rounded-lg px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2"
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