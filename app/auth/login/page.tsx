"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useIsMobile } from "@/hooks/use-mobile"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobileView, setIsMobileView] = useState(false)
  const supabase = createClient()
  
  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
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

  // State for controlling bounce animation
  const [isBouncing, setIsBouncing] = useState(false);

  // All hover effects removed
  
  // Click to start bouncing animation
  const handleClick = () => {
    if (isBouncing) return; // Already bouncing
    
    setIsBouncing(true);
    
    // Get the image wrapper and add bouncing class
    const imageEl = document.querySelector('.hero-image-wrapper') as HTMLElement;
    if (imageEl) {
      imageEl.classList.add('is-bouncing');
      
      // Remove the bouncing class and state after animation completes
      setTimeout(() => {
        imageEl.classList.remove('is-bouncing');
        setIsBouncing(false);
      }, 120000); // Float in space for 120 seconds (2 minutes) - super slow animation
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f13] via-[#171720] to-[#0f0f13]"></div>
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      </div>
      
      <div className="container relative z-10 max-w-md">
        <div 
          className="text-center mb-8 animate-fadeIn relative hero-container"
          onClick={handleClick}
        > {/* Simplified container with only click handler */}
          <div className="relative mb-2">
            {/* Hero image with sparkle effects */}
            <div className={`relative mx-auto hero-image-wrapper ${isMobileView ? 'w-[160px]' : 'w-[200px]'}`}>
              {/* Sparkle effects */}
              <div className="sparkle-effect">
                <div className="sparkle sparkle-1"></div>
                <div className="sparkle sparkle-2"></div>
                <div className="sparkle sparkle-3"></div>
                <div className="sparkle sparkle-4"></div>
                <div className="sparkle sparkle-5"></div>
              </div>
              
              <img
                src="/images/hero-3d-svg.svg"
                alt="Muung"
                className="w-full h-auto object-contain animate-gentle-float transition-all duration-500"
                style={{ 
                  filter: "drop-shadow(0 5px 15px rgba(138, 104, 233, 0.25))"
                }}
              />
            </div>
            
            {/* Mung. text overlapping with the image */}
            <h1 
              className={`font-serif text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-bold relative z-10 hero-text transition-all duration-500 ${isMobileView ? 'mt-[-40px]' : 'mt-[-80px]'}`}
              style={{
                fontSize: "clamp(48px, 10vw, 80px)", 
                lineHeight: "1.1",
                textWrap: "balance",
                letterSpacing: "-0.03em",
                display: "block",
                padding: "0 20px",
                fontFamily: "var(--font-playfair)"
              }}
            >
              Muung.
            </h1>
          </div>
          <p 
            className="text-gray-300 text-lg mt-2 relative z-10" /* Larger, brighter subtitle */
            style={{
              fontFamily: "var(--es-text-font-family, var(--inter-font))"
            }}
          >
            Effortlessly Manage Your Tasks
          </p>
        </div>
        
        <div className="animate-fadeIn mt-4">
          <Card className="glass-card border-[#2a2a3c] shadow-xl border-2"> {/* Reduced margin top */}
            <CardHeader className="space-y-1 text-center pb-4">
            </CardHeader>
            <CardContent className="flex flex-col gap-5"> {/* Increased gap */}
              {error && (
                <div className="p-3 rounded-lg bg-red-900/30 text-red-400 border border-red-800/50 text-sm">
                  {error}
                </div>
              )}
              
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md text-lg font-medium" /* Increased size and font */
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  width="24px" /* Larger icon */
                  height="24px"
                  className="mr-3" /* More spacing */
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
                <span style={{ fontFamily: "var(--es-text-font-family, var(--inter-font))" }}>
                  {isLoading ? "Signing in..." : "Sign in with Google"}
                </span>
              </Button>
            </CardContent>
            <CardFooter className="text-center text-sm text-gray-400 pt-2 pb-4"> {/* Increased text size */}
              <span style={{ fontFamily: "var(--es-text-font-family, var(--inter-font))" }}>
                By signing in, you agree to our Terms of Service and Privacy Policy.
              </span>
            </CardFooter>
          </Card>
        </div>
        
        <div className="mt-12 text-center animate-fadeIn">
          <p 
            className="text-sm text-gray-400" /* Increased text size */
            style={{ fontFamily: "var(--es-text-font-family, var(--inter-font))" }}
          >
            © 2025 Muung. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}