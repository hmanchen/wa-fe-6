import * as React from "react"
import type { CaseStatus } from "@/types/case"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const STATUS_CONFIG: Record<
  CaseStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
> = {
  draft: { label: "Draft", variant: "secondary" },
  discovery: {
    label: "Discovery",
    variant: "outline",
    className: "border-blue-500/50 text-blue-600 dark:text-blue-400",
  },
  analysis: {
    label: "Analysis",
    variant: "outline",
    className: "border-amber-500/50 text-amber-600 dark:text-amber-400",
  },
  recommendation: {
    label: "Recommendation",
    variant: "outline",
    className: "border-purple-500/50 text-purple-600 dark:text-purple-400",
  },
  report: {
    label: "Report",
    variant: "outline",
    className: "border-cyan-500/50 text-cyan-600 dark:text-cyan-400",
  },
  completed: {
    label: "Completed",
    variant: "outline",
    className: "border-emerald-500/50 text-emerald-600 dark:text-emerald-400",
  },
  archived: {
    label: "Archived",
    variant: "outline",
    className: "border-muted-foreground/30 text-muted-foreground",
  },
}

export interface StatusBadgeProps {
  status: CaseStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  if (!config) return null

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
