import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium cursor-pointer rounded-lg transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-gray-cool-700 text-white hover:bg-gray-cool-800 focus:ring-gray-cool-500",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 focus:ring-red-400",
        outline:
          "border border-gray-cool-200 bg-transparent text-gray-cool-700 hover:bg-gray-cool-50 hover:border-gray-cool-300 focus:ring-gray-cool-400",
        secondary:
          "bg-gray-cool-100 text-gray-cool-700 hover:bg-gray-cool-200 focus:ring-gray-cool-400",
        ghost: "text-gray-cool-700 hover:bg-gray-cool-100 focus:ring-gray-cool-400",
        link: "text-blue-600 underline-offset-4 hover:underline focus:ring-blue-400",
        primary: "bg-sky-100 text-sky-700 border-2 border-sky-300 hover:bg-sky-200 hover:border-sky-600 active:bg-sky-300 active:border-sky-700 focus:ring-sky-400",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }