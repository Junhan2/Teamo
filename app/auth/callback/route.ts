import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'

export async function GET(request: Request) {
  // 쿠키 기반 클라이언트 생성 (서버 사이드)
  const supabase = await createClient()
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/dashboard'
  
  if (code) {
    try {
      // PKCE 인증 흐름 완료
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        // 성공적으로 세션을 획득했으므로 대시보드로 리다이렉션
        return NextResponse.redirect(`${origin}${next}`)
      }
      console.error('Error during auth code exchange:', error)
      
      // 오류 메시지를 URL 파라미터로 전달
      const errorMsg = encodeURIComponent(error.message || '인증 코드 교환 중 오류 발생')
      return NextResponse.redirect(`${origin}/auth/error?error=${errorMsg}`)
    } catch (err: any) {
      console.error('Exception during auth callback:', err)
      
      // 오류 메시지를 URL 파라미터로 전달
      const errorMsg = encodeURIComponent(err?.message || '인증 콜백 처리 중 예외 발생')
      return NextResponse.redirect(`${origin}/auth/error?error=${errorMsg}`)
    }
  }

  // 코드가 없는 경우 오류 메시지와 함께 에러 페이지로 이동
  return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent('인증 코드가 제공되지 않았습니다')}`)
}