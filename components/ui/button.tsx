import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-base font-semibold cursor-pointer border-none w-full min-h-[3.5rem] min-w-[6.5rem] px-6 py-[0.6rem] outline-none transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-white text-[#292C33] hover:bg-[#e7e7e7] active:bg-[#cfcfcf]",
        destructive:
          "bg-[#ff6138] text-white hover:bg-[#e85833] active:bg-[#d1502e]",
        outline:
          "border border-[#cfd6e566] bg-[#cfd6e514] text-white hover:bg-[#cfd6e529] active:bg-[#cfd6e53d]",
        secondary:
          "bg-[#cfd6e529] text-white hover:bg-[#cfd6e53d] active:bg-[#cfd6e552]",
        ghost: "bg-transparent text-white hover:bg-[#cfd6e514] active:bg-[#cfd6e529]",
        link: "text-[#20afff] underline-offset-4 hover:underline",
        accent: "bg-[#ff82c2] text-white hover:bg-[#e575af] active:bg-[#cc689b]",
      },
      size: {
        default: "h-[3.5rem] px-6",
        sm: "h-9 px-3 py-2 text-sm min-h-0 min-w-0",
        lg: "h-12 px-8 py-3",
        icon: "h-10 w-10 min-h-0 min-w-0",
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
