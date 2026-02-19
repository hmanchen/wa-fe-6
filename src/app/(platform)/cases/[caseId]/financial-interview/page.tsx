"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  ArrowLeft,
  Pencil,
  User,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCase } from "@/hooks/use-cases";
import { useFinancialInterview, useFinancialHealthScore, useSaveFinancialBackground } from "@/hooks/use-financial-interview";
import { InterviewSectionNav } from "@/components/features/financial-interview/interview-section-nav";
import { FinancialBgLayout } from "@/components/features/financial-interview/financial-bg-layout";
import { IncomeReplacementScreen } from "@/components/features/financial-interview/income-replacement-screen";
import type { FinancialInterviewSection } from "@/types/financial-interview";
import type { PersonFinancialBackground } from "@/types/financial-interview";

// Lazy-load the annotation overlay since it's heavy (canvas-based)
const AnnotationOverlay = dynamic(
  () =>
    import(
      "@/components/features/financial-interview/annotation-overlay"
    ).then((m) => ({ default: m.AnnotationOverlay })),
  { ssr: false }
);

export default function FinancialInterviewPage() {
  const params = useParams();
  const caseId = params.caseId as string;
  const { data: caseData } = useCase(caseId);
  const { data: interviewData } = useFinancialInterview(caseId);
  const { data: healthScore } = useFinancialHealthScore(caseId);
  const saveBackground = useSaveFinancialBackground(caseId);

  // ── Section-level state ──────────────────────────────────
  const [currentSection, setCurrentSection] =
    useState<FinancialInterviewSection>("financial-background");
  const [completedSections, setCompletedSections] = useState<
    FinancialInterviewSection[]
  >([]);

  // ── Derived display name ────────────────────────────────
  const clientNames = (() => {
    const pi = caseData?.clientPersonalInfo;
    const primaryFirst = pi?.firstName || caseData?.clientName?.split(" ")[0] || "Client";
    const primaryLast = pi?.lastName || caseData?.clientName?.split(" ").slice(1).join(" ") || "";
    const spouseFirst = pi?.partnerFirstName;
    const spouseLast = pi?.partnerLastName;
    const primary = [primaryFirst, primaryLast].filter(Boolean).join(" ");
    const spouse = spouseFirst ? [spouseFirst, spouseLast].filter(Boolean).join(" ") : "";
    return spouse ? `${primary} & ${spouse}` : primary;
  })();

  // ── Annotation overlay ───────────────────────────────────
  const [annotationActive, setAnnotationActive] = useState(false);

  // ── Handlers ─────────────────────────────────────────────
  const handleSectionClick = useCallback(
    (section: FinancialInterviewSection) => {
      setCurrentSection(section);
    },
    []
  );

  const handlePrimarySave = useCallback(
    async (data: PersonFinancialBackground) => {
      try {
        await saveBackground.mutateAsync({ role: "primary", data });
        toast.success("Primary client financial background saved");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to save: ${message}`);
      }
    },
    [saveBackground]
  );

  const handleSpouseSave = useCallback(
    async (data: PersonFinancialBackground) => {
      try {
        await saveBackground.mutateAsync({ role: "spouse", data });
        toast.success("Spouse financial background saved");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to save: ${message}`);
      }
    },
    [saveBackground]
  );

  return (
    <>
      {/* Annotation overlay */}
      <AnnotationOverlay
        isActive={annotationActive}
        onClose={() => setAnnotationActive(false)}
      />

      <div className="flex flex-col gap-1 px-4 pt-0 pb-1 sm:px-6">
        {/* ── Header ── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/cases/${caseId}`}
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Overview</span>
            </Link>
            <div className="h-5 w-px bg-border" />
            <h1 className="text-lg font-semibold leading-tight">
              {clientNames} — Financial Interview
            </h1>
          </div>
          <Button
            variant={annotationActive ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => setAnnotationActive(!annotationActive)}
          >
            <Pencil className="size-3.5" />
            {annotationActive ? "Drawing..." : "Draw / Annotate"}
          </Button>
        </div>

        {/* ── Section navigation ── */}
        <InterviewSectionNav
          currentSection={currentSection}
          completedSections={completedSections}
          onSectionClick={handleSectionClick}
        />

        {/* ── Section content ── */}
        {currentSection === "financial-background" && (
          <Tabs defaultValue="primary" className="w-full">
            <TabsList className="mb-2 justify-start">
              <TabsTrigger value="primary" className="gap-1.5">
                <User className="size-3.5" />
                Primary Client
              </TabsTrigger>
              <TabsTrigger value="spouse" className="gap-1.5">
                <Users className="size-3.5" />
                Spouse
              </TabsTrigger>
            </TabsList>

            <TabsContent value="primary">
              <FinancialBgLayout
                clientNames={clientNames}
                defaultValues={interviewData?.primaryBackground}
                role="primary"
                healthScore={healthScore}
                onSubmit={handlePrimarySave}
                isSubmitting={saveBackground.isPending}
              />
            </TabsContent>

            <TabsContent value="spouse">
              <FinancialBgLayout
                clientNames={clientNames}
                defaultValues={interviewData?.spouseBackground}
                role="spouse"
                healthScore={healthScore}
                onSubmit={handleSpouseSave}
                isSubmitting={saveBackground.isPending}
              />
            </TabsContent>
          </Tabs>
        )}

        {/* ── Income Replacement Risk — full-width education ── */}
        {currentSection === "income-replacement-risk" && (
          <IncomeReplacementScreen
            onContinue={() => setCurrentSection("life-insurance-education")}
            onSkip={() => setCurrentSection("life-insurance-education")}
          />
        )}

        {/* Placeholder for other sections */}
        {currentSection === "life-insurance-education" && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="rounded-full bg-muted p-4">
              <Pencil className="size-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                Life Insurance & Will/Trust Education
              </h2>
              <p className="text-sm text-muted-foreground">
                This section will cover Term vs. Perm policies, IUL, and
                Will & Trust concepts. Coming next.
              </p>
            </div>
          </div>
        )}

        {currentSection === "financial-home" && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="rounded-full bg-muted p-4">
              <Pencil className="size-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Financial Home</h2>
              <p className="text-sm text-muted-foreground">
                Interactive Financial Home triangle diagram with levels for
                income, protection, goals, and wealth transfer. Coming soon.
              </p>
            </div>
          </div>
        )}

        {currentSection === "financial-x-curve" && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="rounded-full bg-muted p-4">
              <Pencil className="size-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Financial X Curve</h2>
              <p className="text-sm text-muted-foreground">
                DIME & FIME analysis with interactive X Curve diagram. Coming
                soon.
              </p>
            </div>
          </div>
        )}

        {currentSection === "tax-diversification" && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="rounded-full bg-muted p-4">
              <Pencil className="size-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Tax Diversification</h2>
              <p className="text-sm text-muted-foreground">
                Tax Later, Tax Advantage, Tax Now concepts with interactive
                triangle diagram. Coming soon.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
