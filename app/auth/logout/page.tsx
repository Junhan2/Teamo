"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export default function LogoutPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleLogout = async () => {
      const { error } = await supabase.auth.signOut()
      if (!error) {
        router.push("/auth/login")
      }
    }

    handleLogout()
  }, [router, supabase.auth])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f13] via-[#171720] to-[#0f0f13]"></div>
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      </div>
      
      <div className="text-center relative z-10 animate-fadeIn">
        <h1 className="text-2xl font-bold mb-4 text-white">로그아웃 중...</h1>
        <p className="text-gray-400">잠시만 기다려 주세요.</p>
      </div>
    </div>
  )
}