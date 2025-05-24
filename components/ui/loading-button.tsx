import * as React from "react"
import { Button, ButtonProps } from "@/components/ui/button"
import { InlineSpinner } from "@/components/ui/loading"
import { cn } from "@/lib/utils"

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ className, children, loading, loadingText, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn("relative", className)}
        disabled={loading || disabled}
        {...props}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <InlineSpinner size="sm" />
            {loadingText && <span>{loadingText}</span>}
          </span>
        ) : (
          children
        )}
      </Button>
    )
  }
)
LoadingButton.displayName = "LoadingButton"
