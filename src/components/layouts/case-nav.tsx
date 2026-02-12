"use client"

import Link from "next/link"
import { Check, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const STEPS = [
  { id: "overview", label: "Overview", path: "overview" },
  { id: "discovery", label: "Discovery", path: "discovery" },
  { id: "analysis", label: "Needs Analysis", path: "analysis" },
  { id: "recommendations", label: "Recommendations", path: "recommendations" },
  { id: "report", label: "Report", path: "report" },
] as const

export interface CaseNavProps {
  caseId: string
  currentStep: string
  completedSteps: string[]
}

export function CaseNav({ caseId, currentStep, completedSteps }: CaseNavProps) {
  const basePath = `/cases/${caseId}`

  return (
    <nav
      aria-label="Case workflow progress"
      className="border-border bg-muted/30 -mx-4 -mt-4 mb-6 overflow-x-auto border-b px-4 py-4 sm:-mx-6 sm:px-6 [scrollbar-width:thin]"
    >
      <ol className="flex min-w-max items-center justify-between gap-2 pb-1">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id)
          const isCurrent = currentStep === step.id
          const stepPath = `${basePath}/${step.path}`

          return (
            <li
              key={step.id}
              className={cn(
                "flex flex-1 shrink-0 items-center last:flex-none",
                index < STEPS.length - 1 && "min-w-0"
              )}
            >
              <Link
                href={stepPath}
                className={cn(
                  "flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isCurrent && "bg-background text-foreground shadow-sm",
                  !isCurrent && "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      !isCompleted &&
                      "border-primary bg-background text-primary",
                    !isCurrent &&
                      !isCompleted &&
                      "border-muted-foreground/40 bg-background"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4" aria-hidden />
                  ) : isCurrent ? (
                    <Circle className="size-3 fill-current" aria-hidden />
                  ) : null}
                </span>
                <span className="truncate">{step.label}</span>
              </Link>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-px flex-1 min-w-4",
                    isCompleted ? "bg-primary/30" : "bg-border"
                  )}
                  aria-hidden
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
