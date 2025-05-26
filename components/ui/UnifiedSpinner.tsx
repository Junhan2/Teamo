import React from 'react'
import { cn } from '@/lib/utils'

interface UnifiedSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
  fullScreen?: boolean
}

// 이미지와 같은 원형 스피너 (전역 통일 스피너)
export const UnifiedSpinner: React.FC<UnifiedSpinnerProps> = ({ 
  size = 'md', 
  className,
  text,
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-18 h-18'
  }

  const spinner = (
    <div className={cn("relative", sizeClasses[size], className)}>
      <svg className="animate-spin" viewBox="0 0 50 50">
        <circle
          className="stroke-gray-200"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="3"
        />
        <circle
          className="stroke-gray-600"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="3"
          strokeDasharray="80"
          strokeDashoffset="60"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          {text && (
            <p className="text-sm font-medium text-gray-600">{text}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {spinner}
      {text && (
        <p className="text-sm font-medium text-gray-600">{text}</p>
      )}
    </div>
  )
}

// 인라인 사용을 위한 작은 스피너
export const InlineSpinner: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("w-4 h-4", className)}>
      <svg className="animate-spin" viewBox="0 0 50 50">
        <circle
          className="stroke-gray-300"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
        />
        <circle
          className="stroke-gray-600"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
          strokeDasharray="80"
          strokeDashoffset="60"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export default UnifiedSpinner
