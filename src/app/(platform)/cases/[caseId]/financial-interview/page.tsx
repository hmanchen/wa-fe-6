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
import {
  useFinancialInterview,
  useFinancialHealthScore,
  useSaveFinancialBackground,
  useGoalsDiscovery,
  useSaveGoalsDiscovery,
  useCompleteDiscoveryStep,
  useContributionLimits,
  useMarketSnapshot,
} from "@/hooks/use-financial-interview";
import { InterviewSectionNav } from "@/components/features/financial-interview/interview-section-nav";
import { FinancialBgLayout } from "@/components/features/financial-interview/financial-bg-layout";
import { GoalsDiscoveryScreen } from "@/components/features/financial-interview/goals-discovery-screen";
import { IncomeReplacementScreen } from "@/components/features/financial-interview/income-replacement-screen";
import { ProtectionEstateScreen } from "@/components/features/financial-interview/protection-estate-screen";
import { FinancialBgInsights } from "@/components/features/financial-interview/financial-bg-insights";
import FinancialFreedomEngine from "@/components/analysis/FinancialFreedomEngine";
import { FinancialHomeScreen } from "@/components/features/financial-interview/financial-home-screen";
import { FinancialHomePyramid } from "@/components/features/financial-interview/financial-home-pyramid/FinancialHomePyramid";
import { XCurveScreen } from "@/components/features/financial-interview/xcurve-screen";
import RecommendationsScreen from "@/components/recommendations/RecommendationsScreen";
import IULIllustrationScreen from "@/components/recommendations/IULIllustrationScreen";
import CollegeFundingScreen from "@/components/recommendations/CollegeFundingScreen";
import DebtFreedomScreen from "@/components/recommendations/DebtFreedomScreen";
import RetirementDiversificationScreen from "@/components/recommendations/RetirementDiversificationScreen";
import { DeliveryScreen } from "@/components/features/financial-interview/delivery-screen";
import { ScreenLoadingOverlay } from "@/components/shared/screen-loading-overlay";
import type { FinancialInterviewSection } from "@/types/financial-interview";
import type { PersonFinancialBackground } from "@/types/financial-interview";
import type { GoalsDiscoveryData } from "@/types/financial-interview";
import { useFullAnalysisData, useXCurveData } from "@/hooks/use-presentation-flow";

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
  const { data: caseData, isLoading: isCaseLoading } = useCase(caseId);
  const { data: interviewData, isLoading: isInterviewLoading } = useFinancialInterview(caseId);
  const { data: healthScore, isLoading: isHealthScoreLoading } = useFinancialHealthScore(caseId);
  const saveBackground = useSaveFinancialBackground(caseId);
  const { data: goalsDiscoveryData, isLoading: isGoalsDiscoveryLoading } = useGoalsDiscovery(caseId);
  const saveGoalsDiscovery = useSaveGoalsDiscovery(caseId);
  const completeStep = useCompleteDiscoveryStep(caseId);
  const { data: contributionLimits, isLoading: isContributionLimitsLoading } = useContributionLimits(new Date().getFullYear());

  // ── Section-level state ──────────────────────────────────
  const [currentSection, setCurrentSection] =
    useState<FinancialInterviewSection>("financial-background");
  const [completedSections, setCompletedSections] = useState<
    FinancialInterviewSection[]
  >([]);
  const [recommendationsCache, setRecommendationsCache] = useState<Record<string, unknown> | null>(null);
  const [iulRecommendation, setIulRecommendation] = useState<Record<string, unknown>>({ monthly_cost: 1200 });
  const [collegeRecommendation, setCollegeRecommendation] = useState<Record<string, unknown>>({ monthly_cost: 800 });

  const { data: marketSnapshot, isLoading: isMarketSnapshotLoading } = useMarketSnapshot(currentSection === "financial-background");
  const retirementTargetAge = Number(
    healthScore?.goalSummary?.retirementTargetAge ??
      healthScore?.goalSummary?.retirement_target_age ??
      65
  );
  const { data: xcurveData } = useXCurveData(
    caseId,
    retirementTargetAge,
    currentSection === "financial-x-curve"
  );
  const shouldLoadFullAnalysis =
    currentSection === "analysis-dashboard" ||
    currentSection === "financial-home" ||
    currentSection === "financial-home-pyramid" ||
    currentSection === "financial-x-curve" ||
    currentSection === "recommendations" ||
    currentSection === "iul-illustration" ||
    currentSection === "college-funding" ||
    currentSection === "debt-freedom" ||
    currentSection === "retirement-diversification" ||
    currentSection === "delivery";
  const { data: fullAnalysisData } = useFullAnalysisData(
    caseId,
    caseData?.clientPersonalInfo?.address?.province || "unknown",
    shouldLoadFullAnalysis
  );

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

  const clientAge = (() => {
    const dob = caseData?.clientPersonalInfo?.dateOfBirth;
    if (!dob) return undefined;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  })();

  const spouseAge = (() => {
    const dob = caseData?.clientPersonalInfo?.partnerDateOfBirth;
    if (!dob) return undefined;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  })();

  const spouseName = (() => {
    const pi = caseData?.clientPersonalInfo;
    if (!pi?.partnerFirstName) return undefined;
    return [pi.partnerFirstName, pi.partnerLastName].filter(Boolean).join(" ");
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
      await saveBackground.mutateAsync({ role: "primary", data });
      toast.success("Primary client financial background saved");
    },
    [saveBackground]
  );

  const handleSpouseSave = useCallback(
    async (data: PersonFinancialBackground) => {
      await saveBackground.mutateAsync({ role: "spouse", data });
      toast.success("Spouse financial background saved");
    },
    [saveBackground]
  );

  const isCurrentSectionLoading = (() => {
    if (currentSection === "financial-background") {
      return (
        isCaseLoading ||
        isInterviewLoading ||
        isHealthScoreLoading ||
        isContributionLimitsLoading ||
        isMarketSnapshotLoading
      );
    }
    if (currentSection === "goals-discovery") {
      return isCaseLoading || isInterviewLoading || isGoalsDiscoveryLoading;
    }
    if (currentSection === "protection-estate") {
      return isCaseLoading || isInterviewLoading;
    }
    if (currentSection === "analysis-dashboard") {
      return isCaseLoading || isHealthScoreLoading || isInterviewLoading;
    }
    return false;
  })();

  const handleGoalsDiscoverySave = useCallback(
    async (data: Partial<GoalsDiscoveryData>) => {
      try {
        await saveGoalsDiscovery.mutateAsync(data);
        toast.success("Goals & Discovery saved", {
          id: "goals-discovery-save",
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to save Goals & Discovery";
        toast.error(message, { id: "goals-discovery-save" });
        throw err;
      }
    },
    [saveGoalsDiscovery]
  );

  const handleGoalsDiscoveryNext = useCallback(async () => {
    try {
      await completeStep.mutateAsync("goals-priorities");
      toast.success("Goals & Discovery step completed");
      setCurrentSection("income-replacement-risk");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to complete Goals & Discovery step";
      toast.error(message);
      throw err;
    }
  }, [completeStep]);

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
          <div className="relative">
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
                caseId={caseId}
                defaultValues={interviewData?.primaryBackground}
                role="primary"
                caseData={caseData}
                healthScore={healthScore}
                contributionLimits={contributionLimits}
                marketSnapshot={marketSnapshot}
                clientAge={clientAge}
                onSubmit={handlePrimarySave}
                isSubmitting={saveBackground.isPending}
                onComplete={() => setCurrentSection("goals-discovery")}
              />
            </TabsContent>

            <TabsContent value="spouse">
              <FinancialBgLayout
                clientNames={clientNames}
                caseId={caseId}
                defaultValues={interviewData?.spouseBackground}
                role="spouse"
                caseData={caseData}
                healthScore={healthScore}
                contributionLimits={contributionLimits}
                marketSnapshot={marketSnapshot}
                clientAge={clientAge}
                onSubmit={handleSpouseSave}
                isSubmitting={saveBackground.isPending}
                onComplete={() => setCurrentSection("goals-discovery")}
              />
            </TabsContent>
            </Tabs>
            {isCurrentSectionLoading && (
              <ScreenLoadingOverlay message="Loading Financial Background..." />
            )}
          </div>
        )}

        {/* ── PHASE 2B: Goals & Discovery ── */}
        {currentSection === "goals-discovery" && (
          <div className="relative">
            <GoalsDiscoveryScreen
              defaultValues={goalsDiscoveryData}
              primaryBackground={interviewData?.primaryBackground}
              primaryName={caseData?.clientPersonalInfo?.firstName || "Primary earner"}
              spouseName={spouseName}
              primaryAge={clientAge}
              spouseAge={spouseAge}
              onSave={handleGoalsDiscoverySave}
              isSaving={saveGoalsDiscovery.isPending}
              onBack={() => setCurrentSection("financial-background")}
              onNext={handleGoalsDiscoveryNext}
            />
            {isCurrentSectionLoading && (
              <ScreenLoadingOverlay message="Loading Goals & Discovery..." />
            )}
          </div>
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
          <div className="relative">
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
                caseId={caseId}
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
                caseId={caseId}
                defaultValues={interviewData?.spouseBackground}
                role="spouse"
                onSubmit={handleSpouseSave}
                isSubmitting={saveBackground.isPending}
                onContinue={() => setCurrentSection("analysis-dashboard")}
              />
            </TabsContent>
            </Tabs>
            {isCurrentSectionLoading && (
              <ScreenLoadingOverlay message="Loading Protection & Estate..." />
            )}
          </div>
        )}

        {/* ── PHASE 4: Analysis Dashboard ── */}
        {currentSection === "analysis-dashboard" && (
          <div className="relative rounded-xl border">
            <div className="flex items-center gap-3 rounded-t-xl border-b bg-muted/30 px-4 py-2.5">
              <h2 className="text-base font-bold">Analysis Dashboard</h2>
              <span className="rounded-full border bg-background px-3 py-0.5 text-xs font-medium">
                {clientNames}
              </span>
              <span className="text-xs text-muted-foreground">Full Health Score (0–100, all 5 categories)</span>
            </div>
            <div className="p-4 pb-0">
              <FinancialFreedomEngine
                fullAnalysis={fullAnalysisData}
                healthScore={healthScore}
                caseData={caseData}
                interviewData={interviewData}
              />
            </div>
            <FinancialBgInsights
              caseId={caseId}
              healthScore={healthScore}
              clientState={caseData?.clientPersonalInfo?.address?.province}
              fullAnalysisData={fullAnalysisData}
              disableAutoRefresh
              onContinue={() => setCurrentSection("financial-home")}
              isSubmitting={false}
            />
            {isCurrentSectionLoading && (
              <ScreenLoadingOverlay message="Loading Analysis Dashboard..." />
            )}
          </div>
        )}

        {/* ── PHASE 5: Financial Home ── */}
        {currentSection === "financial-home" && (
          <FinancialHomeScreen
            caseId={caseId}
            onContinue={() => setCurrentSection("financial-home-pyramid")}
          />
        )}

        {/* ── PHASE 6: Financial Home Pyramid ── */}
        {currentSection === "financial-home-pyramid" && (
          <FinancialHomePyramid
            caseData={caseData}
            healthScore={healthScore}
            fullAnalysis={fullAnalysisData}
            onContinue={() => setCurrentSection("financial-x-curve")}
          />
        )}

        {/* ── PHASE 7: Financial X Curve ── */}
        {currentSection === "financial-x-curve" && (
          <XCurveScreen
            caseId={caseId}
            caseData={caseData}
            healthScore={healthScore}
            fullAnalysis={fullAnalysisData}
            xcurveData={xcurveData}
            onContinue={() => setCurrentSection("recommendations")}
          />
        )}

        {/* ── PHASE 8: Recommendations ── */}
        {currentSection === "recommendations" && (
          <RecommendationsScreen
            caseId={caseId}
            caseData={caseData}
            onNavigateToDelivery={() => setCurrentSection("delivery")}
            onOpenIULIllustration={(rec: unknown) => {
              setIulRecommendation((rec as Record<string, unknown>) || { monthly_cost: 1200 });
              setCurrentSection("iul-illustration");
            }}
            onOpenCollegeFunding={(rec: unknown) => {
              setCollegeRecommendation((rec as Record<string, unknown>) || { monthly_cost: 800 });
              setCurrentSection("college-funding");
            }}
            onOpenDebtFreedom={(_rec: unknown) => {
              setCurrentSection("debt-freedom");
            }}
            onOpenRetirementDiversification={(_rec: unknown) => {
              setCurrentSection("retirement-diversification");
            }}
            initialData={recommendationsCache}
            onDataChange={setRecommendationsCache}
          />
        )}

        {currentSection === "iul-illustration" && (
          <IULIllustrationScreen
            caseId={caseId}
            caseData={caseData}
            recommendation={iulRecommendation}
            onBack={() => setCurrentSection("recommendations")}
          />
        )}

        {currentSection === "college-funding" && (
          <CollegeFundingScreen
            caseId={caseId}
            caseData={caseData}
            recommendation={collegeRecommendation}
            rec={collegeRecommendation}
            onBack={() => setCurrentSection("recommendations")}
          />
        )}

        {currentSection === "debt-freedom" && (
          <DebtFreedomScreen
            caseId={caseId}
            caseData={caseData}
            onBack={() => setCurrentSection("recommendations")}
          />
        )}

        {currentSection === "retirement-diversification" && (
          <RetirementDiversificationScreen
            caseId={caseId}
            caseData={caseData}
            onBack={() => setCurrentSection("recommendations")}
          />
        )}

        {/* ── PHASE 9: Delivery ── */}
        {currentSection === "delivery" && (
          <DeliveryScreen caseId={caseId} clientNames={clientNames} />
        )}
      </div>
    </>
  );
}
