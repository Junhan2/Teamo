import "@/app/globals.css"
import type { Metadata } from "next"
import { DM_Sans, Fira_Mono } from "next/font/google"
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: '--font-dm-sans',
})

const firaMono = Fira_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  preload: true,
  variable: '--font-fira-mono',
})

export const metadata: Metadata = {
  title: "Muung. | Team Task Management",
  description: "Elegant team collaboration and task management service",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${firaMono.variable}`}>
      <body className={`${dmSans.className} bg-light-background text-light-primary min-h-screen`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
