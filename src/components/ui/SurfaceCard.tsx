import * as React from "react"
import { cn } from "@/lib/utils"

export interface SurfaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean
}

export const SurfaceCard = React.forwardRef<HTMLDivElement, SurfaceCardProps>(
  ({ className, glass, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[1.25rem] bg-card text-card-foreground border-2 border-border shadow-card p-4",
          glass && "bg-card/80 backdrop-blur-md",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SurfaceCard.displayName = "SurfaceCard"
