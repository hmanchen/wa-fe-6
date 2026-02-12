import * as React from "react"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

export interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
      <Separator />
    </div>
  )
}
