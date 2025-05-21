# Team Todo 프로젝트 배포 문서

## 1. 프로젝트 개요

**Team Todo**는 팀의 작업을 효율적으로 관리하기 위한 현대적인 협업 도구입니다. 직관적인 인터페이스와 실시간 업데이트 기능을 통해 사용자들이 쉽게 작업을 추적하고, 진행 상황을 공유하며, 팀 생산성을 향상시킬 수 있습니다.

**배포 URL**: [https://teamo-tau.vercel.app](https://teamo-tau.vercel.app)
**GitHub 저장소**: [https://github.com/Junhan2/Teamo](https://github.com/Junhan2/Teamo)

## 2. 기술 스택

- **프론트엔드**: Next.js 15.2.4, React 19.1.0, Tailwind CSS, Framer Motion
- **백엔드**: Supabase (인증, 데이터베이스, 실시간 구독)
- **배포**: Vercel
- **인증**: Supabase Auth (Google OAuth)

## 3. 주요 기능

1. **사용자 인증**
   - Google 계정을 통한 로그인/로그아웃
   - 개인 프로필 관리

2. **할 일 관리**
   - 상태 변경 (Pending, In Progress, Completed)
   - 개인 및 팀 할 일 구분
   - 작업 생성 및 삭제

3. **통계 및 시각화**
   - 활동 기여도 그래프 (Contribution Graph)
   - 진행 상태별 통계 차트
   - 실시간 데이터 업데이트

4. **UX 개선**
   - 작업 완료 애니메이션 효과 (다이나믹 아일랜드)
   - 직관적인 호버 툴팁
   - 권한에 따른 UI 변화

## 4. 배포 설정

### 4.1 환경 변수

Vercel과 개발 환경에 설정된 환경 변수:

```
NEXT_PUBLIC_SUPABASE_URL=https://zxjmtfyjxonkqhcpuimx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4am10ZnlqeG9ua3FoY3B1aW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MzY1NzksImV4cCI6MjA2MzIxMjU3OX0.gozmtOvbRpbxRJfhziAUYV2Mx-YGJJ6NojV21QopEhQ
```

### 4.2 Supabase 설정

- **인증 공급자**: Google OAuth 활성화
- **콜백 URL**: https://teamo-tau.vercel.app/auth/callback
- **Site URL**: https://teamo-tau.vercel.app

### 4.3 Vercel 설정

- **Framework**: Next.js
- **Build Command**: 기본값 (`next build`)
- **Install Command**: 기본값 (`npm install` 또는 `pnpm install`)
- **Output Directory**: 기본값 (`.next`)

## 5. 코드 구조

주요 디렉토리와 파일 구조:

```
/app                      # Next.js 앱 디렉토리
  /(protected)            # 인증 필요한 경로
    /dashboard            # 대시보드 페이지
  /auth                   # 인증 관련 페이지
    /callback             # OAuth 콜백 처리
    /error                # 인증 오류 페이지
    /login                # 로그인 페이지
    /logout               # 로그아웃 페이지
  /page.tsx               # 홈 페이지
  /layout.tsx             # 레이아웃 컴포넌트

/components               # 리액트 컴포넌트
  /AddTodoForm.tsx        # Todo 추가 폼
  /ContributionGraph      # 기여도 그래프 컴포넌트
  /DynamicIslandTodo.tsx  # 다이나믹 아일랜드 애니메이션
  /TeamTodoList.tsx       # 팀 Todo 목록
  /ui                     # UI 컴포넌트 모음

/lib                      # 유틸리티 함수 및 설정
  /auth                   # 인증 관련 유틸
  /supabase               # Supabase 클라이언트

/styles                   # 글로벌 및 컴포넌트별 스타일
```

## 6. 주요 코드 스니펫

### 6.1 Google 로그인 구현 (app/auth/login/page.tsx)

```tsx
"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        },
      })
      
      if (error) {
        throw error
      }
    } catch (error: any) {
      console.error("Error signing in:", error)
      setError(error?.message || "An error occurred during sign-in.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      {/* ... UI 코드 ... */}
      <Button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full py-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md text-lg font-medium"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          width="24px"
          height="24px"
          className="mr-3"
        >
          {/* ... Google 아이콘 SVG ... */}
        </svg>
        <span>
          {isLoading ? "Signing in..." : "Sign in with Google"}
        </span>
      </Button>
      {/* ... 추가 UI 코드 ... */}
    </div>
  )
}
```

### 6.2 인증 콜백 처리 (app/auth/callback/route.ts)

```tsx
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
```

### 6.3 Supabase 클라이언트 설정

#### 브라우저 클라이언트 (lib/supabase/client.ts)

```tsx
'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### 서버 클라이언트 (lib/auth/supabase-server.ts)

```tsx
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
```

## 7. 배포 완료 및 확인

- **배포 URL**: https://teamo-tau.vercel.app
- **로그인 방법**: Google 계정으로 로그인
- **기능 확인**: Todo 추가/상태 변경, 통계 확인

## 8. 다음 단계

다음 버전에서 개선할 수 있는 기능:

1. 다크/라이트 모드 지원
2. 작업 우선순위 설정
3. 팀 초대 및 관리 기능
4. 알림 및 리마인더
5. 모바일 최적화 개선

---

*마지막 업데이트: 2025년 5월 20일*