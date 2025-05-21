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
    <header className="sticky top-0 z-10 supertape-nav backdrop-blur-lg py-2 bg-light-background shadow-md border-b border-light-border">
      <div className="container mx-auto max-w-5xl">
        <div className="flex justify-between items-center px-4 py-2">
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
                className="text-light-primary font-black font-dm-sans relative z-10"
                style={{
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)"
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
                  <Button variant="ghost" className="h-9 w-9 rounded-full p-0 hover:bg-gray-100">
                    <Avatar className="h-9 w-9 ring-2 ring-light-border">
                      {user.avatar_url ? (
                        <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
                      ) : (
                        <AvatarFallback className="bg-light-accent text-white">
                          <User size={14} />
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-light-background border-light-border text-light-primary min-w-[200px] shadow-lg rounded-lg p-2">
                  <DropdownMenuLabel className="px-3 py-2">
                    <p className="text-sm font-medium text-light-primary leading-tight">{user.full_name || 'User'}</p>
                    <p className="text-xs text-light-muted mt-1 leading-tight">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-light-border my-1" />
                  <DropdownMenuItem className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 text-light-primary rounded-md px-3 py-2 text-sm">
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 text-light-primary rounded-md px-3 py-2 text-sm">
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-light-border my-1" />
                  <DropdownMenuItem 
                    onClick={handleSignOut} 
                    className="text-red-500 cursor-pointer hover:bg-red-50 hover:text-red-600 focus:bg-red-50 focus:text-red-600 rounded-md px-3 py-2 text-sm"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
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