'use client'

import { createBrowserClient } from '@supabase/ssr'
import { type Database } from '../../types/database'

let supabaseClient: ReturnType<typeof createBrowserClient<Database, 'public'>> | null = null

function cleanStorageData() {
  if (typeof window === 'undefined') return
  
  try {
    const keysToCheck = Object.keys(localStorage)
    keysToCheck.forEach(key => {
      if (key.includes('supabase') || key.startsWith('sb-')) {
        try {
          const value = localStorage.getItem(key)
          if (value && (value.startsWith('base64-') || value.includes('base64-eyJ'))) {
            console.warn(`🧹 Removing corrupted data: ${key}`)
            localStorage.removeItem(key)
          }
        } catch (error) {
          localStorage.removeItem(key)
        }
      }
    })
  } catch (error) {
    console.error('Storage cleanup error:', error)
  }
}

const safeStorage = {
  getItem: (key: string) => {
    try {
      if (typeof window === 'undefined') return null
      const item = localStorage.getItem(key)
      if (!item) return null
      
      if (item.startsWith('base64-') || item.includes('base64-eyJ')) {
        localStorage.removeItem(key)
        return null
      }
      
      return item
    } catch (error) {
      return null
    }
  },  setItem: (key: string, value: string) => {
    try {
      if (typeof window === 'undefined') return
      if (value && !value.startsWith('base64-')) {
        localStorage.setItem(key, value)
      }
    } catch (error) {
      console.warn(`Storage setItem failed for ${key}`)
    }
  },
  removeItem: (key: string) => {
    try {
      if (typeof window === 'undefined') return
      localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Storage removeItem failed for ${key}`)
    }
  }
}

export function createClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  cleanStorageData()

  supabaseClient = createBrowserClient<Database, 'public'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: safeStorage,
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true
      }
    }
  )

  return supabaseClient
}

export function resetClient() {
  cleanStorageData()
  supabaseClient = null
}
