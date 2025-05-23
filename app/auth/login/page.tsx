"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useIsMobile } from "@/hooks/use-mobile"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        },
      })
      
      if (error) {
        throw error
      }
    } catch (error: any) {
      console.error("Error signing in:", error)
      setError(error?.message || "An error occurred during sign-in.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-gray-cool-25 via-gray-cool-50 to-gray-cool-100/30">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/20 via-transparent to-transparent"></div>
      </div>
      
      <div className="container relative z-10 max-w-md">
        <div 
          className="text-center mb-10 animate-fadeIn"
        >
          <div className="relative mb-6">
            {/* Logo mark */}
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
              <span className="text-3xl font-bold text-white">T</span>
            </div>
            
            {/* Title */}
            <h1 
              className="text-5xl font-bold text-gray-cool-800 mb-3"
              style={{
                fontFamily: "var(--font-dm-sans)",
                letterSpacing: "-0.02em"
              }}
            >
              tide.
            </h1>
            <p 
              className="text-gray-cool-600 text-lg"
              style={{
                fontFamily: "var(--font-dm-sans)"
              }}
            >
              팀과 함께하는 스마트한 할일 관리
            </p>
          </div>
        </div>
        
        <div className="animate-fadeIn">
          <Card className="bg-white/90 backdrop-blur-sm border-gray-cool-100 shadow-2xl rounded-2xl overflow-hidden">
            <CardContent className="p-8">
              {error && (
                <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm mb-4 animate-fadeIn">
                  {error}
                </div>
              )}
              
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                variant="outline"
                className="w-full h-14 rounded-xl bg-white hover:bg-gray-cool-50 text-gray-cool-700 border-2 border-gray-cool-200 hover:border-gray-cool-300 shadow-sm hover:shadow-md text-base font-medium transition-all duration-200 flex items-center justify-center gap-3"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  width="20px"
                  height="20px"
                  className={isLoading ? "opacity-50" : ""}
                >
                  <path
                    fill="#FFC107"
                    d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                  />
                  <path
                    fill="#FF3D00"
                    d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                  />
                </svg>
                <span style={{ fontFamily: "var(--font-dm-sans)" }}>
                  {isLoading ? "로그인 중..." : "Google 계정으로 시작하기"}
                </span>
              </Button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-cool-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-cool-500" style={{ fontFamily: "var(--font-dm-sans)" }}>
                    또는
                  </span>
                </div>
              </div>
              
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                variant="primary"
                className="w-full h-14 rounded-xl text-base font-semibold transition-all duration-200"
              >
                <span style={{ fontFamily: "var(--font-dm-sans)" }}>
                  무료로 시작하기
                </span>
              </Button>
            </CardContent>
            <CardFooter className="bg-gray-cool-50/50 px-8 py-4 text-center">
              <p className="text-xs text-gray-cool-500 w-full" style={{ fontFamily: "var(--font-dm-sans)" }}>
                로그인 시 서비스 이용약관과 개인정보 처리방침에 동의하는 것으로 간주됩니다.
              </p>
            </CardFooter>
          </Card>
        </div>
        
        <div className="mt-8 text-center animate-fadeIn">
          <p 
            className="text-xs text-gray-cool-400"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            © 2025 Tide. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}