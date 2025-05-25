import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { invitationsServerApi } from './lib/api/invitations/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('🔍 Middleware:', pathname)
  
  // 건너뛸 경로들
  if (pathname.startsWith('/test-memo') || 
      pathname.startsWith('/debug-auth') ||
      pathname.startsWith('/auth/callback') ||
      pathname.startsWith('/auth/error') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.includes('.')) { // 정적 파일들 건너뛰기
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

    // 더 안정적인 세션 검증 - 먼저 getSession으로 체크
    let { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // getSession이 실패하면 getUser로 fallback
    if (!session || sessionError) {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      const hasValidUser = !!(user && !userError)
      
      console.log('🔍 Fallback user check:', { 
        hasValidUser, 
        email: user?.email, 
        pathname,
        sessionError: sessionError?.message,
        userError: userError?.message 
      })
      
      // 사용자 정보가 있으면 세션도 있다고 간주
      if (hasValidUser) {
        console.log('✅ Valid user found via getUser')
      } else {
        // 인증되지 않은 유저가 보호된 경로에 접근하면 로그인 페이지로 리다이렉트
        if (isProtectedRoute) {
          console.log('🚀 Redirecting to login (no valid user)')
          return NextResponse.redirect(new URL('/auth/login', request.url))
        }
      }
      
      return response
    }
    
    const hasValidSession = !!(session && !sessionError)
    
    console.log('🔍 Session check:', { 
      hasValidSession, 
      email: session?.user?.email, 
      pathname,
      error: sessionError?.message 
    })

    // Process pending invitations for newly signed up users
    if (hasValidSession && session.user.email) {
      // Check if this is a new signup by looking for the invitation_id in user metadata
      const invitationId = session.user.user_metadata?.invitation_id;
      if (invitationId) {
        try {
          await invitationsServerApi.processSignupInvitation(
            session.user.id,
            session.user.email
          );
          console.log('✅ Processed signup invitations for:', session.user.email);
        } catch (error) {
          console.error('Failed to process signup invitations:', error);
        }
      }
    }

    // 인증된 유저가 인증 페이지에 접근하면 대시보드로 리다이렉트
    if (hasValidSession && isAuthRoute) {
      console.log('🚀 Redirecting to dashboard (authenticated)')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 인증되지 않은 유저가 보호된 경로에 접근하면 로그인 페이지로 리다이렉트
    if (!hasValidSession && isProtectedRoute) {
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
