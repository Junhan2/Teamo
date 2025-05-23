"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"

function ErrorContent() {
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
    <div className="w-full max-w-md text-center relative z-10 animate-fadeIn">
      <h1 className="text-2xl font-bold mb-4 text-white">Authentication Error</h1>
      <p className="text-gray-400 mb-6">
        There was a problem signing in. Please try again.
      </p>
      
      {errorDetails && (
        <div className="p-3 mb-6 rounded-lg bg-red-900/30 text-red-400 border border-red-800/50 text-sm">
          <p className="font-semibold">Error details:</p>
          <p className="mt-1 text-xs">{errorDetails}</p>
        </div>
      )}
      
      <Button asChild className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md">
        <Link href="/auth/login">Back to Sign In</Link>
      </Button>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f13] via-[#171720] to-[#0f0f13]"></div>
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      </div>
      
      <Suspense fallback={
        <div className="w-full max-w-md text-center relative z-10">
          <h1 className="text-2xl font-bold mb-4 text-white">Loading...</h1>
        </div>
      }>
        <ErrorContent />
      </Suspense>
    </div>
  )
}