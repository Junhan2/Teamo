'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Ensure proper cookie persistence
        get(name: string) {
          if (typeof document !== 'undefined') {
            const cookies = document.cookie.split(';')
            const cookie = cookies.find(c => c.trim().startsWith(`${name}=`))
            return cookie ? decodeURIComponent(cookie.split('=')[1]) : undefined
          }
          return undefined
        },
        set(name: string, value: string, options: any) {
          if (typeof document !== 'undefined') {
            let cookieStr = `${name}=${encodeURIComponent(value)}`
            
            if (options?.maxAge) {
              cookieStr += `; max-age=${options.maxAge}`
            }
            if (options?.expires) {
              cookieStr += `; expires=${options.expires.toUTCString()}`
            }
            cookieStr += `; path=${options?.path || '/'}`
            cookieStr += `; samesite=${options?.sameSite || 'lax'}`
            if (options?.secure) {
              cookieStr += `; secure`
            }
            
            document.cookie = cookieStr
          }
        },
        remove(name: string, options: any) {
          if (typeof document !== 'undefined') {
            document.cookie = `${name}=; max-age=0; path=${options?.path || '/'}`
          }
        },
      },
      auth: {
        persistSession: true,
        storageKey: 'sb-auth-token',
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    }
  )
}