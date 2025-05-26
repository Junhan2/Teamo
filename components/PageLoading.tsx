"use client"

import { UnifiedSpinner } from '@/components/ui/UnifiedSpinner'

interface PageLoadingProps {
  message?: string
}

export default function PageLoading({ message = "Loading..." }: PageLoadingProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <UnifiedSpinner size="lg" text={message} />
    </div>
  )
}
