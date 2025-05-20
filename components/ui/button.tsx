import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-base font-medium cursor-pointer border-none rounded-none transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#3F4249] text-[#FFFFFF] hover:bg-[#4C4F57]",
        destructive:
          "bg-[#ff6138] text-white hover:bg-[#E85833]",
        outline:
          "border border-[#464c58] bg-transparent text-white hover:bg-[#4C4F57]",
        secondary:
          "bg-[#3F4249] text-white hover:bg-[#4C4F57]",
        ghost: "bg-transparent text-white hover:bg-[#4C4F57]",
        link: "text-[#20afff] underline-offset-4 hover:underline",
        accent: "bg-[#ff82c2] text-white hover:bg-[#E575AF]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 py-1.5 text-sm",
        lg: "h-11 px-6 py-2.5",
        icon: "h-10 w-10 p-2",
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
