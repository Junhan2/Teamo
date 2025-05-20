import "@/app/globals.css"
import "@/styles/DynamicIslandTodo.css"
import type { Metadata } from "next"
import { Inter, Poppins } from "next/font/google"
import { Zilla_Slab, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: '--font-inter',
})

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  preload: true,
  variable: '--font-poppins',
})

const zillaSlab = Zilla_Slab({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
  preload: true,
  variable: '--font-zilla-slab',
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700", "900"],
  preload: true,
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: "Mocha. | Team Task Management",
  description: "Elegant team collaboration and task management service",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${poppins.variable} ${zillaSlab.variable} ${playfair.variable}`}>
      <body className={`${inter.className} bg-[#292C33] text-white min-h-screen`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
