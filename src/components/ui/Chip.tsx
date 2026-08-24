import * as React from "react"
import { cn } from "@/lib/utils"

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "heart" | "gem" | "streak"
  icon?: React.ReactNode
}

export const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  ({ className, variant = "default", icon, children, ...props }, ref) => {
    
    const variants = {
      default: "text-foreground",
      heart: "text-[#FF4B4B]",
      gem: "text-[#2CC0D0]",
      streak: "text-[#FF9600]",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border-2 border-border px-3 py-1 text-sm font-bold bg-card",
          variants[variant],
          className
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </div>
    )
  }
)
Chip.displayName = "Chip"
