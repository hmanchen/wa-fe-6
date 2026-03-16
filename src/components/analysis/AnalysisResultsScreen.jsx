import { useState } from "react";
import { Button } from "@/components/ui/button";
import SummaryBanner from "./sections/SummaryBanner";
import BudgetAuditSection from "./sections/BudgetAuditSection";
import HousingAnalysisSection from "./sections/HousingAnalysisSection";
import CreditCardSection from "./sections/CreditCardSection";
import K401Section from "./sections/K401Section";
import HiddenMoneySection from "./sections/HiddenMoneySection";
import CollegeFundingSection from "./sections/CollegeFundingSection";
import ProtectionSection from "./sections/ProtectionSection";
import ActionPlanSection from "./sections/ActionPlanSection";
import AdvisorScriptSection from "./sections/AdvisorScriptSection";

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen((p) => !p)}
      >
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted-foreground">{open ? "Hide" : "Show"}</span>
      </button>
      {open && <div className="border-t px-4 py-3">{children}</div>}
    </div>
  );
}

export default function AnalysisResultsScreen({ data, onRerun }) {
  return (
    <div className="mb-4 space-y-3">
      <SummaryBanner data={data} />
      <Section title="Budget Audit"><BudgetAuditSection data={data} /></Section>
      <Section title="Housing Analysis"><HousingAnalysisSection data={data} /></Section>
      <Section title="Credit Card Analysis"><CreditCardSection data={data} /></Section>
      <Section title="401(k) Analysis"><K401Section data={data} /></Section>
      <Section title="Unallocated Surplus Report"><HiddenMoneySection data={data} /></Section>
      <Section title="College Funding Plan"><CollegeFundingSection data={data} /></Section>
      <Section title="Protection Analysis"><ProtectionSection data={data} /></Section>
      <Section title="Action Plan"><ActionPlanSection data={data} /></Section>
      <AdvisorScriptSection data={data} />
      <div className="flex justify-end">
        <Button variant="outline" onClick={onRerun}>Re-run Analysis</Button>
      </div>
    </div>
  );
}
