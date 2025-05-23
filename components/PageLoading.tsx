"use client"

import { MinimalSpinner } from '@/components/ui/loading'

interface PageLoadingProps {
  message?: string
}

export default function PageLoading({ message = "Loading..." }: PageLoadingProps) {
  return (
    <div className="flex min-h-screen items-center justify-center" 
         style={{background: 'linear-gradient(135deg, #FCFCFD 0%, #F9F9FB 50%, rgba(239, 241, 245, 0.5) 100%)'}}>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200">
        <MinimalSpinner size="lg" text={message} />
      </div>
    </div>
  )
}
