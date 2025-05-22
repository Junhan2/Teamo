import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-gray-cool-200 bg-gray-cool-25 px-4 py-3 text-sm text-gray-cool-700 ring-offset-white transition-all duration-200 placeholder:text-gray-cool-400 hover:border-gray-cool-300 focus:border-gray-cool-500 focus:outline-none focus:ring-2 focus:ring-gray-cool-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-cool-50 resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }