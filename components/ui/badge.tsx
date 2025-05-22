import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-gray-cool-300 bg-gray-cool-100 text-gray-cool-700 hover:bg-gray-cool-200",
        secondary:
          "border-gray-cool-200 bg-gray-cool-50 text-gray-cool-600 hover:bg-gray-cool-100",
        destructive:
          "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
        outline: "border-gray-cool-300 text-gray-cool-700 hover:bg-gray-cool-50",
        success: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
        warning: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
        info: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }