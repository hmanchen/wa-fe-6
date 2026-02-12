"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { CaseNav } from "@/components/layouts/case-nav";
import { FullPageLoader } from "@/components/shared/loading-spinner";
import { useCase } from "@/hooks/use-cases";
import { formatDate } from "@/lib/formatters/date";
import { caseStatusConfig } from "@/lib/constants/case-status";
import { Search, BarChart3, FileText, Mail, Phone, Calendar, Users } from "lucide-react";

function getWorkflowProgress(status: string): {
  currentStep: string;
  completedSteps: string[];
  progressPercent: number;
} {
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
  const progressPercent =
    status === "completed" || status === "archived"
      ? 100
      : Math.round(((currentIndex + 0.5) / steps.length) * 100);

  return { currentStep, completedSteps, progressPercent };
}

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.caseId as string;

  const { data: caseData, isLoading, isError } = useCase(caseId);

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (isError || !caseData) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6 sm:p-12">
        <p className="text-muted-foreground text-center">
          Unable to load this case. It may have been deleted or you may not have
          access.
        </p>
        <Button variant="outline" onClick={() => router.push("/cases")}>
          Back to Cases
        </Button>
      </div>
    );
  }

  const config = caseStatusConfig[caseData.status];
  const { currentStep, completedSteps, progressPercent } = getWorkflowProgress(
    caseData.status
  );

  return (
    <div className="space-y-6 p-4 sm:space-y-8 sm:p-6">
      <PageHeader
        title={caseData.clientName}
        description={`Case ${caseData.caseNumber}`}
      >
        <Button variant="outline" size="sm" asChild>
          <Link href={`/cases/${caseData.id}/discovery`}>Edit</Link>
        </Button>
      </PageHeader>

      <CaseNav
        caseId={caseId}
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>Contact details for this case</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Mail className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="text-muted-foreground mb-0.5 text-xs">Email</p>
                    <p className="text-sm">{caseData.clientEmail || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="text-muted-foreground mb-0.5 text-xs">Phone</p>
                    <p className="text-sm">{caseData.clientPhone || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="text-muted-foreground mb-0.5 text-xs">Meeting Date</p>
                    <p className="text-sm">
                      {caseData.meetingDate ? formatDate(caseData.meetingDate) : "Not scheduled"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="text-muted-foreground mb-0.5 text-xs">Case Type</p>
                    <p className="text-sm capitalize">{caseData.caseType}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Case Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Case Overview</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">Status</p>
                  <StatusBadge status={caseData.status} />
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">Created</p>
                  <p className="text-sm">{formatDate(caseData.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">Last Updated</p>
                  <p className="text-sm">{formatDate(caseData.updatedAt)}</p>
                </div>
              </div>
              {caseData.description && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">Description</p>
                  <p className="text-sm">{caseData.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Progress</CardTitle>
              <CardDescription>Current stage in the case workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progressPercent} className="h-2" />
              <p className="text-muted-foreground text-sm">
                {progressPercent}% complete
              </p>
              {config.nextSteps.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Next steps</p>
                  <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                    {config.nextSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Continue from where you left off</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {caseData.status === "draft" && (
                <Button className="w-full justify-start" asChild>
                  <Link href={`/cases/${caseId}/discovery`}>
                    <Search className="mr-2 size-4" />
                    Start Discovery
                  </Link>
                </Button>
              )}
              {(caseData.status === "discovery" ||
                caseData.status === "draft") && (
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href={`/cases/${caseId}/discovery`}>
                    <Search className="mr-2 size-4" />
                    Continue Discovery
                  </Link>
                </Button>
              )}
              {(caseData.status === "analysis" ||
                caseData.status === "discovery") && (
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href={`/cases/${caseId}/analysis`}>
                    <BarChart3 className="mr-2 size-4" />
                    Run Analysis
                  </Link>
                </Button>
              )}
              {(caseData.status === "recommendation" ||
                caseData.status === "analysis") && (
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href={`/cases/${caseId}/recommendations`}>
                    <FileText className="mr-2 size-4" />
                    View Recommendations
                  </Link>
                </Button>
              )}
              {(caseData.status === "report" ||
                caseData.status === "recommendation") && (
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href={`/cases/${caseId}/report`}>
                    <FileText className="mr-2 size-4" />
                    Generate Report
                  </Link>
                </Button>
              )}
              {caseData.status === "completed" && (
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href={`/cases/${caseId}/report`}>
                    <FileText className="mr-2 size-4" />
                    View Report
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
