"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  
  useEffect(() => {
    // URL에서 오류 정보 확인
    const errorMsg = searchParams.get('error')
    if (errorMsg) {
      setErrorDetails(decodeURIComponent(errorMsg))
    }
  }, [searchParams])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f13] via-[#171720] to-[#0f0f13]"></div>
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      </div>
      
      <div className="w-full max-w-md text-center relative z-10 animate-fadeIn">
        <h1 className="text-2xl font-bold mb-4 text-white">로그인 오류 발생</h1>
        <p className="text-gray-400 mb-6">
          로그인 중 문제가 발생했습니다. 다시 시도해 주세요.
        </p>
        
        {errorDetails && (
          <div className="p-3 mb-6 rounded-lg bg-red-900/30 text-red-400 border border-red-800/50 text-sm">
            <p className="font-semibold">오류 상세정보:</p>
            <p className="mt-1 text-xs">{errorDetails}</p>
          </div>
        )}
        
        <Button asChild className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md">
          <Link href="/auth/login">로그인 페이지로 돌아가기</Link>
        </Button>
      </div>
    </div>
  )
}