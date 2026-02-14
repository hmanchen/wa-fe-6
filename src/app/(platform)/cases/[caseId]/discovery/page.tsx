"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { FullPageLoader } from "@/components/shared/loading-spinner";
import { DiscoveryProgress } from "@/components/features/discovery/discovery-progress";
import { AdvisorTalkingPoints } from "@/components/features/discovery/advisor-talking-points";
import { ClientInfoForm } from "@/components/features/discovery/client-info-form";
import { FinancialProfileForm } from "@/components/features/discovery/financial-profile-form";
import { ExistingCoverageForm } from "@/components/features/discovery/existing-coverage-form";
import { GoalsForm } from "@/components/features/discovery/goals-form";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDiscovery, useUpdateDiscovery, useCompleteDiscoveryStep } from "@/hooks/use-discovery";
import { useCase } from "@/hooks/use-cases";
import type { DiscoveryStep } from "@/types/discovery";
import { AlertCircle, ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

const STEPS: { id: DiscoveryStep; label: string }[] = [
  { id: "personal-info", label: "Personal Info" },
  { id: "financial-profile", label: "Financial Profile" },
  { id: "existing-coverage", label: "Existing Coverage" },
  { id: "goals-priorities", label: "Goals & Priorities" },
];

export default function DiscoveryPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;

  const { data: discovery, isLoading, error } = useDiscovery(caseId);
  const { data: caseData } = useCase(caseId);
  const updateDiscovery = useUpdateDiscovery(caseId);
  const completeStep = useCompleteDiscoveryStep(caseId);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = STEPS[currentStepIndex];

  const completedSteps = discovery?.completedSteps ?? [];

  const handleStepClick = useCallback(
    (stepId: string) => {
      const index = STEPS.findIndex((s) => s.id === stepId);
      if (index < 0) return;
      // Can always go back to completed or current steps
      // Can only go forward if all previous steps are completed
      if (index > currentStepIndex) {
        const allPreviousCompleted = STEPS.slice(0, index).every((s) =>
          completedSteps.includes(s.id)
        );
        if (!allPreviousCompleted) {
          toast.error("Please complete the current step before moving ahead.");
          return;
        }
      }
      setCurrentStepIndex(index);
    },
    [currentStepIndex, completedSteps]
  );

  const handleNext = useCallback(() => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((i) => i + 1);
    }
  }, [currentStepIndex]);

  const handleBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((i) => i - 1);
    }
  }, [currentStepIndex]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleStepSubmit = useCallback(async (stepId: DiscoveryStep, data: any) => {
    try {
      const fieldMap: Record<DiscoveryStep, string> = {
        "personal-info": "personalInfo",
        "financial-profile": "financialProfile",
        "existing-coverage": "existingCoverage",
        "goals-priorities": "goals",
      };

      await updateDiscovery.mutateAsync({ [fieldMap[stepId]]: data });
      await completeStep.mutateAsync(stepId);
      toast.success(`${STEPS.find((s) => s.id === stepId)?.label} saved successfully`);

      if (currentStepIndex < STEPS.length - 1) {
        handleNext();
      } else {
        toast.success("Discovery completed! Proceeding to Needs Analysis.");
        router.push(`/cases/${caseId}/needs-analysis`);
      }
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  }, [updateDiscovery, completeStep, currentStepIndex, handleNext, router, caseId]);

  if (isLoading) return <FullPageLoader />;

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            Failed to load discovery data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      {/* Compact header: back link + title + step counter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/cases/${caseId}`}
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">
              {caseData?.clientName || "Overview"}
            </span>
          </Link>
          <div className="h-5 w-px bg-border" />
          <div>
            <h1 className="text-lg font-semibold leading-tight">Client Discovery</h1>
          </div>
        </div>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Step {currentStepIndex + 1} of {STEPS.length}
        </p>
      </div>

      {/* Discovery step tabs */}
      <DiscoveryProgress
        steps={STEPS}
        currentStep={currentStep.id}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      {/* Two-column layout: form left, divider, session guide right */}
      <div className="flex gap-0">
        {/* Left: Form content — capped width so fields aren't too wide */}
        <div className="min-w-0 max-w-2xl flex-1 pr-6">
          {currentStep.id === "personal-info" && (
            <ClientInfoForm
              defaultValues={discovery?.personalInfo}
              onSubmit={(data) => handleStepSubmit("personal-info", data)}
              isSubmitting={updateDiscovery.isPending}
            />
          )}
          {currentStep.id === "financial-profile" && (
            <FinancialProfileForm
              defaultValues={discovery?.financialProfile}
              onSubmit={(data) => handleStepSubmit("financial-profile", data)}
              isSubmitting={updateDiscovery.isPending}
            />
          )}
          {currentStep.id === "existing-coverage" && (
            <ExistingCoverageForm
              defaultValues={discovery?.existingCoverage}
              onSubmit={(data) => handleStepSubmit("existing-coverage", data)}
              isSubmitting={updateDiscovery.isPending}
            />
          )}
          {currentStep.id === "goals-priorities" && (
            <GoalsForm
              defaultValues={discovery?.goals}
              onSubmit={(data) => handleStepSubmit("goals-priorities", data)}
              isSubmitting={updateDiscovery.isPending}
            />
          )}

          {/* Bottom navigation */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="mr-1 size-4" />
              Back
            </Button>

            {currentStepIndex < STEPS.length - 1 ? (
              currentStepIndex === 0 ? (
                /* Personal Info is required — no skip, must save */
                <Button
                  size="sm"
                  type="submit"
                  form="discovery-form"
                >
                  Next
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleNext}>
                  Skip
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              )
            ) : (
              <Button
                size="sm"
                onClick={() => router.push(`/cases/${caseId}/needs-analysis`)}
                className="gap-1.5"
              >
                <CheckCircle2 className="size-4" />
                Proceed to Analysis
              </Button>
            )}
          </div>
        </div>

        {/* Vertical divider — fades out toward the bottom */}
        <div className="hidden self-stretch md:block">
          <div className="h-full w-px bg-gradient-to-b from-border/60 via-border/30 to-transparent" />
        </div>

        {/* Right: Session guide */}
        <aside className="hidden w-80 shrink-0 pl-6 md:block">
          <div className="sticky top-4 rounded-lg border bg-muted/20 p-3">
            <AdvisorTalkingPoints step={currentStep.id} />
          </div>
        </aside>
      </div>
    </div>
  );
}
