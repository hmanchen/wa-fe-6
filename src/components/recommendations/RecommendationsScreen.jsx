import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import RecommendationsLoader from "./RecommendationsLoader";
import ExposureHeader from "./ExposureHeader";
import RecommendationCard from "./RecommendationCard";
import PhaseTwoSection from "./PhaseTwoSection";
import ActionBar from "./ActionBar";
import StretchOpportunityCard from "./StretchOpportunityCard";
import JoinTheTeamCard from "./JoinTheTeamCard";
import { recommendationsService } from "../../services/recommendationsService";

export default function RecommendationsScreen({
  caseId,
  caseData,
  onNavigateToDelivery,
  onContinue = undefined,
  onOpenIULIllustration,
  onOpenCollegeFunding,
  onOpenDebtFreedom,
  onOpenRetirementDiversification,
  initialData,
  onDataChange,
}) {
  const [status, setStatus] = useState(initialData ? "success" : "idle");
  const [data, setData] = useState(initialData || null);
  const [error, setError] = useState(null);

  const hasUsableRecommendations = (payload) =>
    Array.isArray(payload?.recommendations) && payload.recommendations.length > 0;

  const load = async () => {
    setStatus("loading");
    setError(null);
    try {
      let result = null;
      let lastPayload = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const raw = recommendationsService ? await recommendationsService.fetch(caseId) : null;
        const normalized = normalizeRecommendations(raw, caseData);
        lastPayload = normalized;
        if (hasUsableRecommendations(normalized)) {
          result = normalized;
          break;
        }
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
        }
      }
      const finalResult = result || lastPayload;
      setData(finalResult || null);
      if (onDataChange) onDataChange(finalResult || null);
      setStatus("success");
    } catch (e) {
      setError(e?.message || "Failed to generate recommendations");
      setStatus("error");
    }
  };

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setStatus("success");
    } else {
      setData(null);
      setStatus("idle");
    }
  }, [initialData, caseId]);

  if (status === "loading") {
    return (
      <RecommendationsLoader
        clientName={caseData?.client_name || caseData?.firstName || caseData?.first_name}
      />
    );
  }

  if (status === "idle") {
    return <BuildMyPlanLanding onBuild={load} />;
  }

  if (status === "error") {
    return (
      <div
        style={{
          minHeight: "100%",
          background: "#F8F7F4",
          padding: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #4A7C6F40",
            borderRadius: 16,
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            padding: "28px 32px",
            textAlign: "center",
            maxWidth: 560,
          }}
        >
          <AlertTriangle size={42} color="#4A7C6F" style={{ marginBottom: 12 }} />
          <h3 style={{ color: "#1B2B4B", fontSize: 22, marginBottom: 10 }}>
            We're just a moment away from your plan.
          </h3>
          <p style={{ color: "#4A5568", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
            Refresh once and we will continue building this personalized financial blueprint.
          </p>
          <button
            onClick={load}
            style={{
              background: "#4A7C6F",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(74,124,111,0.35)",
            }}
          >
            Build My Plan
          </button>
          {error && <p style={{ color: "#718096", fontSize: 12, marginTop: 10 }}>{error}</p>}
        </div>
      </div>
    );
  }

  const recs = data?.recommendations || [];
  const summary = data?.summary || {};
  const firstName = caseData?.firstName || caseData?.first_name || "";
  const handleContinue = onNavigateToDelivery || onContinue;
  const primaryRec = recs.find((r) => r.priorityRank === 1) || recs[0] || { monthly_cost: 1200 };
  const collegeRec =
    recs.find((r) => r.priorityRank === 2) ||
    recs.find((r) => r.category === "education") ||
    { monthly_cost: Math.max(Math.round((primaryRec?.monthly_cost || 1200) * 0.6), 400) };
  const primaryClientAge = toNum(
    caseData?.client_age ||
      caseData?.primary_client_age ||
      caseData?.age ||
      caseData?.primary_age ||
      caseData?.financial_background?.primary_age ||
      caseData?.financial_background?.client_age ||
      caseData?.employment_income?.primary_age ||
      summary?.primary_client_age ||
      null
  );

  const clientIsAdult = primaryClientAge === null || primaryClientAge >= 18;
  const hasNegativeNetWorth = (toNum(caseData?.net_worth) ?? toNum(caseData?.netWorth) ?? 0) < 0;
  const hasConstrainedCashFlow = (summary?.monthlyAvailable ?? 0) < 500;
  const hasNoSavings =
    (toNum(caseData?.total_savings) ?? toNum(caseData?.totalSavings) ?? 0) === 0 &&
    ((toNum(caseData?.net_worth) ?? toNum(caseData?.netWorth) ?? 0) < 10_000);
  const showJoinTeam = clientIsAdult && (hasNegativeNetWorth || hasConstrainedCashFlow || hasNoSavings);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "#F8F7F4", padding: "24px" }}>
      <div style={{ flex: 1, padding: "24px 0", overflowY: "auto" }}>
        <ExposureHeader summary={summary} recCount={recs.length} caseData={caseData} />
        {(summary?.hiddenMoney || 0) > 0 && (
          <div
            style={{
              background: "linear-gradient(135deg, #F0F7F4 0%, #E8F5F0 100%)",
              border: "1px solid #4A7C6F30",
              borderLeft: "4px solid #4A7C6F",
              borderRadius: 12,
              padding: "16px 24px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#4A7C6F", marginBottom: 4 }}>
                {"\uD83D\uDCA1"} How Your Plan Is Funded
              </div>
              <div style={{ fontSize: 13, color: "#2D5F52", lineHeight: 1.6 }}>
                Your analysis revealed <strong>${(summary.hiddenMoney || 0).toLocaleString()}/month</strong> in
                unallocated cash flow currently not working toward any goal. Every recommendation below is funded{" "}
                <em>directly from this recovered cash flow</em>, not from new money you need to find.
              </div>
            </div>
            <div
              style={{
                background: "#4A7C6F",
                color: "#fff",
                borderRadius: 10,
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 700,
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              ${(summary.hiddenMoney || 0).toLocaleString()}/mo
              <br />
              <span style={{ fontSize: 10, fontWeight: 400 }}>available to deploy</span>
            </div>
          </div>
        )}
        {summary?.monthlyAvailable < 500 &&
          summary?.totalMonthlyCommitment > summary?.monthlyAvailable && (
            <StretchOpportunityCard
              monthlyAvailable={summary.monthlyAvailable}
              totalNeeded={summary.totalMonthlyCommitment}
              firstName={firstName}
            />
          )}

        {recs.map((rec, i) => (
          <RecommendationCard
            key={rec.id || i}
            rec={rec}
            index={i}
            onOpenIUL={() => onOpenIULIllustration?.(primaryRec)}
            onOpenCollege={() => onOpenCollegeFunding?.(collegeRec)}
            onOpenDebt={() => onOpenDebtFreedom?.(rec)}
            onOpenRetirement={() => onOpenRetirementDiversification?.(rec)}
          />
        ))}

        {data?.phaseTwo?.length > 0 && <PhaseTwoSection items={data.phaseTwo} />}
        {showJoinTeam && (
          <JoinTheTeamCard
            clientName={firstName}
            advisorName="Hari"
            clientAge={primaryClientAge}
          />
        )}
      </div>

      <ActionBar
        totalCommitment={summary.totalMonthlyCommitment}
        monthlyAvailable={summary.monthlyAvailable}
        onContinue={handleContinue}
        onRegenerate={load}
        summary={summary}
        caseData={caseData}
      />
    </div>
  );
}

function BuildMyPlanLanding({ onBuild }) {
  const rings = useMemo(() => [0, 0, 0], []);
  return (
    <div
      style={{
        minHeight: "100%",
        background: "#F8F7F4",
        padding: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E8E4DC",
          borderLeft: "4px solid #4A7C6F",
          borderRadius: 16,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          padding: "40px 36px",
          textAlign: "center",
          maxWidth: 760,
          width: "100%",
        }}
      >
        <ProgressRings values={rings} />
        <div style={{ color: "#1B2B4B", fontSize: 20, fontWeight: 700, marginBottom: 14 }}>
          Ready to build your personalized plan
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
          {["\uD83D\uDEE1\uFE0F Protection Strategy", "\uD83D\uDCC8 Wealth Accumulation", "\uD83C\uDF93 Education Funding"].map((text) => (
            <span key={text} style={{ border: "1px solid #E8E4DC", borderRadius: 20, padding: "6px 14px", color: "#4A5568", fontSize: 12 }}>
              {text}
            </span>
          ))}
        </div>
        <button
          onClick={onBuild}
          style={{
            background: "#4A7C6F",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "14px 40px",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 16px rgba(74,124,111,0.3)",
            transition: "transform 150ms ease, filter 150ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = "brightness(0.9)";
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "none";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <Sparkles size={18} />
          Build My Financial Blueprint
        </button>
        <div style={{ color: "#718096", fontSize: 12, marginTop: 10, fontStyle: "italic" }}>
          This analysis typically takes 20-30 seconds
        </div>
      </div>
    </div>
  );
}

function ProgressRings({ values }) {
  const cx = 70;
  const cy = 70;
  const radii = [50, 37, 24];
  const colors = ["#1B2B4B", "#3B6CB7", "#4A7C6F"];
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" style={{ marginBottom: 10 }}>
      {radii.map((r, i) => (
        <circle key={`track-${r}`} cx={cx} cy={cy} r={r} fill="none" stroke="#E8E4DC" strokeWidth="8" />
      ))}
      {radii.map((r, i) => {
        const pct = values[i] || 0;
        const c = 2 * Math.PI * r;
        return (
          <circle
            key={`val-${r}`}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={colors[i]}
            strokeWidth="8"
            strokeDasharray={`${(pct / 100) * c} ${c}`}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

function normalizeRecommendations(result, caseData) {
  if (!result || typeof result !== "object") return result;
  const recs = Array.isArray(result.recommendations) ? [...result.recommendations] : [];
  const hasEducation = recs.some((r) => r?.category === "education");
  const maybeChildren =
    caseData?.clientPersonalInfo?.dependents ||
    caseData?.dependents ||
    0;

  const withoutStandaloneDisability = recs.filter((r) => {
    const title = String(r?.title || "").toLowerCase();
    return !(title.includes("disability") && r?.priorityRank === 2);
  });

  if (!hasEducation && maybeChildren > 0) {
    withoutStandaloneDisability.push({
      id: "REC-IUL-EDU",
      priorityRank: 2,
      category: "education",
      urgencyLevel: "high",
      title: "Fund Your Children's Education Through Your IUL",
      headline:
        "The same dollars that protect your family today pay for college tomorrow and retirement after that.",
      beforeAfterAfter:
        "Your children have a funded education path starting today with full flexibility.",
      gapSolvedLabel: `Education Funding Gap - $0 saved for ${maybeChildren} children`,
      gapSolved: 0,
      monthly_cost: 0,
      fundedFromRecoveredCashFlow: true,
      keyStatistic:
        "A 529 locks funds to education only. IUL adds protection, flexibility, and long-term income options.",
      iulLinkText: "See Your Children's Education Projection ->",
      hasIULLink: true,
    });
  }

  const hiddenMoney =
    toNum(result?.summary?.hidden_money_monthly) ||
    toNum(result?.summary?.hiddenMoneyMonthly) ||
    toNum(result?.summary?.hiddenMoney) ||
    toNum(caseData?.hidden_money_total) ||
    toNum(caseData?.hiddenMoneyTotal) ||
    0;

  const prioritized = withoutStandaloneDisability;
  prioritized.sort((a, b) => (a?.priorityRank || 99) - (b?.priorityRank || 99));
  return {
    ...result,
    summary: {
      ...(result.summary || {}),
      hiddenMoney,
    },
    recommendations: prioritized,
  };
}

function toNum(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}
