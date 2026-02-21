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
  PanelTopClose,
  PanelTopOpen,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCase } from "@/hooks/use-cases";
import { useFinancialInterview, useFinancialHealthScore, useSaveFinancialBackground } from "@/hooks/use-financial-interview";
import { InterviewSectionNav } from "@/components/features/financial-interview/interview-section-nav";
import { FinancialBgLayout } from "@/components/features/financial-interview/financial-bg-layout";
import { IncomeReplacementScreen } from "@/components/features/financial-interview/income-replacement-screen";
import { ProtectionEstateScreen } from "@/components/features/financial-interview/protection-estate-screen";
import { FinancialBgInsights } from "@/components/features/financial-interview/financial-bg-insights";
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

  // ── Collapse header + section nav to reclaim vertical space ──
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

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
        {/* ── Collapsible header + section nav ── */}
        {!headerCollapsed && (
          <>
            {/* Header */}
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

            {/* Section navigation */}
            <InterviewSectionNav
              currentSection={currentSection}
              completedSections={completedSections}
              onSectionClick={handleSectionClick}
            />
          </>
        )}

        {/* Toggle button — always visible */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={() => setHeaderCollapsed((prev) => !prev)}
          >
            {headerCollapsed ? (
              <>
                <PanelTopOpen className="size-3.5" />
                Show Navigation
              </>
            ) : (
              <>
                <PanelTopClose className="size-3.5" />
                Hide Navigation
              </>
            )}
          </Button>
          {headerCollapsed && (
            <span className="text-xs text-muted-foreground">
              {clientNames} — <span className="font-medium text-foreground">{currentSection.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
            </span>
          )}
        </div>

        {/* ── PHASE 2: Financial Background ── */}
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

        {/* ── Income Replacement Risk — educational interlude ── */}
        {currentSection === "income-replacement-risk" && (
          <IncomeReplacementScreen
            onContinue={() => setCurrentSection("protection-estate")}
            onSkip={() => setCurrentSection("protection-estate")}
          />
        )}

        {/* ── PHASE 3: Protection & Estate ── */}
        {currentSection === "protection-estate" && (
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
              <ProtectionEstateScreen
                clientNames={clientNames}
                defaultValues={interviewData?.primaryBackground}
                role="primary"
                onSubmit={handlePrimarySave}
                isSubmitting={saveBackground.isPending}
                onContinue={() => setCurrentSection("analysis-dashboard")}
              />
            </TabsContent>

            <TabsContent value="spouse">
              <ProtectionEstateScreen
                clientNames={clientNames}
                defaultValues={interviewData?.spouseBackground}
                role="spouse"
                onSubmit={handleSpouseSave}
                isSubmitting={saveBackground.isPending}
                onContinue={() => setCurrentSection("analysis-dashboard")}
              />
            </TabsContent>
          </Tabs>
        )}

        {/* ── PHASE 4: Analysis Dashboard ── */}
        {currentSection === "analysis-dashboard" && (
          <div className="rounded-xl border">
            <div className="flex items-center gap-3 rounded-t-xl border-b bg-muted/30 px-4 py-2.5">
              <h2 className="text-base font-bold">Analysis Dashboard</h2>
              <span className="rounded-full border bg-background px-3 py-0.5 text-xs font-medium">
                {clientNames}
              </span>
              <span className="text-xs text-muted-foreground">Full Health Score (0–100, all 5 categories)</span>
            </div>
            <FinancialBgInsights
              healthScore={healthScore}
              onContinue={() => setCurrentSection("financial-home")}
              isSubmitting={false}
            />
          </div>
        )}

        {/* ── PHASE 5: Financial Home ── */}
        {currentSection === "financial-home" && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Pencil className="size-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Financial Home</h2>
              <p className="text-sm text-muted-foreground">
                AI-powered narratives: Background Summary, Health Narrative,
                Protection Gaps, Estate Urgency, and Background Gaps.
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">Coming soon — Phase 5</p>
            </div>
            <Button size="sm" onClick={() => setCurrentSection("financial-x-curve")} className="gap-1.5">
              Continue to X Curve <ChevronRight className="size-3.5" />
            </Button>
          </div>
        )}

        {/* ── PHASE 6: Financial X Curve ── */}
        {currentSection === "financial-x-curve" && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Pencil className="size-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Financial X Curve</h2>
              <p className="text-sm text-muted-foreground">
                X-Curve Visualization, AI Narration, and Tax Narrative.
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">Coming soon — Phase 6</p>
            </div>
            <Button size="sm" onClick={() => setCurrentSection("recommendations")} className="gap-1.5">
              Continue to Recommendations <ChevronRight className="size-3.5" />
            </Button>
          </div>
        )}

        {/* ── PHASE 7: Recommendations ── */}
        {currentSection === "recommendations" && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Pencil className="size-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Recommendations</h2>
              <p className="text-sm text-muted-foreground">
                AI Recommendations (3 tiers), Projections (IUL, 529, 401k comparison),
                and Product Recommendations.
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">Coming soon — Phase 7</p>
            </div>
            <Button size="sm" onClick={() => setCurrentSection("delivery")} className="gap-1.5">
              Continue to Delivery <ChevronRight className="size-3.5" />
            </Button>
          </div>
        )}

        {/* ── PHASE 8: Delivery ── */}
        {currentSection === "delivery" && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Pencil className="size-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Delivery</h2>
              <p className="text-sm text-muted-foreground">
                Generate PDF / Presentation for client delivery.
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">Coming soon — Phase 8</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
