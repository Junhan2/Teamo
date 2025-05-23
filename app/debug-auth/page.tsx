"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function DebugAuthPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [storageInfo, setStorageInfo] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<string[]>([])
  
  const supabase = createClient()
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        addLog('Starting auth check...')
        
        // 1. Get current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        setSessionInfo({ data: sessionData, error: sessionError })
        addLog(`Session check: ${sessionData.session ? 'Found' : 'Not found'}`)
        
        // 2. Get current user
        const { data: userData, error: userError } = await supabase.auth.getUser()
        setUserInfo({ data: userData, error: userError })
        addLog(`User check: ${userData.user ? 'Found' : 'Not found'}`)
        
        // 3. Check storage
        const storage: any = {}
        if (typeof window !== 'undefined') {
          const localKeys = Object.keys(localStorage).filter(key => 
            key.includes('supabase') || key.startsWith('sb-')
          )
          storage.localStorage = localKeys.map(key => ({
            key,
            value: localStorage.getItem(key)?.substring(0, 100) + '...'
          }))
          
          storage.cookies = document.cookie.split(';')
            .filter(cookie => cookie.includes('supabase') || cookie.includes('sb-'))
            .map(cookie => cookie.trim())
        }
        setStorageInfo(storage)
        addLog(`Storage items found: ${storage.localStorage?.length || 0} localStorage, ${storage.cookies?.length || 0} cookies`)
        
      } catch (error) {
        addLog(`Error: ${error}`)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
    
    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addLog(`Auth state change: ${event} - ${session ? 'has session' : 'no session'}`)
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  const handleSignOut = async () => {
    addLog('Signing out...')
    await supabase.auth.signOut()
    addLog('Sign out complete')
    window.location.reload()
  }
  
  const handleClearStorage = () => {
    addLog('Clearing storage...')
    if (typeof window !== 'undefined') {
      // Clear localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.startsWith('sb-')) {
          localStorage.removeItem(key)
        }
      })
      
      // Clear cookies
      document.cookie.split(";").forEach(function(cookie) {
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
        if (name.trim().includes('supabase') || name.trim().startsWith('sb-')) {
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
        }
      })
    }
    addLog('Storage cleared')
    window.location.reload()
  }
  
  if (loading) {
    return <div className="p-8">Loading debug info...</div>
  }
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Session Info</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">User Info</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(userInfo, null, 2)}
          </pre>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Storage Info</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(storageInfo, null, 2)}
          </pre>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Actions</h2>
          <div className="space-y-2">
            <Button onClick={handleSignOut} variant="destructive" className="w-full">
              Sign Out
            </Button>
            <Button onClick={handleClearStorage} variant="outline" className="w-full">
              Clear Storage
            </Button>
            <Button onClick={() => window.location.href = '/auth/login'} className="w-full">
              Go to Login
            </Button>
            <Button onClick={() => window.location.href = '/dashboard'} className="w-full">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Logs</h2>
        <div className="text-xs bg-gray-100 p-2 rounded max-h-64 overflow-auto">
          {logs.map((log, index) => (
            <div key={index} className="mb-1">{log}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
