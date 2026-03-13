import { Button } from "@/components/ui/button";
import { COLORS } from "./utils";

const TITLES = {
  RATE_LIMIT: "Engine Busy",
  PARSE_ERROR: "Analysis Incomplete",
  NETWORK_ERROR: "Connection Failed",
  AUTH_ERROR: "Authentication Error",
  GENERIC: "Analysis Failed",
};

export default function ErrorScreen({ error, onRetry, onSkip }) {
  const title = TITLES[error?.type] || TITLES.GENERIC;
  return (
    <div
      className="mb-4 rounded-xl border p-5"
      style={{ background: COLORS.bg, borderColor: COLORS.red, color: COLORS.text }}
    >
      <p className="text-base font-bold text-red-400">⚠️ {title}</p>
      <p className="mt-1 text-sm" style={{ color: COLORS.sub }}>{error?.message}</p>
      <div className="mt-4 flex items-center gap-2">
        <Button onClick={onRetry}>Try Again</Button>
        <button
          type="button"
          className="text-sm underline"
          onClick={onSkip}
          style={{ color: COLORS.muted }}
        >
          Skip Analysis
        </button>
      </div>
    </div>
  );
}
