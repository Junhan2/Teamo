import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 테스트 경로는 건너뛰기
  if (pathname.startsWith('/test-memo')) {
    return NextResponse.next()
  }
  
  // 보호된 경로 체크
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/calendar') ||
    pathname.startsWith('/memos') ||
    pathname === '/'

  // 인증 경로 체크
  const isAuthRoute = 
    pathname.startsWith('/auth/login')

  // 콜백 경로는 건너뛰기
  if (pathname.startsWith('/auth/callback')) {
    return NextResponse.next()
  }

  let response = NextResponse.next()
  
  try {
    // 서버 사이드 supabase 클라이언트 생성
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              return request.cookies.get(name)?.value
            } catch (error) {
              console.warn(`Failed to get cookie ${name}:`, error)
              return undefined
            }
          },          set(name: string, value: string, options: any) {
            try {
              response.cookies.set({
                name,
                value,
                ...options,
              })
            } catch (error) {
              console.warn(`Failed to set cookie ${name}:`, error)
            }
          },
          remove(name: string, options: any) {
            try {
              response.cookies.set({
                name,
                value: '',
                ...options,
                maxAge: 0,
              })
            } catch (error) {
              console.warn(`Failed to remove cookie ${name}:`, error)
            }
          },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.warn('Session error in middleware:', error)
      // 세션 에러가 있으면 인증되지 않은 것으로 처리
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
      return response
    }

    const hasSession = !!session

    // 인증된 유저가 인증 페이지에 접근하면 대시보드로 리다이렉트
    if (hasSession && isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 인증되지 않은 유저가 보호된 경로에 접근하면 로그인 페이지로 리다이렉트
    if (!hasSession && isProtectedRoute) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // 에러가 발생하면 보호된 경로는 로그인으로 리다이렉트
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return response
  }
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/calendar/:path*',
    '/memos/:path*',
    '/auth/login',
  ],
}
