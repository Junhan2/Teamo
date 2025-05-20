'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookie = await cookieStore.get(name)
          return cookie?.value
        },
        async set(name: string, value: string, options: any) {
          try {
            await cookieStore.set({ name, value, ...options })
          } catch (error) {
            // 개발 환경에서는 읽기 전용 쿠키 스토어에 쓰려고 할 때 오류가 발생할 수 있음
            console.error('Error setting cookie:', error)
          }
        },
        async remove(name: string, options: any) {
          try {
            await cookieStore.set({ name, value: '', ...options, maxAge: 0 })
          } catch (error) {
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )
}