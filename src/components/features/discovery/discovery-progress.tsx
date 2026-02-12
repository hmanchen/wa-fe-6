"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface DiscoveryProgressStep {
  id: string;
  label: string;
}

export interface DiscoveryProgressProps {
  steps: DiscoveryProgressStep[];
  currentStep: string;
  completedSteps: string[];
  onStepClick?: (stepId: string) => void;
}

export function DiscoveryProgress({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: DiscoveryProgressProps) {
  return (
    <nav
      aria-label="Discovery progress"
      className="mb-6 overflow-x-auto pb-2 sm:mb-8 sm:pb-0"
    >
      <ol className="flex min-w-max items-center gap-0">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isPending = !isCompleted && !isCurrent;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.id}
              className={cn(
                "flex shrink-0 items-center",
                !isLast && "flex-1"
              )}
            >
              <button
                type="button"
                onClick={() => onStepClick?.(step.id)}
                className={cn(
                  "flex flex-col items-center gap-2 transition-colors",
                  onStepClick && "cursor-pointer hover:opacity-80",
                  !onStepClick && "cursor-default"
                )}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`${step.label} ${isCompleted ? "completed" : isCurrent ? "current" : "pending"}`}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      !isCompleted &&
                      "border-primary bg-primary/10 text-primary",
                    isPending &&
                      "border-muted-foreground/40 bg-muted/50 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-5" aria-hidden />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isCurrent && "text-primary",
                    isCompleted && "text-foreground",
                    isPending && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </button>

              {!isLast && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 min-w-8 rounded-full",
                    isCompleted ? "bg-primary/50" : "bg-muted"
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
