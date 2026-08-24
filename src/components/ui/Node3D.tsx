import * as React from "react"
import { motion, HTMLMotionProps } from "motion/react"
import { cn } from "@/lib/utils"

export interface Node3DProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  state?: "locked" | "active" | "completed"
  color?: string // Optional custom hex color if you want to override the default Lingo Blue
}

export const Node3D = React.forwardRef<HTMLButtonElement, Node3DProps>(
  ({ className, state = "locked", color = "#1CB0F6", children, ...props }, ref) => {
    
    const isLocked = state === "locked"
    const isActive = state === "active"

    // Colors based on state
    const bg = isLocked ? "bg-slate-200" : "bg-blue-600"
    const shadow = isLocked ? "border-b-slate-300" : "border-b-blue-800 shadow-lg shadow-blue-500/20"
    const text = isLocked ? "text-slate-400" : "text-white"

    return (
      <div className={cn("relative", isActive && "animate-pulse-soft")}>
        <motion.button
          ref={ref}
          whileTap={!isLocked ? { y: 4, borderBottomWidth: "2px", marginBottom: "4px" } : undefined}
          transition={{ duration: 0.1 }}
          className={cn(
            "relative w-20 h-20 md:w-22 md:h-22 rounded-full border-b-[6px] flex items-center justify-center font-bold text-2xl transition-all cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400 focus-visible:ring-offset-2",
            bg,
            shadow,
            text,
            isLocked && "opacity-85 cursor-not-allowed",
            className
          )}
          style={!isLocked && state === "completed" && color !== "#1CB0F6" ? {
            backgroundColor: color,
            borderBottomColor: color,
          } : undefined}
          disabled={isLocked}
          {...props}
        >
          {children}
        </motion.button>
      </div>
    )
  }
)
Node3D.displayName = "Node3D"
