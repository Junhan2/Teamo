import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function Home() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
  } else {
    redirect('/auth/login')
  }

  // 아래 코드는 redirect가 작동하지 않을 경우를 위한 폴백
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <h1 
          className="text-3xl font-bold mb-4"
          style={{
            fontFamily: "var(--es-header-font-family)",
            fontWeight: "var(--es-heading-xl-font-weight, 600)",
            fontSize: "clamp(24px, 5vw, 32px)",
            lineHeight: "clamp(28px, 5vw, 36px)",
            letterSpacing: "-0.5px",
            display: "block"
          }}
        >
          Team Todo Service
        </h1>
        <p 
          className="mb-8"
          style={{
            fontFamily: "var(--es-text-font-family, var(--inter-font))"
          }}
        >
          Redirecting...
        </p>
      </div>
    </main>
  )
}
