import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { COLORS } from "./utils";

export default function AnalysisLoadingScreen({ progress, clientName }) {
  return (
    <div
      className="mb-4 rounded-xl border p-8 text-center"
      style={{ background: COLORS.bg, borderColor: COLORS.border, color: COLORS.text }}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border" style={{ borderColor: COLORS.accent }}>
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: COLORS.accent }} />
      </div>
      <p className="text-base font-semibold" style={{ color: COLORS.accent }}>
        {progress.message || "Analyzing financial profile..."}
      </p>
      <p className="mt-1 text-sm" style={{ color: COLORS.sub }}>
        Analyzing {clientName || "client"}&apos;s complete financial picture...
      </p>
      <Progress value={progress.percent} className="mx-auto mt-4 max-w-xl" />
      <p className="mt-2 text-xs" style={{ color: COLORS.muted }}>{progress.percent}%</p>
    </div>
  );
}
