import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('🔍 Middleware:', pathname)
  
  // 건너뛸 경로들
  if (pathname.startsWith('/test-memo') || 
      pathname.startsWith('/auth/callback') ||
      pathname.startsWith('/auth/error') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api')) {
    return NextResponse.next()
  }
  
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/calendar') ||
    pathname.startsWith('/memos') ||
    pathname === '/'

  const isAuthRoute = pathname.startsWith('/auth/login')

  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next()
  }

  let response = NextResponse.next()
  
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            response.cookies.set({ name, value: '', ...options, maxAge: 0 })
          },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.getSession()
    const hasSession = !!session && !error
    
    console.log('🔍 Session:', { hasSession, user: session?.user?.email, pathname })
    // 인증된 유저가 인증 페이지에 접근하면 대시보드로 리다이렉트
    if (hasSession && isAuthRoute) {
      console.log('🚀 Redirecting to dashboard (authenticated)')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 인증되지 않은 유저가 보호된 경로에 접근하면 로그인 페이지로 리다이렉트
    if (!hasSession && isProtectedRoute) {
      console.log('🚀 Redirecting to login (unauthenticated)')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    return response
  } catch (error) {
    console.error('💥 Middleware error:', error)
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
