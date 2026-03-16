import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  TrendingUp,
  GraduationCap,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
} from "recharts";
import { recommendationsService } from "../../services/recommendationsService";

const fmt = (n) => "$" + (n || 0).toLocaleString("en-US");

export default function IULIllustrationScreen({ caseId, caseData, recommendation, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    const main = document.querySelector("main");
    if (main) main.scrollTop = 0;
  }, []);

  const blendedMonthly = recommendation?.monthly_cost || 1200;
  const iulMonthly =
    recommendation?.iul_base_premium_only ||
    recommendation?.iulBasePremiumOnly ||
    blendedMonthly * 0.35 ||
    500;
  const firstName =
    caseData?.clientPersonalInfo?.firstName ||
    caseData?.firstName ||
    caseData?.first_name ||
    caseData?.client_name?.split(" ")[0] ||
    "Client";

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await recommendationsService.fetchIULProjection(caseId, iulMonthly);
        if (mounted) setData(res);
      } catch (e) {
        if (mounted) setError(e?.message || "Unable to load IUL projection");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (caseId) run();
    return () => {
      mounted = false;
    };
  }, [caseId, iulMonthly]);

  const projectionRows = data?.projection || [];
  const milestones = data?.milestones || {};

  const chartData = useMemo(() => {
    const iulMonthlyForChart = data?.premium_breakdown?.iul_monthly || 282;
    return projectionRows.map((d) => {
      const r = 0.07 / 12;
      const n = Number(d.year || 0) * 12;
      const marketFV = n > 0 ? Math.round(iulMonthlyForChart * ((Math.pow(1 + r, n) - 1) / r)) : 0;
      return {
        year: d.year,
        age: d.age,
        cash_value: d.cash_value,
        loan_available: d.loan_available,
        cumulative_premium: d.cumulative_premium,
        market_value: marketFV,
      };
    });
  }, [projectionRows, data?.premium_breakdown?.iul_monthly]);

  const tableRows = useMemo(() => {
    if (!projectionRows.length) return [];
    const retirementYear = milestones.retirement_year;
    return projectionRows.filter(
      (r) => r.year === 1 || r.year % 5 === 0 || r.year === retirementYear
    );
  }, [projectionRows, milestones.retirement_year]);

  const termScenario = data?.comparison?.term_scenario || data?.term_only_scenario || {};
  const iulScenario = data?.comparison?.iul_scenario || data?.iul_scenario || {};
  const iulNet = iulScenario?.net_wealth_created || 0;
  const isClearPositive = iulNet > 0;
  const fullProtection =
    recommendation?.gapSolved ||
    caseData?.life_insurance_gap ||
    caseData?.lifeInsuranceGap ||
    0;
  const totalCoverage = (
    Number(data?.premium_breakdown?.term_face || 0)
    + Number(data?.premium_breakdown?.iul_face || 0)
  ) || Number(caseData?.life_insurance_gap || caseData?.lifeInsuranceGap || 0) || 0;
  const termCoverage = Number(termScenario?.coverage || termScenario?.death_benefit || totalCoverage || 0);
  const iulCoverage = Number(iulScenario?.coverage || iulScenario?.death_benefit || totalCoverage || 0);

  const chips = [
    milestones?.break_even_year
      ? `Break-even: Year ${milestones.break_even_year}`
      : "Break-even projected in ~12 years",
    milestones?.retirement_cash_value > 0
      ? `${fmt(milestones.retirement_cash_value)} at retirement`
      : "Cash value accumulates over time",
    milestones?.retirement_monthly_income > 0
      ? `${fmt(milestones.retirement_monthly_income)}/mo tax-free`
      : "Tax-free income in retirement",
  ];
  const wealthYAxisMax = Math.max(...projectionRows.map((r) => Number(r?.cash_value || 0)), 1000) * 1.2;
  const breakEvenYear = milestones?.break_even_year;
  const netAtRetirement = milestones?.net_wealth_created ?? iulScenario?.net_wealth_created ?? 0;
  const clientChildren = caseData?.children || caseData?.dependents || [];
  const firstChildAge = Number(clientChildren?.[0]?.age || clientChildren?.[0]?.current_age || 9);
  const collegeYear = Math.max(18 - firstChildAge, 1);
  const collegeRow = projectionRows.find((p) => Number(p.year) >= collegeYear);
  const collegeAmount = Number(collegeRow?.loan_available || 0);

  return (
    <div style={{ background: "#F8F7F4", minHeight: "100%", padding: 24 }}>
      <button
        onClick={onBack}
        style={{
          border: "none",
          background: "none",
          color: "#4A7C6F",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 12,
        }}
      >
        <ArrowLeft size={14} />
        Back to Recommendations
      </button>

      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E8E4DC",
          borderLeft: "4px solid #4A7C6F",
          borderRadius: 16,
          padding: "20px 24px",
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0, color: "#1B2B4B", fontSize: 24 }}>
          {firstName}'s IUL - Protection Today. Wealth Tomorrow.
        </h2>
        <p style={{ color: "#4A5568", margin: "8px 0 14px 0" }}>
          Here is exactly how your {fmt(iulMonthly)}/mo IUL base premium builds over time.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {chips.map((chip) => (
            <Chip key={chip} text={chip} color="#4A7C6F" />
          ))}
        </div>
      </div>

      {data?.premium_breakdown && (
        <div
          style={{
            background: "#F0F7F4",
            border: "1px solid #4A7C6F40",
            borderRadius: 12,
            padding: "14px 20px",
            marginBottom: 16,
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 12, color: "#2D5F52" }}>
            <span style={{ fontWeight: 700 }}>How your premium is split:</span>
          </div>
          <div style={{ fontSize: 12, color: "#4A5568" }}>
            Term Life ({fmt(data.premium_breakdown.term_face)} coverage):
            <strong style={{ color: "#1B2B4B" }}> {fmt(data.premium_breakdown.term_monthly)}/mo</strong>
          </div>
          <div style={{ fontSize: 12, color: "#4A5568" }}>
            IUL Base ({fmt(data.premium_breakdown.iul_face)} face + wealth building):
            <strong style={{ color: "#4A7C6F" }}> {fmt(data.premium_breakdown.iul_monthly)}/mo</strong>
          </div>
          <div style={{ fontSize: 12, color: "#718096", fontStyle: "italic" }}>
            This illustration shows only the IUL layer accumulation.
          </div>
        </div>
      )}

      {loading && <InfoBanner text="Loading your IUL illustration..." />}
      {error && <InfoBanner text={error} tone="error" />}

      {!loading && !error && (
        <>
          <div style={{ color: "#1B2B4B", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            How Your Cash Value Grows - IUL Accumulation Story
          </div>
          <div style={{ color: "#718096", fontSize: 12, fontStyle: "italic", marginBottom: 8 }}>
            The shaded area shows your policy's growing cash value. After Year {breakEvenYear || 12},
            your wealth exceeds what you've paid in.
          </div>
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8E4DC",
              borderRadius: 12,
              height: 280,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid stroke="#EFEAE0" />
                <XAxis dataKey="year" />
                <YAxis domain={[0, wealthYAxisMax]} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v) => fmt(Number(v))} />
                <Legend />
                <Area type="monotone" dataKey="cash_value" stroke="#4A7C6F" fill="#4A7C6F" fillOpacity={0.3} strokeWidth={2} name="Cash Value" />
                <Area type="monotone" dataKey="loan_available" stroke="none" fill="#4A7C6F" fillOpacity={0.12} name="Available to Borrow" />
                <Line type="monotone" dataKey="cumulative_premium" stroke="#D4A520" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Premiums Paid" />
                <Line type="monotone" dataKey="market_value" name="7% Market Account" stroke="#9B8EC4" strokeDasharray="6 3" strokeWidth={1.5} dot={false} />
                {milestones.break_even_year && (
                  <ReferenceLine x={milestones.break_even_year} stroke="#1B2B4B" strokeDasharray="4 4" label="Break-even" />
                )}
                {milestones.college_funding_year && (
                  <ReferenceLine x={milestones.college_funding_year} stroke="#1B2B4B" strokeDasharray="4 4" label="College" />
                )}
                {milestones.retirement_year && (
                  <ReferenceLine x={milestones.retirement_year} stroke="#1B2B4B" strokeDasharray="4 4" label="Retire" />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {(() => {
            const mktVal = chartData[chartData.length - 1]?.market_value || 0;
            const iulVal = milestones?.retirement_cash_value || 0;
            const mktHigher = mktVal > iulVal;
            const diff = Math.abs(mktVal - iulVal);
            return mktVal > 0 ? (
              <div
                style={{
                  background: "#F8F7F4",
                  border: "1px solid #E8E4DC",
                  borderRadius: 10,
                  padding: "14px 20px",
                  marginTop: 8,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", gap: 32, flexWrap: "wrap", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: "#4A5568" }}>
                    <span style={{ color: "#9B8EC4", fontWeight: 700 }}>7% Market at retirement:</span>{" "}
                    {fmt(mktVal)} <span style={{ color: "#718096" }}>— fully taxable, zero protection</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#4A5568" }}>
                    <span style={{ color: "#4A7C6F", fontWeight: 700 }}>IUL at retirement:</span>{" "}
                    {fmt(iulVal)} <span style={{ color: "#718096" }}>— tax-free, living benefits, 0% floor</span>
                  </div>
                </div>
                {mktHigher && (
                  <div
                    style={{
                      background: "rgba(27,43,75,0.04)",
                      borderLeft: "3px solid #1B2B4B",
                      borderRadius: "0 6px 6px 0",
                      padding: "8px 12px",
                      fontSize: 12,
                      color: "#1B2B4B",
                      lineHeight: 1.7,
                    }}
                  >
                    <strong>Why a Fidelity CFP still recommends IUL:</strong>{" "}
                    The market account returns {fmt(diff)} more at retirement, but that entire amount is taxable — at a
                    32% rate, you net {fmt(Math.round(diff * 0.68))} after tax. Meanwhile, the IUL&apos;s {fmt(iulVal)} is
                    accessed tax-free via policy loans. Additionally: the market account provides zero protection if{" "}
                    {firstName} becomes disabled or critically ill today. The IUL provides up to{" "}
                    {fmt(Math.round((data?.premium_breakdown?.iul_face || 0) * 0.9))} in living benefits from Day 1. No
                    market account can do that.
                  </div>
                )}
              </div>
            ) : null;
          })()}

          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8E4DC",
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead style={{ background: "#1B2B4B", color: "#FFFFFF" }}>
                <tr>
                  {["Year", "Age", "Cash Value", "Death Benefit", "Available to Borrow", "Net Gain"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((r, idx) => {
                  const isRet = r.year === milestones.retirement_year;
                  const isCollege = r.year === milestones.college_funding_year;
                  return (
                    <tr
                      key={r.year}
                      style={{
                        background: idx % 2 ? "#F8F7F4" : "#FFFFFF",
                        borderLeft: isRet ? "3px solid #4A7C6F" : isCollege ? "3px solid #3B6CB7" : "none",
                      }}
                    >
                      <td style={{ padding: "8px 12px" }}>Year {r.year}</td>
                      <td style={{ padding: "8px 12px" }}>{r.age}</td>
                      <td style={{ padding: "8px 12px" }}>{fmt(r.cash_value)}</td>
                      <td style={{ padding: "8px 12px" }}>{fmt(r.death_benefit)}</td>
                      <td style={{ padding: "8px 12px" }}>{fmt(r.loan_available)}</td>
                      {(() => {
                        const netGain = parseFloat(
                          r.net_gain ?? (Number(r.cash_value || 0) - Number(r.cumulative_premium || 0))
                        );
                        const isNeg = netGain < 0;
                        const isZero = netGain === 0;
                        return (
                          <td
                            style={{
                              padding: "8px 12px",
                              color: isNeg ? "#E05252" : isZero ? "#718096" : "#4A7C6F",
                              fontWeight: isNeg ? 400 : 600,
                            }}
                          >
                            {isNeg ? `-${fmt(Math.abs(netGain))}` : isZero ? "—" : `+${fmt(netGain)}`}
                          </td>
                        );
                      })()}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ fontSize: 11, color: "#718096", fontStyle: "italic", padding: "6px 16px 10px" }}>
              * Early years show negative net gain as policy expenses are applied. Cash value crosses break-even at Year{" "}
              {milestones?.break_even_year || 7}, after which your wealth exceeds every premium you've paid.
            </div>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #1B2B4B 0%, #243A63 100%)",
              borderRadius: 12,
              padding: "20px 24px",
              color: "#fff",
              display: "flex",
              gap: 32,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#90A8CC", textTransform: "uppercase", letterSpacing: 1 }}>
                Death Benefit (Day 1)
              </div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{fmt(data?.premium_breakdown?.iul_face || 0)}</div>
              <div style={{ fontSize: 12, color: "#BFD0E8" }}>Immediate protection from policy start</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#90A8CC", textTransform: "uppercase", letterSpacing: 1 }}>
                Total Family Coverage (Term + IUL)
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#4A7C6F" }}>
                {fmt((data?.premium_breakdown?.term_face || 0) + (data?.premium_breakdown?.iul_face || 0))}
              </div>
              <div style={{ fontSize: 12, color: "#BFD0E8" }}>Combined Term + IUL layer protection</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#90A8CC", textTransform: "uppercase", letterSpacing: 1 }}>
                Living Benefit Trigger
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#D4A520" }}>
                Critical, Chronic,
                <br />
                or Terminal Illness
              </div>
              <div style={{ fontSize: 12, color: "#BFD0E8" }}>Access death benefit early</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <CompareCard
              title="Term Life Only"
              bg="#FFF9F0"
              border="#E8D5A0"
              monthly={termScenario.monthly_cost}
              coverage={termCoverage || fullProtection}
              cash={termScenario.cash_value_at_65}
              income={0}
              paid={termScenario.total_premiums_paid}
              net={termScenario.net_wealth_created}
              good={false}
            />
            <CompareCard
              title="IUL - Protection + Growth"
              bg="#F0F7F4"
              border="#4A7C6F"
              monthly={iulScenario.monthly_cost}
              coverage={iulCoverage || fullProtection}
              cash={iulScenario.cash_value_at_65}
              income={milestones.retirement_monthly_income}
              paid={iulScenario.total_premiums_paid}
              net={iulScenario.net_wealth_created}
              good
              isClearPositive={isClearPositive}
              breakEvenYear={milestones?.break_even_year}
            />
          </div>

          {(() => {
            const retCV = milestones?.retirement_cash_value || 0;
            const retIncome = milestones?.retirement_monthly_income || 0;
            const bey = milestones?.break_even_year || 7;
            if (retCV <= 0) return null;
            return (
              <div
                style={{
                  background: "linear-gradient(135deg, #F0F7F4, #E8F5F0)",
                  border: "1px solid rgba(74,124,111,0.25)",
                  borderLeft: "4px solid #4A7C6F",
                  borderRadius: 12,
                  padding: "16px 24px",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#4A7C6F",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  What This Means for {firstName}'s Family
                </div>
                <div style={{ fontSize: 14, color: "#2D5F52", lineHeight: 1.7 }}>
                  Starting at <strong>${data?.premium_breakdown?.iul_monthly || 282}/mo</strong>, by Year {bey} this policy has
                  already repaid itself. At retirement you have <strong>{fmt(retCV)}</strong> you can draw as{" "}
                  <strong>{fmt(retIncome)}/mo tax-free income</strong>.
                  {collegeAmount > 0 ? (
                    <>
                      {" "}
                      Along the way, <strong>{fmt(collegeAmount)} is available at Year {collegeYear}</strong> for your
                      children's education through a policy loan — no financial aid impact, no penalties, no taxes.
                    </>
                  ) : null}
                </div>
              </div>
            );
          })()}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div style={{ background: "#FDFCFA", border: "1px solid #E8E4DC", borderRadius: 10, padding: 12 }}>
              {(() => {
                const iulFace = data?.premium_breakdown?.iul_face || 375000;
                const triggers = [
                  {
                    label: "Critical Illness",
                    example: "Heart attack, cancer, stroke",
                    access: `Up to ${fmt(Math.round(iulFace * 0.9))} accessed immediately`,
                    color: "#D4A520",
                  },
                  {
                    label: "Chronic Illness",
                    example: "Unable to perform 2 of 6 daily living activities",
                    access: "Monthly income replacement — no separate policy needed",
                    color: "#3B6CB7",
                  },
                  {
                    label: "Terminal Illness",
                    example: "12–24 month prognosis",
                    access: `Full ${fmt(iulFace)} death benefit — accessed while living`,
                    color: "#4A7C6F",
                  },
                ];
                return (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1B2B4B", marginBottom: 10 }}>
                      🛡️ Living Benefits — Built-In Disability Protection
                    </div>
                    {triggers.map((t, i) => (
                      <div
                        key={t.label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          padding: "7px 0",
                          borderBottom: i < 2 ? "1px solid #F0EDE8" : "none",
                          gap: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: t.color }}>{t.label}</div>
                          <div style={{ fontSize: 11, color: "#718096" }}>{t.example}</div>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#1B2B4B", textAlign: "right", maxWidth: 180 }}>
                          {t.access}
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 8, fontSize: 11, color: "#4A7C6F", fontStyle: "italic" }}>
                      A standalone disability policy costs $150–250/mo extra. Your IUL includes all three triggers at no added premium.
                    </div>
                  </>
                );
              })()}
            </div>
            <Insight
              icon={<GraduationCap size={14} color="#D4A520" />}
              title="College Funding"
              text={
                collegeAmount > 0
                  ? `${fmt(collegeAmount)} available for education at Year ${collegeYear}`
                  : `Policy loans available after Year ${breakEvenYear || 12}`
              }
            />
            <Insight icon={<TrendingUp size={14} color="#D4A520" />} title="Tax-Free Retirement" text="Policy loans can support tax-efficient income with no RMD constraints." />
          </div>
        </>
      )}
    </div>
  );
}

function Chip({ text, color }) {
  return (
    <span
      style={{
        background: `${color}1A`,
        border: `1px solid ${color}40`,
        color,
        borderRadius: 20,
        padding: "5px 12px",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {text}
    </span>
  );
}

function InfoBanner({ text, tone = "info" }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: `1px solid ${tone === "error" ? "#D4A520" : "#E8E4DC"}`,
        borderRadius: 10,
        padding: "10px 14px",
        color: "#4A5568",
        marginBottom: 12,
      }}
    >
      {text}
    </div>
  );
}

function CompareCard({ title, bg, border, monthly, coverage, cash, income, paid, net, good, isClearPositive = true, breakEvenYear }) {
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 12,
        padding: 14,
        position: "relative",
      }}
    >
      {good && (
        <span
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "#4A7C6F",
            color: "#fff",
            fontSize: 10,
            borderRadius: 12,
            padding: "2px 8px",
            fontWeight: 700,
          }}
        >
          RECOMMENDED
        </span>
      )}
      <div style={{ color: "#1B2B4B", fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <Row label="Monthly cost" value={fmt(monthly)} />
      <Row label="Coverage" value={fmt(coverage)} />
      <Row label="Cash value at 65" value={fmt(cash)} />
      <Row label="Tax-free income" value={`${fmt(income)}/mo`} />
      <Row label="Total premiums paid" value={fmt(paid)} />
      {!good && (
        <div style={{ marginTop: 8, fontWeight: 700, color: "#D4A520" }}>
          -{fmt(Math.abs(net || 0))} Net (premiums never returned)
        </div>
      )}
      {good && (
        <div style={{ marginTop: 8, fontWeight: 700, color: isClearPositive ? "#4A7C6F" : "#D4A520" }}>
          {isClearPositive
            ? `+${fmt(net)} net wealth created`
            : breakEvenYear
              ? `Positive return from Year ${breakEvenYear}`
              : "Positive return projected mid-policy"}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#4A5568", marginBottom: 4 }}>
      <span>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function Insight({ icon, title, text }) {
  return (
    <div style={{ background: "#FDFCFA", border: "1px solid #E8E4DC", borderRadius: 10, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#1B2B4B", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
        {icon}
        {title}
      </div>
      <div style={{ color: "#718096", fontSize: 12, lineHeight: 1.6 }}>{text}</div>
    </div>
  );
}

