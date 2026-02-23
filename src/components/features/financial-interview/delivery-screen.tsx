"use client";

import { useState } from "react";
import { FileDown, Loader2, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";

interface DeliveryScreenProps {
  caseId: string;
  clientNames: string;
}

const PDF_SECTIONS = [
  { label: "Cover Page", description: "Family name, date, advisor details" },
  { label: "Your Family Snapshot", description: "Household summary & key figures" },
  { label: "Your Goals & Priorities", description: "Visual ranking of client priorities" },
  { label: "The Protection Gap", description: "X-Curve visual + needs breakdown" },
  { label: "Your Tax Strategy", description: "3-bucket tax diversification visual" },
  { label: "Roth vs 7702", description: "Which is right for you?" },
  { label: "College Planning Outlook", description: "529 vs IUL funding comparison" },
  { label: "Retirement Income Strategy", description: "Annuity/FIA comparison" },
  { label: "Our Recommendations", description: "Prioritized action items" },
  { label: "Next Steps & Timeline", description: "Implementation roadmap" },
  { label: "Disclosures & Compliance", description: "Required regulatory disclosures" },
];

export function DeliveryScreen({ caseId, clientNames }: DeliveryScreenProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const { data } = await apiClient.post<any>("/pdf/generate", { case_id: caseId }, { responseType: "blob" });
      const blob = data instanceof Blob ? data : new Blob([JSON.stringify(data)], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `WealthArchitect-${clientNames.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setIsGenerated(true);
    } catch (err: any) {
      setError(err.message || "PDF generation failed. Please ensure all prior sections are complete.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-0">
      <div className="flex items-center gap-3 rounded-t-xl border-b bg-muted/30 px-4 py-2.5">
        <h2 className="text-base font-bold">Delivery</h2>
        <span className="text-xs text-muted-foreground">Generate Client PDF Presentation</span>
      </div>

      <div className="space-y-6 p-6">
        {/* PDF Preview outline */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-900/30">
              <FileText className="size-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Client Financial Plan</h3>
              <p className="text-sm text-muted-foreground">{clientNames} · {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>

          <p className="mb-4 text-sm text-muted-foreground">
            The PDF will include the following sections, compiled from data captured during the interview and AI-generated insights:
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            {PDF_SECTIONS.map((sec, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border bg-muted/20 px-4 py-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                <div>
                  <p className="text-sm font-medium">{sec.label}</p>
                  <p className="text-xs text-muted-foreground">{sec.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-8 shadow-sm">
          {isGenerated ? (
            <>
              <CheckCircle2 className="size-12 text-emerald-500" />
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">PDF Generated Successfully</p>
              <p className="text-sm text-muted-foreground">The file has been downloaded to your computer.</p>
              <Button variant="outline" onClick={handleGenerate}>
                <FileDown className="mr-2 size-4" /> Download Again
              </Button>
            </>
          ) : (
            <>
              <FileDown className="size-12 text-indigo-500" />
              <p className="text-lg font-bold">Ready to Generate</p>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                This will compile all interview data, computations, and AI insights into a professional PDF presentation for the client.
              </p>
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400">
                  {error}
                </div>
              )}
              <Button size="lg" onClick={handleGenerate} disabled={isGenerating} className="gap-2">
                {isGenerating ? (
                  <><Loader2 className="size-5 animate-spin" /> Generating PDF...</>
                ) : (
                  <><FileDown className="size-5" /> Generate Client PDF</>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
