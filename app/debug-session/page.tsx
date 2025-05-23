"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugSessionPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [profileInfo, setProfileInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const checkSession = async () => {
    setLoading(true)
    try {
      // 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        setError(`Session error: ${sessionError.message}`)
        setSessionInfo(null)
      } else {
        setSessionInfo(session)
      }
      
      // 세션이 있으면 프로필 확인
      if (session) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profileError) {
          setError(`Profile error: ${profileError.message} (Code: ${profileError.code})`)
          setProfileInfo(null)
        } else {
          setProfileInfo(profile)
          setError(null)
        }
      }
    } catch (err: any) {
      setError(`Unexpected error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const clearStorageAndReload = () => {
    if (typeof window === 'undefined') return
    
    // localStorage 정리
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.includes('supabase') || key.startsWith('sb-')) {
        localStorage.removeItem(key)
      }
    })
    
    // sessionStorage 정리
    const sessionKeys = Object.keys(sessionStorage)
    sessionKeys.forEach(key => {
      if (key.includes('supabase') || key.startsWith('sb-')) {
        sessionStorage.removeItem(key)
      }
    })
    
    window.location.reload()
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  useEffect(() => {
    checkSession()
    
    // Auth 상태 변화 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event)
        checkSession()
      }
    )
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Session Debug Information</h1>
      
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Session Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : sessionInfo ? (
              <div className="space-y-2">
                <p className="text-green-600">✅ Session Active</p>
                <p><strong>User ID:</strong> {sessionInfo.user.id}</p>
                <p><strong>Email:</strong> {sessionInfo.user.email}</p>
                <p><strong>Provider:</strong> {sessionInfo.user.app_metadata?.provider}</p>
                <p><strong>Expires at:</strong> {new Date(sessionInfo.expires_at! * 1000).toLocaleString()}</p>
              </div>
            ) : (
              <p className="text-red-600">❌ No Session</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : profileInfo ? (
              <div className="space-y-2">
                <p className="text-green-600">✅ Profile Found</p>
                <p><strong>Profile ID:</strong> {profileInfo.id}</p>
                <p><strong>Email:</strong> {profileInfo.email}</p>
                <p><strong>Full Name:</strong> {profileInfo.full_name || 'Not set'}</p>
                <p><strong>Created:</strong> {new Date(profileInfo.created_at).toLocaleString()}</p>
              </div>
            ) : sessionInfo ? (
              <p className="text-yellow-600">⚠️ Profile not found (will be created on next login)</p>
            ) : (
              <p className="text-gray-600">No session - Profile check skipped</p>
            )}
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Error Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={checkSession} variant="outline">
                Refresh Status
              </Button>
              <Button onClick={clearStorageAndReload} variant="outline">
                Clear Storage & Reload
              </Button>
              {sessionInfo && (
                <Button onClick={signOut} variant="outline">
                  Sign Out
                </Button>
              )}
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">Navigation:</p>
              <div className="flex gap-4">
                <Button 
                  onClick={() => window.location.href = '/auth/login'} 
                  variant="outline"
                  size="sm"
                >
                  Go to Login
                </Button>
                <Button 
                  onClick={() => window.location.href = '/dashboard'} 
                  variant="outline"
                  size="sm"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">LocalStorage Keys:</h3>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {typeof window !== 'undefined' 
                    ? Object.keys(localStorage)
                        .filter(key => key.includes('supabase') || key.startsWith('sb-'))
                        .join('\n') || 'No Supabase keys found'
                    : 'Server-side rendering - localStorage not available'}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Cookies:</h3>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {typeof window !== 'undefined'
                    ? document.cookie.split(';')
                        .filter(cookie => cookie.includes('supabase') || cookie.includes('sb-'))
                        .join('\n') || 'No Supabase cookies found'
                    : 'Server-side rendering - cookies not available'}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
