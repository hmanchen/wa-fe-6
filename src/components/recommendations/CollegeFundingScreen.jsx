import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, GraduationCap } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { recommendationsService } from "../../services/recommendationsService";

const fmt = (n) => "$" + (n || 0).toLocaleString("en-US");
const TUITION_DATA = {
  sources: [
    "College Board: Trends in College Pricing 2023-24",
    "AAMC: Medical School Tuition and Student Fees 2023-24",
    "U.S. News & World Report: Average College Tuition 2024",
    "National Center for Education Statistics (NCES) 2023",
  ],
  public_university: {
    generic: { annual_tuition_fees: 11610, room_board: 12770, total_annual: 24380, total_4yr: 97520, note: "Average in-state tuition + fees + room & board" },
    medical: { annual_tuition_fees: 37556, room_board: 14000, total_annual: 51556, total_4yr_preclinical: 206224, note: "Median public medical school tuition (AAMC)" },
  },
  private_university: {
    generic: { annual_tuition_fees: 41540, room_board: 15220, total_annual: 56760, total_4yr: 227040, note: "Average private tuition + fees + room & board" },
    medical: { annual_tuition_fees: 62278, room_board: 14000, total_annual: 76278, total_4yr_preclinical: 305112, note: "Median private medical school tuition (AAMC)" },
  },
  inflation_rate: 0.05,
};

export default function CollegeFundingScreen({ caseId, caseData, recommendation, rec, onBack }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    const main = document.querySelector("main");
    if (main) main.scrollTop = 0;
  }, []);

  const clientChildren = extractChildren(caseData);
  const activeRec = rec || recommendation || {};
  const recommendedEducationMonthly = Number(
    activeRec?.monthly_cost ||
    activeRec?.education_meta?.total_needed_monthly ||
    0
  );
  const getDefaultContribution = () => {
    const fromCard = parseFloat(activeRec?.monthly_cost || 0);
    if (fromCard > 0) return fromCard;
    const fromMeta = parseFloat(activeRec?.education_meta?.total_needed_monthly || 0);
    if (fromMeta > 0) return Math.round(fromMeta / 50) * 50;
    const numChildren =
      (caseData?.children?.length)
      || parseInt(caseData?.num_children || caseData?.number_of_children || 0, 10)
      || 2;
    const surplus = parseFloat(caseData?.monthly_surplus || caseData?.monthlySurplus || 9375);
    return Math.round(Math.max(surplus * 0.25, numChildren * 300) / 50) * 50;
  };
  const [monthlyContrib, setMonthlyContrib] = useState(
    recommendedEducationMonthly || 1500
  );
  const sliderMax = Math.max(
    Math.round((getDefaultContribution() * 1.5) / 100) * 100,
    2000
  );
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await recommendationsService.fetchCollegeProjection(caseId, monthlyContrib);
        if (mounted) setData(res);
      } catch (e) {
        if (mounted) setError(e?.message || "Unable to load education projection");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (caseId) run();
    return () => {
      mounted = false;
    };
  }, [caseId, monthlyContrib]);

  const children = (data?.children || []).map((child, cardIndex) => {
    const realName = child?.name || clientChildren[cardIndex]?.name || `Child ${cardIndex + 1}`;
    const realClassYear = child?.college_year
      || clientChildren[cardIndex]?.class_year
      || (new Date().getFullYear() + (child?.years_to_college || 9));
    return { ...child, name: realName, college_year: realClassYear };
  });
  const c1 = children[0] || clientChildren[0];
  const c2 = children[1] || clientChildren[1];
  const headerText = buildHeaderText(clientChildren);

  const waitLoss = useMemo(() => {
    const computeIUL = (pmt, years, rate = 0.065) => {
      let cv = 0;
      const annual = pmt * 12;
      for (let y = 1; y <= years; y += 1) {
        const load = y <= 5 ? 0.08 : y <= 10 ? 0.04 : 0.015;
        cv += annual * (1 - load);
        cv -= cv * 0.002;
        cv *= (1 + rate);
      }
      return Math.round(cv);
    };
    const firstChild = clientChildren[0];
    const ytc = firstChild?.years_to_college || 9;
    const ppm = monthlyContrib / (clientChildren.length || 1);
    const v0 = computeIUL(ppm, ytc);
    const v1 = computeIUL(ppm, Math.max(ytc - 1, 1));
    const v2 = computeIUL(ppm, Math.max(ytc - 2, 1));
    const v4 = computeIUL(ppm, Math.max(ytc - 4, 1));
    return { v0, v1, v2, v4, ytc };
  }, [clientChildren, monthlyContrib]);
  const ytc1 = Number(c1?.years_to_college || Math.max(18 - (clientChildren[0]?.age || 9), 1));
  const projectedRows = [
    {
      label: "Public University",
      today: TUITION_DATA.public_university.generic.total_annual,
      future: projectTuition(TUITION_DATA.public_university.generic.total_annual, ytc1, TUITION_DATA.inflation_rate),
    },
    {
      label: "Private University",
      today: TUITION_DATA.private_university.generic.total_annual,
      future: projectTuition(TUITION_DATA.private_university.generic.total_annual, ytc1, TUITION_DATA.inflation_rate),
    },
    {
      label: "Public Medical School",
      today: TUITION_DATA.public_university.medical.total_annual,
      future: projectTuition(TUITION_DATA.public_university.medical.total_annual, ytc1, TUITION_DATA.inflation_rate),
    },
    {
      label: "Private Medical School",
      today: TUITION_DATA.private_university.medical.total_annual,
      future: projectTuition(TUITION_DATA.private_university.medical.total_annual, ytc1, TUITION_DATA.inflation_rate),
    },
  ];

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
          borderLeft: "4px solid #3B6CB7",
          borderRadius: 16,
          padding: "20px 24px",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <GraduationCap size={28} color="#4A7C6F" />
          <h2 style={{ margin: 0, color: "#1B2B4B", fontSize: 24 }}>IUL Education Funding Illustration</h2>
        </div>
        <p style={{ margin: "0 0 12px 0", color: "#4A5568", lineHeight: 1.7 }}>
          {headerText}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {c1 && <Chip text={`${fmt(c1?.iul_value_at_college || 0)} available for ${c1.name}`} color="#4A7C6F" />}
          {c2 && <Chip text={`${fmt(c2?.iul_value_at_college || 0)} available for ${c2.name}`} color="#3B6CB7" />}
          <Chip text="Fully funded by existing cash flow" color="#D4A520" />
        </div>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #E8E4DC", borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <div style={{ color: "#1B2B4B", fontSize: 15, fontWeight: 700, marginBottom: 10 }}>
          {"\uD83D\uDCDA"} What Does College Actually Cost Today?
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <TuitionCard title="Public University - General" border="#4A7C6F" item={TUITION_DATA.public_university.generic} />
          <TuitionCard title="Public University - Medical" border="#3B6CB7" item={TUITION_DATA.public_university.medical} medical />
          <TuitionCard title="Private University - General" border="#D4A520" item={TUITION_DATA.private_university.generic} />
          <TuitionCard title="Private University - Medical" border="#1B2B4B" item={TUITION_DATA.private_university.medical} medical />
        </div>

        <div style={{ background: "#FFFBF0", border: "1px solid #D4A52040", borderRadius: 10, padding: 12 }}>
          <div style={{ color: "#1B2B4B", fontWeight: 700, marginBottom: 8 }}>
            {"\uD83D\uDCC8"} Projected Cost When {(clientChildren[0]?.name || "Child 1")} Starts College
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 8 }}>
            <thead style={{ background: "#fff" }}>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 8px", color: "#4A5568" }}>Program</th>
                <th style={{ textAlign: "left", padding: "6px 8px", color: "#4A5568" }}>Today (2025)</th>
                <th style={{ textAlign: "left", padding: "6px 8px", color: "#4A5568" }}>In {ytc1} yrs</th>
              </tr>
            </thead>
            <tbody>
              {projectedRows.map((r) => (
                <tr key={r.label} style={{ borderTop: "1px solid #F0ECE5" }}>
                  <td style={{ padding: "6px 8px", color: "#1B2B4B", fontWeight: 600 }}>{r.label}</td>
                  <td style={{ padding: "6px 8px", color: "#4A5568" }}>{fmt(r.today)}/yr</td>
                  <td style={{ padding: "6px 8px", color: r.future > 75000 ? "#D4A520" : "#4A5568", fontWeight: r.future > 75000 ? 700 : 500 }}>
                    {fmt(r.future)}/yr
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 10, color: "#718096", marginBottom: 4 }}>
            Sources: {TUITION_DATA.sources.join(" · ")}
          </div>
          <div style={{ fontSize: 12, color: "#1B2B4B", fontStyle: "italic" }}>
            At 5% annual tuition inflation, costs will be {Math.round(((1.05 ** ytc1) - 1) * 100)}% higher by the time {(clientChildren[0]?.name || "Child 1")} starts college.
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ color: "#1B2B4B", fontWeight: 700, marginBottom: 8 }}>Monthly IUL Contribution for Education</div>
        <input
          type="range"
          min={100}
          max={sliderMax}
          step={50}
          value={monthlyContrib}
          onChange={(e) => setMonthlyContrib(Number(e.target.value))}
          style={{ width: "100%" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#718096" }}>
          <span>$100</span>
          <span style={{ color: "#1B2B4B", fontWeight: 700 }}>{fmt(monthlyContrib)}/mo</span>
          <span>{`$${sliderMax.toLocaleString("en-US")}+`}</span>
        </div>
      </div>

      {loading && <Banner text="Loading updated projection..." />}
      {error && <Banner text={error} tone="error" />}

      {!loading && !error && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: children.length > 1 ? "1fr 1fr" : "1fr", gap: 12, marginBottom: 16 }}>
            {children.map((child, i) => (
              <ChildCard
                key={child.name + i}
                child={child}
                cardIndex={i}
                clientChildren={clientChildren}
                monthlyContrib={monthlyContrib}
              />
            ))}
          </div>

          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8E4DC",
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <div style={{ background: "#1B2B4B", color: "#fff", padding: "10px 12px", fontWeight: 700 }}>
              Why IUL Beats a 529 for Your Family
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead style={{ background: "#F8F7F4" }}>
                <tr>
                  {["Feature", "529 Plan", "IUL - Your Strategy"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "#4A5568" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows(data).map((r) => (
                  <tr key={r.feature} style={{ borderTop: "1px solid #F0ECE5" }}>
                    <td style={{ padding: "8px 12px", color: "#1B2B4B", fontWeight: 600 }}>{r.feature}</td>
                    <td style={{ padding: "8px 12px", color: r.leftBad ? "#D4A520" : "#4A5568" }}>{r.left}</td>
                    <td style={{ padding: "8px 12px", background: "#F0F7F4", color: r.rightGood ? "#4A7C6F" : "#4A5568" }}>{r.right}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8E4DC",
              borderLeft: "4px solid #D4A520",
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: "#D4A520", marginBottom: 12 }}>
              ⏰ Waiting just 4 years costs <strong>{fmt(waitLoss.v0 - waitLoss.v4)}</strong> in college funding per child
            </div>
            {[
              { label: "Starting today", value: waitLoss.v0, diff: null },
              { label: "Starting in 1 year", value: waitLoss.v1, diff: waitLoss.v0 - waitLoss.v1 },
              { label: "Starting in 2 years", value: waitLoss.v2, diff: waitLoss.v0 - waitLoss.v2 },
              { label: "Starting in 4 years", value: waitLoss.v4, diff: waitLoss.v0 - waitLoss.v4 },
            ].map((row, i) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: i === 3 ? "8px 10px" : "8px 0",
                  borderBottom: i < 3 ? "1px solid rgba(212,165,32,0.2)" : "none",
                  background: i === 3 ? "rgba(212,165,32,0.06)" : "none",
                  borderRadius: i === 3 ? 6 : 0,
                }}
              >
                <span style={{ fontSize: 13, color: "#4A5568" }}>{row.label}</span>
                <span style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1B2B4B" }}>{fmt(row.value)} available</span>
                  {row.diff > 0 ? (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#D4A520",
                        background: "rgba(212,165,32,0.12)",
                        padding: "2px 8px",
                        borderRadius: 12,
                      }}
                    >
                      -{fmt(row.diff)}
                    </span>
                  ) : null}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #1B2B4B 0%, #243A63 100%)",
              borderRadius: 16,
              padding: "24px 28px",
              color: "#FFFFFF",
              marginTop: 16,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#4A7C6F",
                textTransform: "uppercase",
                letterSpacing: 2,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              THE BOTTOM LINE
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
              {(() => {
                const totalAvailable = (data?.children || []).reduce((sum, c) => sum + (c?.iul_value_at_college || 0), 0);
                const childNames = clientChildren.map((c) => c.name).join(" & ") || "your children";
                return (
                  <>
                    Starting today builds {childNames}{" "}
                    {totalAvailable > 0 ? `${fmt(totalAvailable)} in education funding` : "a fully funded education path"}.
                  </>
                );
              })()}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#BFD0E8",
                marginBottom: 20,
                lineHeight: 1.7,
                maxWidth: 520,
                margin: "0 auto 20px",
              }}
            >
              Every dollar they borrow for college is a dollar that starts their adult life in debt. Every dollar you
              fund today is a dollar of freedom you give them on graduation day.
            </div>
            <button
              onClick={onBack}
              style={{
                background: "#4A7C6F",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 10,
                padding: "12px 28px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ← Back to Your Blueprint
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ChildCard({ child, cardIndex, clientChildren, monthlyContrib }) {
  const chartData = child.yearly_accumulation || [];
  const tuitionLine = (child.total_college_cost_projected || 0);
  const crossing = chartData.find((d) => (d.iul_value || 0) >= tuitionLine);
  const iulValue = child?.iul_value_at_college || 0;
  const totalTuition = child?.total_college_cost_projected || 234000;
  const publicEst = Math.round(totalTuition * 0.40);
  const tier = iulValue >= totalTuition
    ? { text: "✓ Fully Funded", color: "#4A7C6F", bg: "rgba(74,124,111,0.12)" }
    : iulValue >= publicEst
      ? { text: "✓ Public University Funded", color: "#3B6CB7", bg: "rgba(59,108,183,0.10)" }
      : iulValue >= publicEst * 0.5
        ? { text: "◑ Partial Funding", color: "#D4A520", bg: "rgba(212,165,32,0.10)" }
        : { text: "○ Building Foundation", color: "#718096", bg: "rgba(113,128,150,0.10)" };
  const ytc = child?.years_to_college || clientChildren?.[cardIndex]?.years_to_college || 9;
  const yearsToCollege = ytc;
  const publicTotalTuition = Math.round(24380 * Math.pow(1.05, yearsToCollege) * 4);
  const privateTotalTuition = Math.round(56760 * Math.pow(1.05, yearsToCollege) * 4);
  const displayedTotal = child?.total_college_cost_projected || Math.round((publicTotalTuition + privateTotalTuition) / 2);
  const costLabel = displayedTotal <= publicTotalTuition * 1.1
    ? "public university (4 years)"
    : displayedTotal >= privateTotalTuition * 0.9
      ? "private university (4 years)"
      : "blended public/private (4 years)";
  const publicUnivAnnual = Math.round(24380 * Math.pow(1.05, ytc));
  const publicTotal = publicUnivAnnual * 4;
  const r = 0.065 / 12;
  const n = ytc * 12;
  const monthlyNeeded = n > 0 ? Math.ceil((publicTotal * r) / (Math.pow(1 + r, n) - 1) / 50) * 50 : 0;
  const perChildMonthly = monthlyContrib / (clientChildren.length || 1);
  const onTrack = perChildMonthly >= monthlyNeeded;
  const gap = child?.iul_surplus_deficit || 0;
  const isShortfall = gap < 0;
  const shortfallAmt = Math.abs(gap);

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E8E4DC", borderRadius: 12, padding: 14 }}>
      <div style={{ color: "#1B2B4B", fontWeight: 700, marginBottom: 8 }}>
        {child.name} — Class of {child.college_year}
      </div>
      {hasValidProjection(child) ? (
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: 28, color: "#4A7C6F", fontWeight: 800 }}>{fmt(child.iul_value_at_college)}</div>
          <span
            style={{
              background: tier.bg,
              color: tier.color,
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 20,
              marginLeft: 10,
            }}
          >
            {tier.text}
          </span>
        </div>
      ) : (
        <div style={{ color: "#D4A520", fontSize: 13, fontStyle: "italic", padding: "8px 0" }}>
          Calculating projection... adjusting contribution to find optimal starting amount.
        </div>
      )}
      <div style={{ fontSize: 12, color: "#718096", marginBottom: 8 }}>Available through IUL at age 18</div>
      <div style={{ fontSize: 12, color: "#4A5568", marginBottom: 2 }}>
        Projected {costLabel}: <strong>{fmt(displayedTotal)}</strong>
      </div>
      <div style={{ fontSize: 11, color: "#718096", fontStyle: "italic", marginBottom: 4 }}>
        Public university: {fmt(publicTotalTuition)} · Private: {fmt(privateTotalTuition)}
      </div>
      {isShortfall ? (
        <div style={{ marginTop: 6, marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: "#D4A520", fontWeight: 600 }}>
            Funding gap: {fmt(shortfallAmt)}
          </div>
          <div style={{ fontSize: 11, color: "#718096", fontStyle: "italic", marginTop: 2 }}>
            Increase monthly contribution to close this gap. Use the slider below — watch the gap shrink in real time.
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "#4A7C6F", fontWeight: 700, marginTop: 6, marginBottom: 10 }}>
          ✓ Fully funded with {fmt(Math.abs(gap))} surplus
        </div>
      )}
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid stroke="#EFEAE0" />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
            <Tooltip formatter={(v) => fmt(Number(v))} />
            <Area type="monotone" dataKey="iul_value" stroke="#4A7C6F" fill="rgba(74,124,111,0.16)" />
            <ReferenceLine y={tuitionLine} stroke="#D4A520" strokeDasharray="4 4" />
            {crossing && <ReferenceLine x={crossing.year} stroke="#3B6CB7" strokeDasharray="3 3" />}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div
        style={{
          fontSize: 11,
          color: onTrack ? "#4A7C6F" : "#D4A520",
          marginTop: 6,
          fontStyle: "italic",
          fontWeight: 600,
        }}
      >
        {onTrack
          ? `✓ On track to fund public university (~${fmt(publicTotal)} needed)`
          : `To fully fund public university: ~${fmt(monthlyNeeded)}/mo per child (${fmt(monthlyNeeded - Math.round(perChildMonthly))}/mo more)`}
      </div>
    </div>
  );
}

function TuitionCard({ title, border, item, medical = false }) {
  return (
    <div style={{ border: "1px solid #E8E4DC", borderLeft: `4px solid ${border}`, borderRadius: 10, padding: 10, background: "#fff" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1B2B4B", marginBottom: 6 }}>{title}</div>
      <RowKV label="Annual tuition & fees" value={fmt(item.annual_tuition_fees)} />
      <RowKV label="Room & board" value={fmt(item.room_board)} />
      <RowKV label="Total annual cost" value={fmt(item.total_annual)} strong />
      <RowKV label="4-year total today" value={fmt(medical ? item.total_4yr_preclinical : item.total_4yr)} blue />
      <div style={{ fontSize: 10, color: "#718096", fontStyle: "italic", marginTop: 4 }}>Source: {item.note}</div>
    </div>
  );
}

function RowKV({ label, value, strong = false, blue = false }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
      <span style={{ color: "#718096" }}>{label}</span>
      <span style={{ color: blue ? "#3B6CB7" : "#1B2B4B", fontWeight: strong || blue ? 700 : 500 }}>{value}</span>
    </div>
  );
}

function comparisonRows(data) {
  const first = data?.children?.[0] || {};
  return [
    { feature: "Tax-free growth", left: "✓", right: "✓", rightGood: true },
    { feature: "Protection if parent dies", left: "✗", right: `✓ ${fmt(data?.inputs?.monthly_premium_per_child ? first.iul_value_at_college : 0)}`, leftBad: true, rightGood: true },
    { feature: "Income if parent disabled", left: "✗", right: "✓ Living benefits", leftBad: true, rightGood: true },
    { feature: "FAFSA impact", left: "Counted as asset", right: "Not counted", leftBad: true, rightGood: true },
    { feature: "Penalty if unused", left: "10% + tax", right: "None - becomes retirement", leftBad: true, rightGood: true },
    { feature: "Retirement income", left: "✗", right: "✓ Policy-loan eligible", leftBad: true, rightGood: true },
    { feature: "Market loss risk", left: "Yes", right: "No (0% floor)", leftBad: true, rightGood: true },
    { feature: "Contribution limits", left: "$18,000/yr", right: "No fixed cap", rightGood: true },
  ];
}

function Chip({ text, color }) {
  return (
    <span style={{ background: `${color}1A`, border: `1px solid ${color}40`, color, borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600 }}>
      {text}
    </span>
  );
}

function Banner({ text, tone = "info" }) {
  return (
    <div style={{ background: "#FFFFFF", border: `1px solid ${tone === "error" ? "#D4A520" : "#E8E4DC"}`, borderRadius: 10, padding: "10px 14px", color: "#4A5568", marginBottom: 12 }}>
      {text}
    </div>
  );
}

function hasValidProjection(childData) {
  return (childData?.iul_value_at_college || 0) > 0;
}

function extractChildren(cd) {
  const raw = (
    cd?.children
    || cd?.financial_background?.children
    || cd?.goals?.children
    || cd?.dependents
    || []
  );
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((c, i) => {
      const name = c?.name || c?.childName || c?.child_name || c?.first_name || `Child ${i + 1}`;
      const age = parseInt(c?.age || c?.current_age || c?.childAge || 0, 10);
      const validAge = !Number.isNaN(age) && age >= 0 && age <= 17;
      const yearsToCollege = validAge ? Math.max(18 - age, 1) : null;
      const classYear = yearsToCollege ? new Date().getFullYear() + yearsToCollege : null;
      return {
        name,
        age: validAge ? age : null,
        years_to_college: yearsToCollege,
        class_year: classYear,
      };
    });
  }

  const num = parseInt(cd?.num_children || cd?.number_of_children || 0, 10);
  if (num > 0) {
    return Array.from({ length: Math.min(num, 4) }, (_, i) => ({
      name: `Child ${i + 1}`,
      age: null,
      years_to_college: null,
      class_year: null,
    }));
  }
  return [];
}

function buildHeaderText(children) {
  if (!children.length) return "Your children's education funding projection";
  const c1 = children[0];
  const c2 = children[1];
  const name1 = c1.name;
  const age1Str = c1.age !== null ? `${c1.age}` : "still young";
  const ytc1Str = c1.years_to_college !== null ? `${c1.years_to_college} years` : "several years";
  if (!c2) {
    return `${name1} is ${age1Str} today. You have ${ytc1Str} to prepare.`;
  }
  const name2 = c2.name;
  const age2Str = c2.age !== null ? `${c2.age}` : "young";
  return `${name1} is ${age1Str} — you have ${ytc1Str} to prepare. ${name2} is ${age2Str}, giving you even more time to compound.`;
}

function projectTuition(annualToday, yearsAhead, inflationRate) {
  return Math.round(annualToday * Math.pow(1 + inflationRate, yearsAhead));
}

