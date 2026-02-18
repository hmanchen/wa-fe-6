"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CaseForm } from "@/components/features/cases/case-form";
import { useCreateCase } from "@/hooks/use-cases";
import { toast } from "sonner";
import type { CreateCaseInput } from "@/lib/validators/case";
import {
  Lightbulb,
  Shield,
  FileCheck,
  Users,
  ClipboardList,
  ArrowRight,
} from "lucide-react";

function NewCaseGuide() {
  return (
    <div className="sticky top-4 space-y-5">
      {/* Quick tips */}
      <div className="rounded-lg border bg-muted/20 p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Getting Started
          </h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <ClipboardList className="mt-0.5 size-3.5 shrink-0 text-blue-500" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Fill in the client&apos;s personal details accurately — this data
              flows into all subsequent analysis and reports.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Users className="mt-0.5 size-3.5 shrink-0 text-indigo-500" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              If the client is married, spouse information will appear
              automatically — both profiles are needed for comprehensive
              planning.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="mt-0.5 size-3.5 shrink-0 text-green-500" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              All data is encrypted and stored securely. Only you (the
              advisor) can access this case.
            </p>
          </div>
        </div>
      </div>

      {/* Workflow overview */}
      <div className="rounded-lg border bg-muted/20 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Lightbulb className="size-3.5 text-amber-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What happens next
          </h3>
        </div>
        <ol className="space-y-2.5">
          {[
            { step: "1", label: "Create Case", desc: "You are here", active: true },
            { step: "2", label: "Discovery", desc: "Financial profile, coverage & goals" },
            { step: "3", label: "Financial Interview", desc: "Deep-dive with education & diagrams" },
            { step: "4", label: "Needs Analysis", desc: "Calculate coverage gaps" },
            { step: "5", label: "Recommendations", desc: "Tailored product suggestions" },
            { step: "6", label: "Report", desc: "Professional presentation" },
          ].map((item) => (
            <li key={item.step} className="flex items-start gap-2.5">
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  item.active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {item.step}
              </span>
              <div className="min-w-0">
                <p className={`text-xs font-medium ${item.active ? "text-foreground" : "text-muted-foreground"}`}>
                  {item.label}
                </p>
                <p className="text-[11px] text-muted-foreground/70">
                  {item.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Case type guide */}
      <div className="rounded-lg border bg-muted/20 p-4">
        <div className="mb-3 flex items-center gap-2">
          <FileCheck className="size-3.5 text-violet-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Case Type Guide
          </h3>
        </div>
        <div className="space-y-2">
          {[
            { type: "Life Insurance", desc: "Term, perm, IUL analysis" },
            { type: "Retirement Planning", desc: "401k, IRA, Roth optimization" },
            { type: "Estate Planning", desc: "Wills, trusts, wealth transfer" },
            { type: "Comprehensive", desc: "Full financial needs analysis" },
          ].map((item) => (
            <div key={item.type} className="flex items-start gap-2">
              <ArrowRight className="mt-0.5 size-3 shrink-0 text-muted-foreground/50" />
              <div>
                <p className="text-xs font-medium">{item.type}</p>
                <p className="text-[11px] text-muted-foreground/70">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NewCasePage() {
  const router = useRouter();
  const createCase = useCreateCase();

  async function handleSubmit(values: CreateCaseInput) {
    try {
      const caseData = await createCase.mutateAsync(values);
      toast.success("Case created successfully");
      router.push(`/cases/${caseData.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to create case: ${message}`);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:space-y-8 sm:p-6">
      <PageHeader
        title="Create New Case"
        description="Start a new client case for insurance and financial planning"
      />

      <div className="flex gap-0">
        {/* Left: Form — aligned left */}
        <div className="min-w-0 max-w-2xl flex-1 pr-6">
          <CaseForm
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            isLoading={createCase.isPending}
          />
        </div>

        {/* Vertical divider */}
        <div className="hidden self-stretch md:block">
          <div className="h-full w-px bg-gradient-to-b from-border/60 via-border/30 to-transparent" />
        </div>

        {/* Right: Educational content */}
        <aside className="hidden w-72 shrink-0 pl-6 md:block lg:w-80">
          <NewCaseGuide />
        </aside>
      </div>
    </div>
  );
}
