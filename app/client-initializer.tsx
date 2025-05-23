'use client'

import { useEffect, useRef } from 'react'
import { resetClient } from '../lib/supabase/client'

export default function ClientInitializer() {
  const initialized = useRef(false)

  useEffect(() => {
    // React Strict Mode에서 중복 실행 방지
    if (initialized.current) {
      console.log('🔄 Client already initialized, skipping...')
      return
    }
    
    initialized.current = true
    console.log('🚀 Initializing Supabase client...')
    
    // 기존 클라이언트 리셋 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      resetClient()
    }
    
    // 손상된 데이터만 선별적 정리 (유효한 세션은 보존)
    if (typeof window !== 'undefined') {
      try {
        // 손상된 쿠키만 선별적으로 제거
        document.cookie.split(";").forEach(function(cookie) {
          const cookiePair = cookie.trim().split('=')
          const name = cookiePair[0]
          const value = cookiePair[1]
          
          if ((name.includes('supabase') || name.startsWith('sb-')) && 
              value && (value.startsWith('base64-') || 
                       value.includes('base64-eyJ') || 
                       value === 'undefined' || 
                       value === 'null' ||
                       value.length < 10)) { // 너무 짧은 값도 손상된 것으로 간주
            console.warn(`🧹 Removing corrupted cookie: ${name}`)
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
          }
        })
        
        // localStorage에서도 손상된 항목만 제거
        const localStorageKeys = Object.keys(localStorage)
        localStorageKeys.forEach(key => {
          if (key.includes('supabase') || key.startsWith('sb-')) {
            try {
              const value = localStorage.getItem(key)
              if (value && (value.startsWith('base64-') || 
                           value.includes('base64-eyJ') || 
                           value === 'undefined' || 
                           value === 'null')) {
                console.warn(`🧹 Removing corrupted localStorage: ${key}`)
                localStorage.removeItem(key)
              } else if (value) {
                // 유효한 JSON인지 확인
                try {
                  JSON.parse(value)
                  console.log(`✅ Valid session data preserved: ${key}`)
                } catch {
                  console.warn(`🧹 Removing invalid JSON: ${key}`)
                  localStorage.removeItem(key)
                }
              }
            } catch (error) {
              console.warn(`🧹 Error accessing ${key}, removing...`)
              localStorage.removeItem(key)
            }
          }
        })
        
        console.log('✅ Client initialization complete')
      } catch (error) {
        console.warn('Client initialization warning:', error)
      }
    }
  }, [])

  return null
}
