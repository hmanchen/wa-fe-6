"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCase } from "@/hooks/use-cases";
import { useUpdateCase } from "@/hooks/use-cases";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  XCurveScreen,
  computeXCurveCrossingAgeForDashboard,
} from "@/components/features/financial-interview/xcurve-screen";
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
import { recordCaseConsent } from "@/lib/api/cases";

function computeRiskSnapshot(
  riskProfile?: {
    riskTolerance?: string;
    timeHorizon?: string;
    marketLossReaction?: string;
    downturnActionTaken?: string;
    marketExperience?: string[];
  }
): { score: number; profile: string } | null {
  if (!riskProfile) return null;
  const tolerance = {
    conservative: 1,
    moderate: 2,
    growth: 3,
    aggressive: 4,
  }[String(riskProfile.riskTolerance || "").toLowerCase()] ?? 1;
  const horizon = {
    short_term: 1,
    medium_term: 2,
    long_term: 4,
  }[String(riskProfile.timeHorizon || "").toLowerCase()] ?? 1;
  const reaction = {
    sell_everything: 1,
    sell_some: 2,
    hold_steady: 3,
    buy_more: 4,
  }[String(riskProfile.marketLossReaction || "").toLowerCase()] ?? 1;
  const downturn = {
    sell_everything: 1,
    sell_some: 2,
    hold_steady: 3,
    buy_more: 4,
  }[String(riskProfile.downturnActionTaken || "").toLowerCase()] ?? 1;
  const experienceKey = String((riskProfile.marketExperience || [])[0] || "").toLowerCase();
  const experience = {
    no_major_downturn: 1,
    "2022_tech_crypto_crash": 2,
    "2020_covid_crash": 3,
    "2008_financial_crisis": 4,
  }[experienceKey] ?? 1;

  const score = tolerance + horizon + reaction + downturn + experience;
  const profile =
    score <= 8
      ? "Conservative"
      : score <= 12
        ? "Moderate"
        : score <= 16
          ? "Growth"
          : "Aggressive";
  return { score, profile };
}

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
  const queryClient = useQueryClient();
  const updateCase = useUpdateCase();
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
  const [financialBgTab, setFinancialBgTab] = useState<"primary" | "spouse">("primary");
  const [completedSections, setCompletedSections] = useState<
    FinancialInterviewSection[]
  >([]);
  const [recommendationsCache, setRecommendationsCache] = useState<Record<string, unknown> | null>(null);
  const [iulRecommendation, setIulRecommendation] = useState<Record<string, unknown>>({ monthly_cost: 1200 });
  const [collegeRecommendation, setCollegeRecommendation] = useState<Record<string, unknown>>({ monthly_cost: 800 });
  const [consentPurposeChecked, setConsentPurposeChecked] = useState(false);
  const [consentPrivacyChecked, setConsentPrivacyChecked] = useState(false);
  const [consentEducationChecked, setConsentEducationChecked] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [consentSubmitting, setConsentSubmitting] = useState(false);
  const [consentSessionGiven, setConsentSessionGiven] = useState(false);
  const [spousePromptOpen, setSpousePromptOpen] = useState(false);
  const pipelinePromotedCase = useRef<string | null>(null);

  const { data: marketSnapshot, isLoading: isMarketSnapshotLoading } = useMarketSnapshot(currentSection === "financial-background");
  const retirementTargetAge = Number(
    healthScore?.goalSummary?.retirementTargetAge ??
      healthScore?.goalSummary?.retirement_target_age ??
      65
  );
  const { data: xcurveData } = useXCurveData(
    caseId,
    retirementTargetAge,
    currentSection === "analysis-dashboard" || currentSection === "financial-x-curve"
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
  const dashboardCrossingAge = useMemo(
    () =>
      computeXCurveCrossingAgeForDashboard(
        caseData,
        healthScore,
        fullAnalysisData,
        xcurveData
      ),
    [caseData, healthScore, fullAnalysisData, xcurveData]
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
  const [annotationLauncherOpen, setAnnotationLauncherOpen] = useState(false);

  // ── Collapse header + section nav to reclaim vertical space ──
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  // ── Handlers ─────────────────────────────────────────────
  const handleSectionClick = useCallback(
    (section: FinancialInterviewSection) => {
      setCurrentSection(section);
    },
    []
  );

  const spouseBackgroundComplete = Boolean(
    interviewData?.spouseBackground &&
      Object.values(interviewData.spouseBackground).some((value) => {
        if (value == null) return false;
        if (typeof value === "string") return value.trim().length > 0;
        if (typeof value === "number") return value > 0;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === "object")
          return Object.keys(value as Record<string, unknown>).length > 0;
        return false;
      })
  );

  const handlePrimarySave = useCallback(
    async (data: PersonFinancialBackground) => {
      await saveBackground.mutateAsync({ role: "primary", data });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["full-analysis", caseId] }),
        queryClient.invalidateQueries({ queryKey: ["xcurve-data", caseId] }),
        queryClient.invalidateQueries({ queryKey: ["financial-health-score", caseId] }),
      ]);
      if (caseData?.id && caseData?.status === "draft") {
        await updateCase.mutateAsync({
          id: caseData.id,
          data: { status: "discovery" },
        });
      }
      toast.success("Primary client financial background saved");
      const hasSpouseName = Boolean(caseData?.clientPersonalInfo?.partnerFirstName);
      if (hasSpouseName && !spouseBackgroundComplete) {
        setSpousePromptOpen(true);
      }
    },
    [
      saveBackground,
      caseData?.id,
      caseData?.status,
      caseData?.clientPersonalInfo?.partnerFirstName,
      spouseBackgroundComplete,
      queryClient,
      caseId,
      updateCase,
    ]
  );

  const handleSpouseSave = useCallback(
    async (data: PersonFinancialBackground) => {
      await saveBackground.mutateAsync({ role: "spouse", data });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["full-analysis", caseId] }),
        queryClient.invalidateQueries({ queryKey: ["xcurve-data", caseId] }),
        queryClient.invalidateQueries({ queryKey: ["financial-health-score", caseId] }),
      ]);
      toast.success("Spouse financial background saved");
      setSpousePromptOpen(false);
    },
    [saveBackground, queryClient, caseId]
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
  const consentRequired = Boolean(caseData) && !Boolean(caseData?.consentAcknowledgedAt || consentSessionGiven);
  useEffect(() => {
    setCurrentSection("financial-background");
    setFinancialBgTab("primary");
    setCompletedSections([]);
    setRecommendationsCache(null);
    setIulRecommendation({ monthly_cost: 1200 });
    setCollegeRecommendation({ monthly_cost: 800 });
    setConsentPurposeChecked(false);
    setConsentPrivacyChecked(false);
    setConsentEducationChecked(false);
    setConsentError(null);
    setConsentSubmitting(false);
    setConsentSessionGiven(false);
    setSpousePromptOpen(false);
    pipelinePromotedCase.current = null;

    queryClient.removeQueries({ queryKey: ["full-analysis"] });
    queryClient.removeQueries({ queryKey: ["xcurve-data"] });
    queryClient.removeQueries({ queryKey: ["financial-health-score"] });
    queryClient.removeQueries({ queryKey: ["financial-interview"] });
    queryClient.removeQueries({ queryKey: ["goals-discovery"] });
    queryClient.removeQueries({ queryKey: ["ai-financial-home"] });
  }, [caseId, queryClient]);
  useEffect(() => {
    if (!caseData?.id || caseData.status !== "draft") return;
    if (pipelinePromotedCase.current === caseData.id) return;
    pipelinePromotedCase.current = caseData.id;
    updateCase
      .mutateAsync({
        id: caseData.id,
        data: { status: "discovery" },
      })
      .catch(() => {
        // Non-blocking UX: interview should remain usable even if status update fails.
      });
  }, [caseData?.id, caseData?.status, updateCase]);
  useEffect(() => {
    setConsentSessionGiven(Boolean(caseData?.consentAcknowledgedAt));
  }, [caseData?.consentAcknowledgedAt]);
  const caseIdForUpdate = caseData?.id;

  const handleGoalsDiscoverySave = useCallback(
    async (data: Partial<GoalsDiscoveryData>) => {
      try {
        await saveGoalsDiscovery.mutateAsync(data);
        const snapshot = computeRiskSnapshot(data?.riskProfile);
        if (snapshot && caseIdForUpdate) {
          await updateCase.mutateAsync({
            id: caseIdForUpdate,
            data: {
              riskScore: snapshot.score,
              riskProfile: snapshot.profile,
            },
          });
        }
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
    [saveGoalsDiscovery, caseIdForUpdate, updateCase]
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
  const handleConsentAccept = async () => {
    if (!caseData?.id || !consentPurposeChecked || !consentPrivacyChecked || !consentEducationChecked) {
      setConsentError("Please acknowledge all required consent disclosures to continue.");
      return;
    }
    setConsentError(null);
    setConsentSubmitting(true);
    try {
      await recordCaseConsent(caseData.id, {
        version: "1.0",
        acknowledgments: [
          "purpose_acknowledged",
          "privacy_acknowledged",
          "educational_acknowledged",
        ],
      });
      setConsentSessionGiven(true);
      await queryClient.invalidateQueries({ queryKey: ["cases", caseData.id] });
      toast.success("Consent recorded.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to record consent.";
      setConsentError(message);
    } finally {
      setConsentSubmitting(false);
    }
  };

  return (
    <>
      {/* Annotation overlay */}
      <AnnotationOverlay
        isActive={annotationActive}
        onClose={() => setAnnotationActive(false)}
      />

      {/* Floating annotation launcher */}
      <div className="fixed right-3 top-1/2 z-[70] -translate-y-1/2">
        {annotationLauncherOpen ? (
          <div className="flex items-center gap-2 rounded-2xl border bg-background/95 p-2 shadow-lg backdrop-blur-sm">
            <Button
              size="sm"
              variant={annotationActive ? "default" : "outline"}
              className="gap-1.5"
              onClick={() => setAnnotationActive((v) => !v)}
            >
              <Pencil className="size-3.5" />
              {annotationActive ? "Stop Annotation" : "Draw / Annotate"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs"
              onClick={() => setAnnotationLauncherOpen(false)}
              title="Hide annotation launcher"
            >
              Hide
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAnnotationLauncherOpen(true)}
            className="relative flex items-center gap-1 rounded-full border bg-background/95 px-3 py-2 text-xs font-medium shadow-lg backdrop-blur-sm transition hover:bg-muted"
            title="Show annotation tools"
          >
            <Pencil className="size-3.5" />
            Annotate
            <span
              className={`absolute -right-0.5 -top-0.5 size-2 rounded-full ${
                annotationActive ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
          </button>
        )}
      </div>

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
            </div>
            <div className="rounded-md border border-blue-200 bg-blue-50/60 px-3 py-2 text-[11px] text-blue-800">
              Confidentiality Notice: Client information in this interview is private and intended only for advisory planning purposes.
            </div>
            {spousePromptOpen && spouseName && (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <strong>Complete {spouseName}&apos;s profile</strong> for a comprehensive joint analysis.
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSection("financial-background");
                    setFinancialBgTab("spouse");
                  }}
                  className="ml-1 underline decoration-amber-700 underline-offset-2"
                >
                  Add {caseData?.clientPersonalInfo?.partnerFirstName || "Spouse"}&apos;s Details →
                </button>
              </div>
            )}

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

        <div key={caseId} className={consentRequired ? "pointer-events-none opacity-40" : ""}>
        {/* ── PHASE 2: Financial Background ── */}
        {currentSection === "financial-background" && (
          <div className="relative">
            <Tabs value={financialBgTab} onValueChange={(v) => setFinancialBgTab(v as "primary" | "spouse")} className="w-full">
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
                xcurveData={xcurveData}
                crossingPointAge={dashboardCrossingAge}
                healthScore={healthScore}
                caseData={caseData}
                interviewData={interviewData}
                onNavigate={() => setCurrentSection("financial-x-curve")}
              />
            </div>
            <FinancialBgInsights
              caseId={caseId}
              healthScore={healthScore}
              caseData={caseData}
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
            onOpenDebtFreedom={() => {
              setCurrentSection("debt-freedom");
            }}
            onOpenRetirementDiversification={() => {
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
          <div className="space-y-3">
            <Button variant="outline" size="sm" onClick={() => setCurrentSection("recommendations")}>
              Back to Recommendations
            </Button>
            <DeliveryScreen caseId={caseId} clientNames={clientNames} />
          </div>
        )}
        </div>
        {consentRequired && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-2xl rounded-xl border bg-card p-6 shadow-xl">
              <h2 className="text-lg font-semibold">Client Consent Required</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Confirm client consent before collecting financial interview data.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Version: v1.0. Consent capture stores advisor ID and timestamp for privacy disclosure audit.
              </p>
              <label className="mt-4 flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={consentPurposeChecked}
                  onChange={(e) => setConsentPurposeChecked(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  I acknowledge the purpose of data collection for financial planning analysis and report delivery.
                </span>
              </label>
              <label className="mt-2 flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={consentPrivacyChecked}
                  onChange={(e) => setConsentPrivacyChecked(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  I acknowledge the client privacy policy and confidentiality notice.
                </span>
              </label>
              <label className="mt-2 flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={consentEducationChecked}
                  onChange={(e) => setConsentEducationChecked(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  I acknowledge this platform is educational and planning support, not individualized investment advice.
                </span>
              </label>
              {consentError && <p className="mt-2 text-sm text-destructive">{consentError}</p>}
              <Button
                className="mt-4"
                onClick={handleConsentAccept}
                disabled={
                  !consentPurposeChecked ||
                  !consentPrivacyChecked ||
                  !consentEducationChecked ||
                  consentSubmitting
                }
              >
                {consentSubmitting ? "Saving..." : "Record Consent and Continue"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
