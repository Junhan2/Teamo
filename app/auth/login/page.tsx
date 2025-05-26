"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import ParticlesBackground from "@/components/ui/particles-background"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  
  // URL 파라미터에서 에러 메시지 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get('error')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [])

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
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-900 relative overflow-hidden">
      {/* Particles Background - Simplified and Stable */}
      <ParticlesBackground className="opacity-40" />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/70 via-gray-800/50 to-gray-900/70 z-10"></div>
      
      <div className="container relative z-20 max-w-sm">
        <div 
          className="text-center mb-12 animate-fadeIn"
        >
          {/* Logo */}
          <div className="w-16 h-16 mx-auto mb-8 flex items-center justify-center">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-sm"></div>
            </div>
          </div>
          
          {/* Title */}
          <h1 
            className="text-4xl font-light text-white mb-2 tracking-wide"
            style={{
              fontFamily: "var(--font-dm-sans)",
              letterSpacing: "0.1em"
            }}
          >
            TEAMO
          </h1>
          <p 
            className="text-gray-400 text-sm font-light"
            style={{
              fontFamily: "var(--font-dm-sans)",
              letterSpacing: "0.05em"
            }}
          >
            Minimal task management
          </p>
        </div>
        
        <div className="animate-fadeIn">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl overflow-hidden p-8">
            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm mb-6 animate-fadeIn backdrop-blur-sm">
                {error}
              </div>
            )}
            
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 bg-white/90 hover:bg-white text-gray-900 text-sm font-medium rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm hover:scale-[1.02] active:scale-[0.98] border-0 shadow-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                width="18px"
                height="18px"
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
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </span>
                ) : (
                  "Continue with Google"
                )}
              </span>
            </Button>
            
            <div className="mt-6 text-center">
              <p 
                className="text-xs text-gray-500 font-light"
                style={{ 
                  fontFamily: "var(--font-dm-sans)",
                  letterSpacing: "0.03em"
                }}
              >
                By continuing, you agree to our{' '}
                <span className="text-gray-300">Terms</span> and{' '}
                <span className="text-gray-300">Privacy Policy</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center animate-fadeIn">
          <p 
            className="text-xs text-gray-600 font-light"
            style={{ 
              fontFamily: "var(--font-dm-sans)",
              letterSpacing: "0.05em"
            }}
          >
            © 2025 Teamo
          </p>
        </div>
      </div>
    </div>
  )
}