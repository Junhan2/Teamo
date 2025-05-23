'use client'

import { useEffect } from 'react'
import { resetClient } from '../lib/supabase/client'

export default function ClientInitializer() {
  useEffect(() => {
    // 브라우저 저장소 강제 정리
    console.log('🚀 Initializing Supabase client...')
    
    // 기존 클라이언트 리셋
    resetClient()
    
    // 추가적인 브라우저 저장소 정리
    if (typeof window !== 'undefined') {
      try {
        // 모든 Supabase 관련 쿠키 제거
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        console.log('✅ Client initialization complete')
      } catch (error) {
        console.warn('Client initialization warning:', error)
      }
    }
  }, [])

  return null
}
