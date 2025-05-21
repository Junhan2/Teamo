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
  title: "tide | Team Task Management",
  description: "Elegant team collaboration and task management platform for seamless productivity",
  keywords: ["task management", "team collaboration", "productivity", "project management", "team workspace"],
  authors: [{ name: "tide team" }],
  creator: "tide",
  publisher: "tide",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "tide | Team Task Management",
    description: "Elegant team collaboration and task management platform for seamless productivity",
    type: "website",
    siteName: "tide",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "tide | Team Task Management",
    description: "Elegant team collaboration and task management platform for seamless productivity",
    creator: "@tideapp",
  },
  applicationName: "tide",
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
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
