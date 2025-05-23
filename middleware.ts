import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
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
  
  // 서버 사이드 supabase 클라이언트 생성
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
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