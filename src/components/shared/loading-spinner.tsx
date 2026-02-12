"use client"

import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-muted-foreground", sizeClasses[size], className)}
      aria-hidden
    />
  )
}

export function FullPageLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-[50vh] flex-col items-center justify-center",
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <LoadingSpinner size="lg" />
      <span className="sr-only">Loading...</span>
    </div>
  )
}
