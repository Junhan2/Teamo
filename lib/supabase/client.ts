'use client'

import { createBrowserClient } from '@supabase/ssr'
import { type Database } from '../../types/database'

let supabaseClient: ReturnType<typeof createBrowserClient<Database, 'public'>> | null = null

function cleanStorageData() {
  if (typeof window === 'undefined') return
  
  try {
    console.log('🧹 Cleaning storage data...')
    
    // localStorage 정리
    const keysToCheck = Object.keys(localStorage)
    keysToCheck.forEach(key => {
      if (key.includes('supabase') || key.startsWith('sb-')) {
        try {
          const value = localStorage.getItem(key)
          if (value && (value.startsWith('base64-') || value.includes('base64-eyJ') || value === 'undefined' || value === 'null')) {
            console.warn(`🧹 Removing corrupted data: ${key}`)
            localStorage.removeItem(key)
          }
        } catch (error) {
          console.warn(`🧹 Error accessing ${key}, removing...`)
          localStorage.removeItem(key)
        }
      }
    })
    
    // sessionStorage 정리
    const sessionKeys = Object.keys(sessionStorage)
    sessionKeys.forEach(key => {
      if (key.includes('supabase') || key.startsWith('sb-')) {
        try {
          const value = sessionStorage.getItem(key)
          if (value && (value.startsWith('base64-') || value.includes('base64-eyJ') || value === 'undefined' || value === 'null')) {
            console.warn(`🧹 Removing corrupted session data: ${key}`)
            sessionStorage.removeItem(key)
          }
        } catch (error) {
          console.warn(`🧹 Error accessing session ${key}, removing...`)
          sessionStorage.removeItem(key)
        }
      }
    })
    
    console.log('✅ Storage cleanup complete')
  } catch (error) {
    console.error('Storage cleanup error:', error)
  }
}

const safeStorage = {
  getItem: (key: string) => {
    try {
      if (typeof window === 'undefined') return null
      const item = localStorage.getItem(key)
      if (!item || item === 'undefined' || item === 'null') return null
      
      // 손상된 base64 데이터 체크
      if (item.startsWith('base64-') || item.includes('base64-eyJ')) {
        console.warn(`🧹 Removing corrupted storage item: ${key}`)
        localStorage.removeItem(key)
        return null
      }
      
      // JSON 파싱 테스트
      try {
        JSON.parse(item)
      } catch {
        console.warn(`🧹 Invalid JSON in storage: ${key}`)
        localStorage.removeItem(key)
        return null
      }
      
      return item
    } catch (error) {
      console.warn(`Storage getItem failed for ${key}:`, error)
      return null
    }
  },
  setItem: (key: string, value: string) => {
    try {
      if (typeof window === 'undefined') return
      if (!value || value === 'undefined' || value === 'null') return
      
      // 손상된 데이터 저장 방지
      if (value.startsWith('base64-') || value.includes('base64-eyJ')) {
        console.warn(`🧹 Preventing corrupted data storage: ${key}`)
        return
      }
      
      // JSON 파싱 테스트
      try {
        JSON.parse(value)
        localStorage.setItem(key, value)
      } catch {
        console.warn(`🧹 Invalid JSON, not storing: ${key}`)
      }
    } catch (error) {
      console.warn(`Storage setItem failed for ${key}:`, error)
    }
  },
  removeItem: (key: string) => {
    try {
      if (typeof window === 'undefined') return
      localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Storage removeItem failed for ${key}:`, error)
    }
  }
}

export function createClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  console.log('🚀 Creating new Supabase client...')
  cleanStorageData()

  supabaseClient = createBrowserClient<Database, 'public'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: safeStorage,
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
        flowType: 'pkce'
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-my-custom-header': 'teamo-app'
        }
      }
    }
  )

  // 클라이언트 생성 후 즉시 세션 상태 확인
  if (typeof window !== 'undefined') {
    supabaseClient.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('🔍 Session check warning:', error.message)
      } else {
        console.log('🔍 Current session status:', !!session)
      }
    }).catch(err => {
      console.warn('🔍 Session check failed:', err)
    })
  }

  console.log('✅ Supabase client created')
  return supabaseClient
}

export function resetClient() {
  console.log('🔄 Resetting Supabase client...')
  cleanStorageData()
  
  // 기존 클라이언트가 있다면 정리
  if (supabaseClient) {
    try {
      // 모든 채널 구독 해제
      supabaseClient.removeAllChannels()
    } catch (error) {
      console.warn('Client cleanup warning:', error)
    }
  }
  
  supabaseClient = null
  console.log('✅ Client reset complete')
}
