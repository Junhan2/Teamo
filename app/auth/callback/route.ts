import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/dashboard'
  
  console.log('🔄 Auth callback started:', { code: !!code, next })

  if (!code) {
    console.error('❌ No auth code provided')
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
  }

  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              console.warn('Cookie set error:', error)
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options, maxAge: 0 })
            } catch (error) {
              console.warn('Cookie remove error:', error)
            }
          },
        },
      }
    )
    
    console.log('🔄 Exchanging code for session...')
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)    
    if (error) {
      console.error('❌ Auth exchange error:', error)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`)
    }

    if (!data.session) {
      console.error('❌ No session data received')
      return NextResponse.redirect(`${origin}/auth/login?error=no_session`)
    }

    console.log('✅ Session created:', data.session.user.email)
    
    // 사용자 프로필 확인/생성
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.session.user.id)
      .single()
    
    if (profileError && profileError.code === 'PGRST116') {
      console.log('📝 Creating user profile...')
      await supabase.from('profiles').insert([{
        id: data.session.user.id,
        email: data.session.user.email,
        full_name: data.session.user.user_metadata?.full_name,
        avatar_url: data.session.user.user_metadata?.avatar_url
      }])
    }
    
    const redirectUrl = `${origin}${next}`
    console.log('🚀 Redirecting to:', redirectUrl)
    return NextResponse.redirect(redirectUrl)
    
  } catch (err: any) {
    console.error('💥 Callback exception:', err)
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(err?.message || 'callback_error')}`)
  }
}
