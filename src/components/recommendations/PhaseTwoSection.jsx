import { MapPin } from "lucide-react";

export default function PhaseTwoSection({ items }) {
  const milestones = (items || []).filter((item) => {
    const title = String(item?.title || "").toLowerCase();
    return !title.includes("529");
  });
  if (!milestones.length) return null;

  const defaultTimelines = ["Month 1-2", "Month 3-6", "Month 6-12", "Month 12-18"];
  const getMilestoneDate = (milestone, index) => {
    if (milestone?.date_label) return milestone.date_label;
    const today = new Date();
    const future = new Date(today.getFullYear(), today.getMonth() + ((index + 1) * 3), 1);
    const q = Math.floor(future.getMonth() / 3) + 1;
    return `Q${q} ${future.getFullYear()}`;
  };

  const hasEstateMilestone = milestones.some((m) =>
    ["estate", "will", "trust", "beneficiary"].some((w) =>
      String(m?.title || "").toLowerCase().includes(w)
    )
  );

  return (
    <div
      style={{
        background: "#F8F7F4",
        border: "1px solid #E8E4DC",
        borderRadius: 16,
        padding: "20px 24px",
        marginBottom: 16,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <MapPin size={16} color="#4A7C6F" />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1B2B4B" }}>
            📍 Your Action Plan — Next 18 Months
          </span>
        </div>
        <p style={{ fontSize: 12, color: "#718096", margin: 0, paddingLeft: 24 }}>
          {hasEstateMilestone
            ? "Starting with critical family protection documents, then building wealth systematically"
            : "These goals activate as your financial foundation strengthens"}
        </p>
      </div>

      {milestones.map((item, i) => {
        const isCritical = String(item?.priority || "").toLowerCase() === "critical";
        return (
        <div
          key={i}
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8E4DC",
            borderLeft: isCritical ? "4px solid #D4A520" : "4px solid #4A7C6F",
            borderRadius: 10,
            padding: "14px 18px",
            marginBottom: 10,
            position: "relative",
          }}
        >
          {isCritical && (
            <span
              style={{
                position: "absolute",
                top: 10,
                right: 14,
                background: "rgba(212,165,32,0.15)",
                color: "#B8860B",
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 12,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              ⚠️ Urgent
            </span>
          )}
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1B2B4B", marginBottom: 4 }}>
            {item.title}
          </div>
          <div style={{ fontSize: 12, color: "#4A5568", lineHeight: 1.6, marginBottom: 6 }}>
            {item.description || item.reason || item.revisitTimeline}
          </div>
          {item.estimated_cost && (
            <div style={{ fontSize: 11, color: "#718096", fontStyle: "italic" }}>
              Estimated cost: {item.estimated_cost}
            </div>
          )}
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: isCritical ? "#B8860B" : "#4A7C6F",
              marginTop: 6,
            }}
          >
            {getMilestoneDate(item, i) || item.estimatedTimeline || item.revisitTimeline || defaultTimelines[Math.min(i, defaultTimelines.length - 1)]}
          </div>
        </div>
      );})}
    </div>
  );
}
