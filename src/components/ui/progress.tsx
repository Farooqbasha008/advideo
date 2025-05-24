
import * as React from "react"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: number
    max?: number
  }
>(({ className, value, max = 100, ...props }, ref) => {
  const percentage = value != null ? Math.min(Math.max(value, 0), max) / max * 100 : 0

  return (
    <div
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800",
        className
      )}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-slate-900 transition-all dark:bg-slate-50"
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  )
})

Progress.displayName = "Progress"

export { Progress }
