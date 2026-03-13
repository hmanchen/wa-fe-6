import { MapPin } from "lucide-react";

export default function PhaseTwoSection({ items }) {
  const filtered = (items || []).filter((item) => {
    const title = String(item?.title || "").toLowerCase();
    return !title.includes("529");
  });
  if (!filtered.length) return null;

  const defaultTimelines = ["Month 1-2", "Month 3-6", "Month 6-12", "Month 12-18"];

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
            Your 18-Month Financial Milestones
          </span>
        </div>
        <p style={{ fontSize: 12, color: "#718096", margin: 0, paddingLeft: 24 }}>
          These goals activate as your financial foundation strengthens
        </p>
      </div>

      {filtered.map((item, i) => (
        <div
          key={i}
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8E4DC",
            borderLeft: "3px solid #4A7C6F",
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div>
            <div style={{ color: "#1B2B4B", fontSize: 14, fontWeight: 600 }}>{item.title}</div>
            <div style={{ color: "#718096", fontSize: 12, marginTop: 3 }}>{item.reason || item.revisitTimeline}</div>
          </div>
          <span
            style={{
              border: "1px solid #4A7C6F40",
              color: "#4A7C6F",
              borderRadius: 20,
              padding: "3px 12px",
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: "nowrap",
              background: "#4A7C6F0D",
              flexShrink: 0,
            }}
          >
            {item.estimatedTimeline || item.revisitTimeline || defaultTimelines[Math.min(i, defaultTimelines.length - 1)]}
          </span>
        </div>
      ))}
    </div>
  );
}
