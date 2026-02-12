"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { CaseNav } from "@/components/layouts/case-nav";
import { PageHeader } from "@/components/shared/page-header";
import { FullPageLoader } from "@/components/shared/loading-spinner";
import { NeedsSummary } from "@/components/features/needs-analysis/needs-summary";
import { CoverageGapChart } from "@/components/features/needs-analysis/coverage-gap-chart";
import { NeedsBreakdown } from "@/components/features/needs-analysis/needs-breakdown";
import { AiExplanation } from "@/components/features/needs-analysis/ai-explanation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDiscovery } from "@/hooks/use-discovery";
import { useComputeNeedsAnalysis } from "@/hooks/use-needs-analysis";
import { BarChart3, AlertCircle } from "lucide-react";

function getWorkflowContext(status: string): { currentStep: string; completedSteps: string[] } {
  const steps = ["overview", "discovery", "analysis", "recommendations", "report"];
  const statusToStep: Record<string, string> = {
    draft: "overview",
    discovery: "discovery",
    analysis: "analysis",
    recommendation: "recommendations",
    report: "report",
    completed: "report",
    archived: "report",
  };
  const currentStep = statusToStep[status] ?? "overview";
  const currentIndex = steps.indexOf(currentStep);
  const completedSteps = steps.slice(0, currentIndex);
  return { currentStep, completedSteps };
}

const REQUIRED_STEPS = ["personal-info", "financial-profile", "existing-coverage", "goals-priorities"];

function isDiscoveryComplete(discovery: { completedSteps?: string[] } | null | undefined): boolean {
  const steps = discovery?.completedSteps;
  if (!steps) return false;
  return REQUIRED_STEPS.every((step) => steps.includes(step));
}

export default function NeedsAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;

  const { data: discovery, isLoading: discoveryLoading } = useDiscovery(caseId);
  const computeMutation = useComputeNeedsAnalysis();
  const analysisResult = computeMutation.data;

  const workflowContext = getWorkflowContext(
    (discovery as { status?: string })?.status ?? "analysis"
  );

  const discoveryComplete = isDiscoveryComplete(discovery);
  const hasResults = !!analysisResult;
  const isComputing = computeMutation.isPending;

  const handleRunAnalysis = () => {
    computeMutation.mutate(caseId, {
      onSuccess: () => toast.success("Analysis complete"),
      onError: () => toast.error("Failed to compute needs analysis"),
    });
  };

  if (discoveryLoading) {
    return <FullPageLoader />;
  }

  return (
    <div className="space-y-6 p-4 sm:space-y-8 sm:p-6">
      <CaseNav
        caseId={caseId}
        currentStep="analysis"
        completedSteps={workflowContext.completedSteps}
      />

      <PageHeader
        title="Needs Analysis"
        description="Defensible insurance needs based on discovery data"
      >
        <Button
          onClick={handleRunAnalysis}
          disabled={!discoveryComplete || isComputing}
        >
          <BarChart3 className="mr-2 size-4" />
          {isComputing ? "Computing..." : "Run Analysis"}
        </Button>
      </PageHeader>

      {!discoveryComplete && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Discovery incomplete</AlertTitle>
          <AlertDescription>
            Complete all discovery steps before running the needs analysis.
            <Button
              variant="link"
              className="ml-2 h-auto p-0 font-semibold"
              onClick={() => router.push(`/cases/${caseId}/discovery`)}
            >
              Continue discovery →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {discoveryComplete && !hasResults && !isComputing && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to analyze</CardTitle>
            <CardDescription>
              Run the analysis to compute insurance needs from your discovery
              data. This will produce a defensible needs assessment with coverage
              gaps and line-item breakdown.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRunAnalysis}>
              <BarChart3 className="mr-2 size-4" />
              Run Analysis
            </Button>
          </CardContent>
        </Card>
      )}

      {isComputing && (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <FullPageLoader />
          <p className="text-muted-foreground text-sm">
            Computing needs analysis...
          </p>
        </div>
      )}

      {hasResults && analysisResult && (
        <div className="space-y-6 sm:space-y-8">
          <NeedsSummary result={analysisResult} />

          <Card>
            <CardHeader>
              <CardTitle>Coverage gap by category</CardTitle>
              <CardDescription>
                Total need vs. existing coverage across need categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CoverageGapChart coverageGaps={analysisResult.coverageGaps} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Needs breakdown</CardTitle>
              <CardDescription>
                Line-item detail with assumptions and methodology
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NeedsBreakdown lineItems={analysisResult.lineItems} />
            </CardContent>
          </Card>

          <AiExplanation
            caseId={caseId}
            analysisId={caseId}
            explanation={analysisResult.aiExplanation}
          />
        </div>
      )}
    </div>
  );
}
