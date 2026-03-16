import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { recommendationsService } from "../../services/recommendationsService";

const fmtUSD = (n) => `$${Math.round(Number(n || 0)).toLocaleString("en-US")}`;

export default function RetirementDiversificationScreen({ caseId, caseData, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    const main = document.querySelector("main");
    if (main) main.scrollTop = 0;
  }, []);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await recommendationsService.fetchRetirementProjection(caseId);
        if (mounted) setData(res);
      } catch (e) {
        if (mounted) setError(e?.message || "Unable to load retirement projection");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (caseId) run();
    return () => {
      mounted = false;
    };
  }, [caseId]);

  const summary = data?.summary_current || {};
  const optimized = data?.optimized_scenario || {};
  const match = data?.employer_match_analysis || {};
  const scenarios = data?.withdrawal_scenarios || [];
  const rmdRows = data?.rmd_progression || [];
  const firstName =
    caseData?.first_name ||
    caseData?.firstName ||
    caseData?.client?.first_name ||
    caseData?.primary_client?.first_name ||
    caseData?.clientPersonalInfo?.firstName ||
    "Your";
  const annualIncome = Number(
    caseData?.annual_income
    || caseData?.annualIncome
    || caseData?.household_income
    || caseData?.householdIncome
    || 0
  );
  const ssBenefit = Math.round((annualIncome * 0.35) / 12);
  const ss62 = Math.round(ssBenefit * 0.70);
  const ss67 = ssBenefit;
  const ssSpouse = Math.round(ssBenefit * 0.50);
  const ssCombined67 = ss67 + ssSpouse;
  const lifestyleNeed = Math.round((annualIncome * 0.75) / 12);
  const investGap = Math.max(0, lifestyleNeed - ssCombined67);
  const matchCap = Number(match?.match_cap_monthly || 0);
  const noMatchDataEntered = matchCap === 0;
  const clientAge =
    Number(
      caseData?.client_age
      || caseData?.primary_client_age
      || caseData?.age
      || caseData?.primary_age
      || 45
    ) || 45;
  const yearsTo595 = Math.max(59.5 - clientAge, 10);
  const rothStarterMonthly = 1166;
  const rothStarterFV = Math.round(
    rothStarterMonthly * 12 * ((Math.pow(1.07, yearsTo595) - 1) / 0.07)
  );

  const bucketData = useMemo(() => {
    const s59 = scenarios.find((x) => Number(x.age) === 59.5) || {};
    const s65 = scenarios.find((x) => Number(x.age) === 65) || {};
    return [
      {
        period: "Today",
        taxDeferred: Math.max(summary.tax_deferred_total * 0.6, 0),
        taxFree: Math.max(summary.tax_free_total * 0.6, 0),
        taxable: Math.max(summary.taxable_total * 0.6, 0),
      },
      {
        period: "Age 59.5",
        taxDeferred: Number(summary.tax_deferred_total || 0),
        taxFree: Number(summary.tax_free_total || 0),
        taxable: Number(summary.taxable_total || 0),
      },
      {
        period: "Age 65",
        taxDeferred: Number(s65.tax_deferred_balance || summary.tax_deferred_total || 0),
        taxFree: Number(s65.tax_free_balance || summary.tax_free_total || 0),
        taxable: Number(summary.taxable_total || 0),
      },
    ];
  }, [summary, scenarios]);

  const taxFreePct = Number(summary.total_at_retirement || 0) > 0
    ? (Number(summary.tax_free_total || 0) / Number(summary.total_at_retirement || 1)) * 100
    : 0;

  return (
    <div style={{ background: "#F8F7F4", minHeight: "100%", padding: 24 }}>
      <button
        onClick={onBack}
        style={{ border: "none", background: "none", color: "#4A7C6F", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12 }}
      >
        <ArrowLeft size={14} />
        Back to Recommendations
      </button>

      <div style={{ background: "#fff", border: "1px solid #E8E4DC", borderLeft: "4px solid #1B2B4B", borderRadius: 16, padding: "20px 24px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#1B2B4B", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
          Your Retirement Tax Blueprint
        </div>
        <h2 style={{ margin: 0, color: "#1B2B4B", fontSize: 26 }}>{firstName}'s Retirement at Age 59.5</h2>
        <p style={{ color: "#4A5568", fontSize: 14, lineHeight: 1.7 }}>
          Here is exactly what your retirement accounts will be worth, how much the IRS will take, and how to keep more of it.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Chip color="#1B2B4B" text={`${fmtUSD(summary.total_at_retirement)} projected total`} />
          <Chip color="#4A7C6F" text={`${fmtUSD(summary.estimated_monthly_net_after_tax)}/mo net income`} />
          <Chip color="#D4A520" text={`${Number(summary.effective_tax_rate_retirement || 0).toFixed(1)}% retirement tax rate`} />
        </div>
      </div>

      {annualIncome > 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, #1B2B4B08, #1B2B4B04)",
            border: "1px solid #E8E4DC",
            borderRadius: 10,
            padding: "14px 20px",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1B2B4B", marginBottom: 8 }}>
            🏛️ Your Social Security Foundation (Estimated)
          </div>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, color: "#718096", textTransform: "uppercase", letterSpacing: 1 }}>
                At Age 62 (reduced)
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1B2B4B" }}>{fmtUSD(ss62)}/mo</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#718096", textTransform: "uppercase", letterSpacing: 1 }}>
                At Age 67 (full benefit)
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#4A7C6F" }}>{fmtUSD(ss67)}/mo</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#718096", textTransform: "uppercase", letterSpacing: 1 }}>
                Combined (both spouses, age 67)
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#3B6CB7" }}>{fmtUSD(ssCombined67)}/mo</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#718096", fontStyle: "italic", marginTop: 8 }}>
            Estimated using SSA formula. Verify at ssa.gov/myaccount. Your investment plan fills the gap above this baseline.
          </div>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #E8E4DC", fontSize: 12, color: "#4A5568" }}>
            <strong>Your income gap at retirement:</strong> Monthly expenses estimated at {fmtUSD(lifestyleNeed)}/mo
            (75% income replacement). Social Security covers {fmtUSD(ssCombined67)}/mo.{" "}
            <span style={{ color: "#D4A520", fontWeight: 700 }}>
              Investment portfolio must generate {fmtUSD(investGap)}/mo
            </span>{" "}
            to maintain your lifestyle.
          </div>
        </div>
      )}

      {loading && <Banner text="Building retirement diversification analysis..." />}
      {error && <Banner text={error} tone="error" />}
      {data?.is_illustrative && (
        <div
          style={{
            background: "#FFFBF0",
            border: "1px solid #D4A52040",
            borderLeft: "4px solid #D4A520",
            borderRadius: 8,
            padding: "10px 16px",
            marginBottom: 16,
            fontSize: 12,
            color: "#4A5568",
          }}
        >
          {"\u2139\uFE0F"} <strong>Illustrative projection:</strong>{" "}
          {data?.illustrative_note} Enter actual retirement account details in Financial Background for
          personalized numbers.
        </div>
      )}

      {!loading && !error && (
        <>
          <div style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12, padding: 12, marginBottom: 14, height: 300 }}>
            <div style={{ color: "#1B2B4B", fontWeight: 700, marginBottom: 8 }}>Your Money in 3 Buckets</div>
            <ResponsiveContainer width="100%" height="88%">
              <BarChart data={bucketData}>
                <CartesianGrid stroke="#EFEAE0" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v) => fmtUSD(v)} />
                <Legend />
                <Bar dataKey="taxDeferred" stackId="a" fill="#1B2B4B" name="Tax-Deferred" />
                <Bar dataKey="taxFree" stackId="a" fill="#4A7C6F" name="Tax-Free" />
                <Bar dataKey="taxable" stackId="a" fill="#D4A520" name="Taxable" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {taxFreePct < 20 && (
            <div style={{ background: "#FFFBF0", border: "1px solid #D4A52040", borderRadius: 12, padding: 12, color: "#4A5568", fontSize: 13, marginBottom: 14 }}>
              <strong style={{ color: "#D4A520" }}>{"\u26A0\uFE0F"} {taxFreePct.toFixed(1)}% of your retirement wealth is in tax-free accounts.</strong>{" "}
              Without changes, {firstName} may pay about {fmtUSD(summary.rmd_tax_at_72_monthly)}/mo in mandatory taxes starting at age 72.
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {(data?.current_accounts_projected || []).map((acc, i) => (
              <div key={acc.type + i} style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12, padding: 12 }}>
                <div style={{ color: "#1B2B4B", fontWeight: 700, marginBottom: 8 }}>{String(acc.type || "").toUpperCase()} Projection</div>
                {(() => {
                  const isNotYetFunded = Number(acc.current_balance || 0) === 0 && Number(acc.monthly_contribution || 0) === 0;
                  const accType = String(acc.type || "").toLowerCase();
                  if (isNotYetFunded) {
                    return (
                      <div
                        style={{
                          padding: "12px 16px",
                          background: "#F8F7F4",
                          borderRadius: 8,
                          fontSize: 12,
                          color: "#4A5568",
                          fontStyle: "italic",
                          marginBottom: 10,
                        }}
                      >
                        {accType === "roth_ira"
                          ? `🎯 Not yet opened. Starting $1,166/mo following this plan will build ${fmtUSD(rothStarterFV)} in tax-free wealth by age 59.5.`
                          : accType === "traditional_ira"
                            ? "Not currently funded. Focus on Roth IRA first — tax-free growth is more valuable at your income level."
                            : "Not yet funded."}
                      </div>
                    );
                  }
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                      <SmallMetric title="Balance at 59.5" value={fmtUSD(acc.projected_balance_59_5)} color="#1B2B4B" />
                      <SmallMetric title="Monthly Income (4%)" value={fmtUSD(acc.monthly_income_4pct)} color="#4A5568" />
                      <SmallMetric title="Tax Bite / Month" value={fmtUSD(acc.tax_bite_monthly)} color="#D4A520" />
                    </div>
                  );
                })()}
                <div style={{ height: 80 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={acc.sparkline || []}>
                      <Area dataKey="value" stroke="#3B6CB7" fill="rgba(59,108,183,0.2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>

          {noMatchDataEntered && (
            <div
              style={{
                background: "rgba(212,165,32,0.10)",
                border: "1px solid rgba(212,165,32,0.35)",
                borderLeft: "3px solid #D4A520",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 12,
                fontSize: 12,
                color: "#4A5568",
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "#B8860B" }}>⚠️ Action needed:</strong> No employer match information is on file.
              Before redirecting any 401(k) contributions to IUL, confirm your employer&apos;s exact match percentage with
              HR. If your employer matches even 3-4%, that match must be captured first — it&apos;s a guaranteed 100% return
              that no IUL or investment can beat.
            </div>
          )}

          {Number(match.over_contributing_monthly || 0) > 0 && (
            <div style={{ background: "#F0F7F4", border: "1px solid #4A7C6F30", borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ color: "#1B2B4B", fontWeight: 700, marginBottom: 8 }}>{"\uD83D\uDCA1"} Hidden Opportunity in Your 401(k)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, color: "#4A5568", fontSize: 13, lineHeight: 1.6 }}>
                <div>
                  You are contributing {fmtUSD(match.current_contribution_monthly)}/mo to your 401k. Your employer matches up to {fmtUSD(match.match_cap_monthly)}/mo. The {fmtUSD(match.over_contributing_monthly)}/mo above the match earns no bonus and is taxed on withdrawal.
                </div>
                <div>
                  Redirect {fmtUSD(match.iul_opportunity_monthly)}/mo to IUL: tax-free distribution potential, no RMD, and living benefits.
                  <div style={{ marginTop: 6, fontWeight: 700, color: "#4A7C6F" }}>
                    IUL value at retirement: {fmtUSD(match.iul_projected_at_retirement)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              background: "#F0F7F4",
              border: "1px solid rgba(74,124,111,0.25)",
              borderRadius: 8,
              padding: "12px 16px",
              marginTop: 12,
              marginBottom: 14,
              fontSize: 12,
            }}
          >
            <div style={{ fontWeight: 700, color: "#4A7C6F", marginBottom: 6 }}>📋 Confirm with HR before restructuring:</div>
            {[
              "What is your exact 401(k) employer match percentage?",
              "What is the maximum salary percentage they will match?",
              "Is there a vesting schedule on the employer match?",
              "Do you offer a Roth 401(k) option alongside traditional?",
            ].map((q, i) => (
              <div key={q} style={{ color: "#4A5568", marginBottom: i < 3 ? 4 : 0, display: "flex", gap: 8 }}>
                <span style={{ color: "#4A7C6F", flexShrink: 0 }}>→</span>
                <span>{q}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ background: "#1B2B4B", color: "#fff", padding: "10px 12px", fontWeight: 700 }}>
              What You Will Actually Take Home - Three Ages
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead style={{ background: "#F8F7F4" }}>
                <tr>
                  {["Strategy", "Age 59.5", "Age 65", "Age 72"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "#4A5568" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderTop: "1px solid #F0ECE5" }}>
                  <td style={{ padding: "8px 12px", color: "#1B2B4B", fontWeight: 600 }}>Current (all tax-deferred)</td>
                  {scenarios.map((s) => (
                    <td key={`c-${s.age}`} style={{ padding: "8px 12px", color: "#4A5568" }}>{fmtUSD(s.all_taxdeferred_net)}/mo</td>
                  ))}
                </tr>
                <tr style={{ borderTop: "1px solid #F0ECE5" }}>
                  <td style={{ padding: "8px 12px", color: "#1B2B4B", fontWeight: 600 }}>With IUL Layer Added</td>
                  {scenarios.map((s) => (
                    <td key={`o-${s.age}`} style={{ padding: "8px 12px", color: "#4A5568" }}>{fmtUSD(s.diversified_net)}/mo</td>
                  ))}
                </tr>
                <tr style={{ borderTop: "1px solid #F0ECE5", background: "#F0F7F4" }}>
                  <td style={{ padding: "8px 12px", color: "#4A7C6F", fontWeight: 700 }}>Difference</td>
                  {scenarios.map((s) => (
                    <td key={`d-${s.age}`} style={{ padding: "8px 12px", color: "#4A7C6F", fontWeight: 700 }}>
                      +{fmtUSD((s.diversified_net || 0) - (s.all_taxdeferred_net || 0))}/mo
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ background: "#FFFBF0", border: "1px solid #D4A52040", borderRadius: 12, padding: 12, marginBottom: 14 }}>
            <div style={{ color: "#1B2B4B", fontWeight: 700, marginBottom: 8 }}>If You Don't Touch It - The RMD Problem</div>
            {rmdRows.map((r) => (
              <div key={r.age} style={{ fontSize: 13, color: "#4A5568", marginBottom: 4 }}>
                Age {r.age}: Balance {fmtUSD(r.tax_deferred_balance)} {"\u2192"} Required withdrawal {fmtUSD(r.rmd_required_annual)}/yr {"\u2192"} Tax owed {fmtUSD(r.rmd_tax_annual)}/yr
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div style={{ background: "#FFFBF0", border: "1px solid #D4A52040", borderRadius: 12, padding: 14 }}>
              <div style={{ color: "#1B2B4B", fontWeight: 700 }}>Current Path</div>
              <div style={{ color: "#4A5568", fontSize: 13 }}>401(k) only - all tax-deferred</div>
              <div style={{ marginTop: 8, fontSize: 13, color: "#4A5568" }}>Monthly net at 59.5: {fmtUSD(summary.estimated_monthly_net_after_tax)}</div>
              <div style={{ fontSize: 13, color: "#4A5568" }}>Tax paid in retirement: {fmtUSD(optimized.current_lifetime_tax)}</div>
              <div style={{ fontSize: 13, color: "#4A5568" }}>RMD starts: Age 72</div>
            </div>
            <div style={{ background: "#F0F7F4", border: "1px solid #4A7C6F40", borderRadius: 12, padding: 14, position: "relative" }}>
              <span style={{ position: "absolute", right: 10, top: 10, fontSize: 10, background: "#4A7C6F", color: "#fff", borderRadius: 12, padding: "2px 8px", fontWeight: 700 }}>
                RECOMMENDED
              </span>
              <div style={{ color: "#1B2B4B", fontWeight: 700 }}>Optimized Path {"\u2713"}</div>
              <div style={{ color: "#4A5568", fontSize: 13 }}>401(k) at match cap + IUL layer</div>
              <div style={{ marginTop: 8, fontSize: 13, color: "#4A5568" }}>Monthly net at 59.5: {fmtUSD(optimized.monthly_net_optimized)}</div>
              <div style={{ fontSize: 13, color: "#4A5568" }}>Tax paid in retirement: {fmtUSD(optimized.optimized_lifetime_tax)}</div>
              <div style={{ fontSize: 13, color: "#4A5568" }}>RMD: Never (IUL has no RMD)</div>
              <div style={{ marginTop: 6, color: "#4A7C6F", fontWeight: 700 }}>Monthly advantage: +{fmtUSD(optimized.vs_current_monthly_gain)}/mo</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Insight title="The Roth Conversion Window" text="Between ages 59.5 and 72, there is a window to convert tax-deferred funds to Roth before RMDs force withdrawals." />
            <Insight title="The Tax Rate Bet" text="A 401(k) is a bet that your tax rate in retirement will be lower than today. Diversifying with Roth and IUL hedges this risk." />
            <Insight title="Sequence of Returns Risk" text="A sharp market drop early in retirement can force selling low. Tax-free IUL cash value with a 0% floor can reduce that risk." />
            <Insight title="The Social Security Tax Trap" text={`At ${Number(summary.effective_tax_rate_retirement || 0).toFixed(1)}% marginal rate, IUL policy loans can help avoid triggering additional taxable income.`} />
          </div>
        </>
      )}
    </div>
  );
}

function Banner({ text, tone = "info" }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${tone === "error" ? "#D4A520" : "#E8E4DC"}`, borderRadius: 10, padding: "10px 14px", color: "#4A5568", marginBottom: 12 }}>
      {text}
    </div>
  );
}

function Chip({ text, color }) {
  return (
    <span style={{ background: `${color}1A`, border: `1px solid ${color}40`, color, borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600 }}>
      {text}
    </span>
  );
}

function SmallMetric({ title, value, color }) {
  return (
    <div style={{ background: "#FDFCFA", border: "1px solid #E8E4DC", borderRadius: 8, padding: 8 }}>
      <div style={{ fontSize: 10, color: "#A0AEC0", textTransform: "uppercase", letterSpacing: 1 }}>{title}</div>
      <div style={{ color, fontSize: 14, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Insight({ title, text }) {
  return (
    <div style={{ background: "#FDFCFA", border: "1px solid #E8E4DC", borderRadius: 10, padding: 12 }}>
      <div style={{ color: "#1B2B4B", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{title}</div>
      <div style={{ color: "#718096", fontSize: 12, lineHeight: 1.6 }}>{text}</div>
    </div>
  );
}

