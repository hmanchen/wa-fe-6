"use client"

import Link from "next/link"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const STEPS = [
  { id: "overview", label: "Overview", path: "" },
  { id: "financial-interview", label: "Financial Interview", path: "financial-interview" },
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
      className="border-border bg-muted/30 -mx-4 -mt-4 mb-4 overflow-x-auto border-b px-4 sm:-mx-6 sm:px-6 [scrollbar-width:thin]"
    >
      <ol className="flex min-w-max items-center gap-1">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id)
          const isCurrent = currentStep === step.id
          const stepPath = step.path ? `${basePath}/${step.path}` : basePath

          return (
            <li key={step.id} className="flex items-center">
              <Link
                href={stepPath}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors",
                  isCurrent && "text-primary",
                  !isCurrent && "text-muted-foreground hover:text-foreground"
                )}
              >
                {isCompleted && (
                  <Check className="size-3.5 text-primary" aria-hidden />
                )}
                <span>{step.label}</span>
                {isCurrent && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
                )}
              </Link>
              {index < STEPS.length - 1 && (
                <span className="text-muted-foreground/40 text-xs" aria-hidden>/</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
