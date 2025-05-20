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
    <header className="sticky top-0 z-10 supertape-nav backdrop-blur-lg py-2 bg-[#B27CF7] shadow-md">
      <div className="container mx-auto max-w-5xl">
        <div className="flex justify-between items-center px-4 py-2">
          <Link href="/dashboard" className="text-2xl tracking-tight flex items-center gap-2">
            <span className="font-serif text-[#000000] font-bold var(--font-playfair)">Mung.</span>
          </Link>

          <div className="flex items-center gap-4">
            {/* 플로팅 버튼으로 이동됨 */}

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 w-10 rounded-full p-0 border-2 border-black hover:bg-white/20 transition-all duration-200 transform hover:scale-110">
                    <Avatar className="h-full w-full">
                      {user.avatar_url ? (
                        <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} className="border-2 border-white" />
                      ) : (
                        <AvatarFallback className="bg-white text-[#B27CF7] font-bold text-lg">
                          {(user.full_name?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF82C2] text-[10px] font-bold text-white border-2 border-white shadow-md">
                      {Math.floor(Math.random() * 9) + 1}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border-[#E0E0E0] text-black min-w-[200px] rounded-xl shadow-lg p-1">
                  <DropdownMenuLabel className="flex items-center space-x-2 p-3 rounded-lg hover:bg-[#F8F0FF]">
                    <div className="rounded-full bg-[#B27CF7] h-10 w-10 flex items-center justify-center text-white font-bold">
                      {(user.full_name?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-black">{user.full_name || 'User'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <DropdownMenuItem className="cursor-pointer rounded-lg my-1 hover:bg-[#F8F0FF] focus:bg-[#F8F0FF] text-gray-700 focus:text-gray-700 px-3 py-2">
                    <div className="bg-[#FFD6E8] w-6 h-6 rounded-full flex items-center justify-center mr-2">
                      <User size={14} className="text-[#FF82C2]" />
                    </div>
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer rounded-lg my-1 hover:bg-[#F8F0FF] focus:bg-[#F8F0FF] text-gray-700 focus:text-gray-700 px-3 py-2">
                    <div className="bg-[#D6E5FF] w-6 h-6 rounded-full flex items-center justify-center mr-2">
                      <Calendar size={14} className="text-[#82A9FF]" />
                    </div>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <DropdownMenuItem 
                    onClick={handleSignOut} 
                    className="cursor-pointer rounded-lg my-1 hover:bg-red-50 focus:bg-red-50 text-red-500 focus:text-red-500 px-3 py-2"
                  >
                    <div className="bg-red-100 w-6 h-6 rounded-full flex items-center justify-center mr-2">
                      <LogOut size={14} className="text-red-500" />
                    </div>
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