"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { CaseNav } from "@/components/layouts/case-nav";
import { PageHeader } from "@/components/shared/page-header";
import { FullPageLoader } from "@/components/shared/loading-spinner";
import { DiscoveryProgress } from "@/components/features/discovery/discovery-progress";
import { ClientInfoForm } from "@/components/features/discovery/client-info-form";
import { FinancialProfileForm } from "@/components/features/discovery/financial-profile-form";
import { ExistingCoverageForm } from "@/components/features/discovery/existing-coverage-form";
import { GoalsForm } from "@/components/features/discovery/goals-form";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDiscovery, useUpdateDiscovery, useCompleteDiscoveryStep } from "@/hooks/use-discovery";
import type { DiscoveryStep } from "@/types/discovery";
import { AlertCircle, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

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
  const updateDiscovery = useUpdateDiscovery(caseId);
  const completeStep = useCompleteDiscoveryStep(caseId);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = STEPS[currentStepIndex];

  const completedSteps = discovery?.completedSteps ?? [];

  const handleStepClick = useCallback(
    (stepId: string) => {
      const index = STEPS.findIndex((s) => s.id === stepId);
      if (index >= 0) setCurrentStepIndex(index);
    },
    []
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
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <CaseNav
        caseId={caseId}
        currentStep="discovery"
        completedSteps={completedSteps}
      />

      <PageHeader
        title="Client Discovery"
        description="Gather comprehensive client information to build an accurate needs analysis."
      />

      <DiscoveryProgress
        steps={STEPS}
        currentStep={currentStep.id}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      <div className="mx-auto w-full max-w-4xl">
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

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft className="mr-2 size-4" />
            Back
          </Button>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            Step {currentStepIndex + 1} of {STEPS.length}
          </div>

          {currentStepIndex < STEPS.length - 1 ? (
            <Button variant="outline" onClick={handleNext}>
              Skip
              <ChevronRight className="ml-2 size-4" />
            </Button>
          ) : (
            <Button
              onClick={() => router.push(`/cases/${caseId}/needs-analysis`)}
              className="gap-2"
            >
              <CheckCircle2 className="size-4" />
              Proceed to Analysis
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
