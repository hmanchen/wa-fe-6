"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { differenceInYears } from "date-fns";
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
import {
  Search,
  BarChart3,
  FileText,
  Mail,
  Phone,
  Calendar,
  Users,
  User,
  MapPin,
  Cake,
  Heart,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────

function calculateAge(dateStr?: string): number | null {
  if (!dateStr) return null;
  try {
    const dob = new Date(dateStr);
    if (isNaN(dob.getTime())) return null;
    const age = differenceInYears(new Date(), dob);
    return age >= 0 && age < 150 ? age : null;
  } catch {
    return null;
  }
}

function formatCaseType(caseType: string): string {
  return caseType
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Build "Primary & Spouse" display name */
function getDisplayName(
  clientName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pi?: any
): string {
  if (pi?.partnerFirstName) {
    const primaryFirst = pi.firstName || clientName.split(" ")[0] || clientName;
    return `${primaryFirst} & ${pi.partnerFirstName}`;
  }
  return clientName;
}

function getWorkflowProgress(status: string): {
  currentStep: string;
  completedSteps: string[];
  progressPercent: number;
} {
  const steps = ["overview", "financial-interview", "analysis", "recommendations", "report"];
  const statusToStep: Record<string, string> = {
    draft: "overview",
    discovery: "financial-interview",
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

// ── Info row helper ──────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <div>
        <p className="text-muted-foreground mb-0.5 text-xs">{label}</p>
        <p className="text-sm">{value || "—"}</p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.caseId as string;

  const { data: caseData, isLoading, isError } = useCase(caseId);

  if (isLoading) return <FullPageLoader />;

  if (isError || !caseData) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6 sm:p-12">
        <p className="text-muted-foreground text-center">
          Unable to load this case. It may have been deleted or you may not have access.
        </p>
        <Button variant="outline" onClick={() => router.push("/cases")}>
          Back to Cases
        </Button>
      </div>
    );
  }

  const pi = caseData.clientPersonalInfo;
  const config = caseStatusConfig[caseData.status];
  const { currentStep, completedSteps, progressPercent } = getWorkflowProgress(caseData.status);
  const displayName = getDisplayName(caseData.clientName, pi);
  const clientAge = calculateAge(pi?.dateOfBirth);
  const spouseAge = calculateAge(pi?.partnerDateOfBirth);

  const addressParts = [
    pi?.address?.street,
    pi?.address?.city,
    pi?.address?.province,
    pi?.address?.postalCode,
    pi?.address?.country === "US"
      ? "USA"
      : pi?.address?.country === "CA"
        ? "Canada"
        : pi?.address?.country,
  ].filter(Boolean);
  const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : null;

  return (
    <div className="space-y-6 p-4 sm:space-y-8 sm:p-6">
      <PageHeader
        title={displayName}
        description={`Case ${caseData.caseNumber}`}
      >
        <Button variant="outline" size="sm" asChild>
          <Link href={`/cases/${caseData.id}/financial-interview`}>
            Start Interview
          </Link>
        </Button>
      </PageHeader>

      <CaseNav
        caseId={caseId}
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* ── Client Information ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-4" />
                Client Information
              </CardTitle>
              <CardDescription>Personal details for this case</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary client */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoRow
                  icon={User}
                  label="First Name"
                  value={pi?.firstName}
                />
                <InfoRow
                  icon={User}
                  label="Last Name"
                  value={pi?.lastName}
                />
                <InfoRow
                  icon={Cake}
                  label="Date of Birth"
                  value={
                    pi?.dateOfBirth
                      ? `${formatDate(pi.dateOfBirth)}${clientAge !== null ? ` (${clientAge} yrs)` : ""}`
                      : undefined
                  }
                />
                <InfoRow
                  icon={User}
                  label="Gender"
                  value={pi?.gender ? pi.gender.charAt(0).toUpperCase() + pi.gender.slice(1) : undefined}
                />
                <InfoRow
                  icon={Heart}
                  label="Marital Status"
                  value={pi?.maritalStatus ? pi.maritalStatus.charAt(0).toUpperCase() + pi.maritalStatus.slice(1) : undefined}
                />
                <InfoRow
                  icon={Users}
                  label="Dependents"
                  value={pi?.dependents !== undefined ? String(pi.dependents) : undefined}
                />
                <InfoRow icon={Mail} label="Email" value={caseData.clientEmail} />
                <InfoRow icon={Phone} label="Phone" value={caseData.clientPhone} />
                <InfoRow icon={MapPin} label="Address" value={fullAddress} />
              </div>

              {/* Spouse / Partner (if married) */}
              {pi?.partnerFirstName && (
                <>
                  <div className="border-t pt-4">
                    <p className="mb-3 text-sm font-medium text-muted-foreground">
                      Spouse / Partner
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <InfoRow
                        icon={User}
                        label="First Name"
                        value={pi.partnerFirstName}
                      />
                      <InfoRow
                        icon={User}
                        label="Last Name"
                        value={pi.partnerLastName}
                      />
                      <InfoRow
                        icon={Cake}
                        label="Date of Birth"
                        value={
                          pi.partnerDateOfBirth
                            ? `${formatDate(pi.partnerDateOfBirth)}${spouseAge !== null ? ` (${spouseAge} yrs)` : ""}`
                            : undefined
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Case Overview ── */}
          <Card>
            <CardHeader>
              <CardTitle>Case Overview</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">Status</p>
                  <StatusBadge status={caseData.status} />
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">Case Type</p>
                  <p className="text-sm">{formatCaseType(caseData.caseType)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">Meeting Date</p>
                  <p className="text-sm">
                    {caseData.meetingDate ? formatDate(caseData.meetingDate) : "Not scheduled"}
                  </p>
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

        {/* ── Right column: Progress + Quick Actions ── */}
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
              {(caseData.status === "draft" || caseData.status === "discovery") && (
                <Button className="w-full justify-start" asChild>
                  <Link href={`/cases/${caseId}/financial-interview`}>
                    <Search className="mr-2 size-4" />
                    Start Financial Interview
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
