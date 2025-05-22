import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-gray-cool-200 bg-gray-cool-25 px-4 py-2 text-sm text-gray-cool-700 ring-offset-white transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-cool-700 placeholder:text-gray-cool-400 hover:border-gray-cool-300 focus:border-gray-cool-500 focus:outline-none focus:ring-2 focus:ring-gray-cool-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-cool-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }