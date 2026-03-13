export const COLORS = {
  bg: "#0A0E1A",
  surface: "#111827",
  card: "#161D2E",
  border: "#1E2940",
  accent: "#00D4AA",
  gold: "#F5A623",
  red: "#FF4757",
  blue: "#4A90E2",
  text: "#E8EDF5",
  muted: "#6B7A99",
  sub: "#9BA8C0",
  dark: "#0D1525",
};

export function money(v) {
  const n = Number(v || 0);
  return `$${Math.round(n).toLocaleString()}`;
}

export function severityColor(type) {
  if (type === "CRITICAL") return COLORS.red;
  if (type === "HIGH") return COLORS.gold;
  return "#facc15";
}
