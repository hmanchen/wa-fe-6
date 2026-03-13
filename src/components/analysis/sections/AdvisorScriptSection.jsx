export default function AdvisorScriptSection({ data }) {
  const s = data?.advisorScript || {};
  const blocks = [
    ["OPENING STATEMENT", s.openingStatement],
    ["KEY INSIGHT", s.keyInsight],
    ["THIS WEEK'S ACTION", s.actionCall],
    ["CLOSING", s.closingStatement],
  ];

  return (
    <div className="rounded-xl border border-emerald-700 bg-[#0D2420] p-4 text-emerald-50">
      {blocks.map(([k, v]) => (
        <div key={k} className="mb-3 last:mb-0">
          <p className="text-xs font-bold tracking-wider text-emerald-300">{k}</p>
          <p className="mt-1 italic">{v || "No script returned."}</p>
        </div>
      ))}
    </div>
  );
}
