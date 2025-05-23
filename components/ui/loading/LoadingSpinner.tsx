import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
  fullScreen?: boolean
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  text = 'Loading...',
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  }

  const spinner = (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
      
      {/* Spinning gradient ring */}
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-sky-500 border-r-sky-500 animate-spin"></div>
      
      {/* Inner pulse effect */}
      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-sky-400/20 to-blue-500/20 animate-pulse"></div>
      
      {/* Center dot */}
      <div className="absolute inset-1/3 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 animate-pulse"></div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          {text && (
            <p className="text-sm font-medium text-gray-600 animate-pulse">{text}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {spinner}
      {text && (
        <p className="text-sm font-medium text-gray-600">{text}</p>
      )}
    </div>
  )
}

// Modern minimal spinner variant
export const MinimalSpinner: React.FC<LoadingSpinnerProps> = ({ 
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
          strokeWidth="4"
        />
        <circle
          className="stroke-sky-500"
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

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-50/90 to-gray-100/90 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          {text && (
            <p className="text-sm font-medium text-gray-700">{text}</p>
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

// Dots loading animation
export const DotsLoader: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("flex gap-1", className)}>
      <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce"></div>
    </div>
  )
}

export default LoadingSpinner
