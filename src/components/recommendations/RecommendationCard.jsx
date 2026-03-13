import { useState } from "react";
import {
  Shield,
  TrendingUp,
  GraduationCap,
  FileText,
  CreditCard,
  Lightbulb,
  Clock,
} from "lucide-react";

const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : "0");
const fmtUSD = (n) => "$" + fmt(n);

const CAT_ICONS = {
  protection: Shield,
  retirement: TrendingUp,
  education: GraduationCap,
  estate: FileText,
  debt: CreditCard,
};

const PRIORITY_COLORS = {
  1: "#1B2B4B",
  2: "#3B6CB7",
  3: "#4A7C6F",
  4: "#D4A520",
  5: "#718096",
};

const WHAT_IT_DOES = {
  protection: (rec) =>
    rec.gapSolved > 0
      ? `Your family receives ${fmtUSD(rec.gapSolved)} if anything happens to you.`
      : "Your income continues even if illness or injury stops you from working.",
  retirement: () =>
    "Every month you contribute, tax-advantaged compounding works silently in your favor.",
  education: () => "Your children's education funding begins building toward their future today.",
  estate: () =>
    "Your family retains full legal control of your assets - no probate, no delays.",
  debt: (rec) =>
    rec.gapSolved > 0
      ? `Eliminating this debt permanently frees ${fmtUSD(Math.round((rec.gapSolved * 0.05) / 12))}/mo of cash flow.`
      : "Eliminating this debt strengthens every other financial goal in your plan.",
};

const GAP_SOLVE_FALLBACK = {
  protection: "No Cash Safety Net - IUL cash value supports emergency reserve after Year 3",
  education: "Education Funding Gap - $0 saved for 2 children",
  retirement: "Retirement Savings Gap Identified in Your Profile",
  estate: "Estate Planning Gap - core legal protections missing",
  debt: "Debt Optimization Gap in Your Profile",
};

export default function RecommendationCard({
  rec,
  index,
  onOpenIUL,
  onOpenCollege,
  onOpenDebt,
  onOpenRetirement,
}) {
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const color = PRIORITY_COLORS[rec.priorityRank] || PRIORITY_COLORS[5];
  const Icon = CAT_ICONS[rec.category] || Shield;
  const timeText = rec.timeToProtect || rec.time_to_protect || "Schedule within 30 days";
  const whatItDoes = rec.beforeAfterAfter || WHAT_IT_DOES[rec.category]?.(rec) || "";

  const col1Value =
    rec.gapSolved > 0
      ? fmtUSD(rec.gapSolved)
      : {
          protection: "Income Guaranteed",
          retirement: "Free Match",
          estate: "Legal Control",
          debt: "Debt-Free",
        }[rec.category] || "Value Created";

  const col3Value = rec.costOfWaiting12Months > 0 ? fmtUSD(rec.costOfWaiting12Months) : "Start compounding";
  const solvesLabel = rec.gapSolvedLabel || GAP_SOLVE_FALLBACK[rec.category] || "Profile gap coverage";
  const isPriority1IUL = rec.category === "protection" && rec.priorityRank === 1;
  const isPriority2College = rec.category === "education" && rec.priorityRank === 2;
  const isDebt = rec.category === "debt";
  const isRetirement = rec.category === "retirement";
  const fundingSourceText = rec.funding_source || rec.fundingSource || "";
  const iulBasePremiumOnly = rec.iul_base_premium_only ?? rec.iulBasePremiumOnly;
  const termMonthlyCost = rec.term_monthly_cost ?? rec.termMonthlyCost;

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E8E4DC",
        borderLeft: `4px solid ${color}`,
        borderRadius: 16,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        marginBottom: 16,
        overflow: "hidden",
        animation: "recSlideUpFade 400ms ease forwards",
        animationDelay: `${index * 120}ms`,
        opacity: 0,
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #F4F1EC",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              background: color,
              color: "#fff",
              borderRadius: 20,
              padding: "3px 12px",
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Priority {rec.priorityRank}
          </span>
          <Icon size={18} color={color} />
          <span style={{ color: "#1B2B4B", fontSize: 16, fontWeight: 700 }}>{rec.title}</span>
        </div>
        <span style={{ color: "#4A7C6F", fontSize: 12, fontWeight: 500 }}>
          {"\u2713"} Can be active within {timeText}
        </span>
      </div>
      {isPriority1IUL && (
        <div style={{ padding: "8px 20px 10px 20px", color: "#718096", fontSize: 12, borderBottom: "1px solid #F4F1EC" }}>
          Term Life {"\u2192"} Pure protection  |  IUL {"\u2192"} Protection + Growth
        </div>
      )}

      {whatItDoes && (
        <div
          style={{
            background: "#F0F7F4",
            borderBottom: "1px solid #D4EAE3",
            padding: "12px 20px",
            alignItems: "center",
            display: "flex",
            gap: 10,
          }}
        >
          <Shield size={15} color="#4A7C6F" style={{ flexShrink: 0 }} />
          <span style={{ color: "#2D5F52", fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>{whatItDoes}</span>
        </div>
      )}
      <div style={{ padding: "8px 20px", color: "#4A7C6F", fontSize: 12, fontWeight: 600 }}>
        {"\u2713"} Solves: {solvesLabel}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #F4F1EC" }}>
        <div style={{ padding: "18px 20px", borderRight: "1px solid #F4F1EC", textAlign: "center" }}>
          <div
            style={{
              fontSize: 10,
              color: "#A0AEC0",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            What's Protected
          </div>
          <div
            style={{
              fontSize: rec.gapSolved > 0 ? 26 : 18,
              fontWeight: 800,
              color: "#1B2B4B",
              lineHeight: 1,
              marginBottom: 6,
            }}
          >
            {col1Value}
          </div>
          <div style={{ fontSize: 11, color: "#A0AEC0" }}>Value protected or created</div>
        </div>

        <div
          style={{
            padding: "18px 20px",
            borderRight: "1px solid #F4F1EC",
            textAlign: "center",
            background: "#F9FFFE",
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#4A7C6F",
              textTransform: "uppercase",
              letterSpacing: 1,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Your Monthly Investment
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#4A7C6F", lineHeight: 1, marginBottom: 4 }}>
            {fmtUSD(rec.monthly_cost)}
            <span style={{ fontSize: 14 }}>/mo</span>
          </div>
          {fundingSourceText && (
            <div style={{ fontSize: 11, color: "#4A7C6F", fontStyle: "italic", opacity: 0.85, marginBottom: 4 }}>
              {fundingSourceText}
            </div>
          )}
          {iulBasePremiumOnly && rec.category === "protection" && (
            <div
              style={{
                marginTop: 8,
                background: "#F0F7F4",
                borderRadius: 6,
                padding: "6px 10px",
                fontSize: 11,
                color: "#2D5F52",
              }}
            >
              <div>Term coverage: {fmtUSD(termMonthlyCost || 0)}/mo</div>
              <div>IUL (builds wealth): {fmtUSD(iulBasePremiumOnly)}/mo</div>
            </div>
          )}
          {(rec.monthlyBreakdown || rec.protectionRatio) && (
            <div style={{ fontSize: 11, color: "#4A7C6F", fontStyle: "italic", opacity: 0.8 }}>
              {rec.monthlyBreakdown || rec.protectionRatio}
            </div>
          )}
        </div>

        <div style={{ padding: "18px 20px", textAlign: "center" }}>
          <div
            style={{
              fontSize: 10,
              color: "#A0AEC0",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <Clock size={10} color="#D4A520" />
            Value of Acting Now
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#D4A520", lineHeight: 1, marginBottom: 6 }}>
            {col3Value}
          </div>
          <div style={{ fontSize: 11, color: "#A0AEC0" }}>by starting today</div>
        </div>
      </div>

      {isPriority1IUL && (
        <button
          onClick={onOpenIUL}
          style={{
            width: "100%",
            background: "rgba(74,124,111,0.06)",
            border: "1px dashed rgba(74,124,111,0.4)",
            borderRadius: 8,
            padding: "10px 20px",
            color: "#4A7C6F",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            margin: "0 20px 10px 20px",
            width: "calc(100% - 40px)",
          }}
        >
          <TrendingUp size={16} />
          {rec.iulLinkText || "See How Your IUL Builds Wealth Over Time \u2192"}
        </button>
      )}

      {isPriority2College && (
        <button
          onClick={onOpenCollege}
          style={{
            width: "100%",
            background: "rgba(59,108,183,0.06)",
            border: "1px dashed rgba(59,108,183,0.4)",
            borderRadius: 8,
            padding: "10px 20px",
            color: "#3B6CB7",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            margin: "0 20px 10px 20px",
            width: "calc(100% - 40px)",
          }}
        >
          <GraduationCap size={16} />
          {rec.iulLinkText || "See Your Children's Education Projection \u2192"}
        </button>
      )}

      {isDebt && (
        <button
          onClick={onOpenDebt}
          style={{
            width: "100%",
            background: "rgba(212,165,32,0.06)",
            border: "1px dashed rgba(212,165,32,0.40)",
            borderRadius: 8,
            padding: "10px 20px",
            color: "#D4A520",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            margin: "0 20px 10px 20px",
            width: "calc(100% - 40px)",
          }}
        >
          <CreditCard size={16} />
          See Your 3 Paths to Debt Freedom {"\u2192"}
        </button>
      )}

      {isRetirement && (
        <button
          onClick={onOpenRetirement}
          style={{
            width: "100%",
            background: "rgba(27,43,75,0.05)",
            border: "1px dashed rgba(27,43,75,0.30)",
            borderRadius: 8,
            padding: "10px 20px",
            color: "#1B2B4B",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            margin: "0 20px 10px 20px",
            width: "calc(100% - 40px)",
          }}
        >
          <TrendingUp size={16} />
          See Your Retirement Tax Diversification {"\u2192"}
        </button>
      )}

      {rec.keyStatistic && (
        <div
          style={{
            background: "#FDFCFA",
            borderBottom: "1px solid #F4F1EC",
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Lightbulb size={14} color="#D4A520" style={{ flexShrink: 0 }} />
          <span style={{ color: "#718096", fontSize: 13, fontStyle: "italic", lineHeight: 1.5 }}>{rec.keyStatistic}</span>
        </div>
      )}

      <div
        style={{
          padding: "12px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              border: "1px solid #4A7C6F40",
              color: "#4A7C6F",
              borderRadius: 20,
              padding: "3px 12px",
              fontSize: 12,
              fontWeight: 500,
              background: "#4A7C6F0D",
            }}
          >
            Funded from your existing cash flow
          </span>
          {rec.fundedFromRecoveredCashFlow && (
            <span
              style={{
                border: "1px solid #4A7C6F40",
                color: "#4A7C6F",
                borderRadius: 20,
                padding: "3px 12px",
                fontSize: 12,
                fontWeight: 600,
                background: "#4A7C6F1A",
              }}
            >
              No additional outlay required {"\u2713"}
            </span>
          )}
        </div>
        <button
          onClick={() => setAdvisorOpen((o) => !o)}
          style={{
            background: "none",
            border: "1px solid #E8E4DC",
            borderRadius: 6,
            color: "#A0AEC0",
            fontSize: 11,
            padding: "3px 10px",
            cursor: "pointer",
          }}
        >
          Advisor Insight {advisorOpen ? "\u25B2" : "\u25BC"}
        </button>
      </div>

      {advisorOpen && (
        <div
          style={{
            borderTop: "1px solid #F4F1EC",
            background: "#FAFAFA",
            padding: "12px 20px",
            color: "#718096",
            fontSize: 13,
            fontStyle: "italic",
            lineHeight: 1.6,
          }}
        >
          {rec.agentTalkingPoint}
        </div>
      )}
    </div>
  );
}
