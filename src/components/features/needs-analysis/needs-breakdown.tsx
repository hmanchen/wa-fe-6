"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatCurrency } from "@/lib/formatters/currency";
import type { NeedLineItem } from "@/types";

function labelFromCategory(category: string): string {
  return category
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export interface NeedsBreakdownProps {
  lineItems: NeedLineItem[];
}

export function NeedsBreakdown({ lineItems }: NeedsBreakdownProps) {
  if (lineItems.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center">
        <p className="text-muted-foreground text-sm">
          No needs breakdown data available
        </p>
      </div>
    );
  }

  const total = lineItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-4">
      <Accordion type="multiple" className="w-full" defaultValue={[]}>
        {lineItems.map((item) => (
          <AccordionItem key={item.category} value={item.category}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex w-full items-center justify-between pr-4">
                <span className="font-medium">
                  {item.label || labelFromCategory(item.category)}
                </span>
                <span className="text-muted-foreground font-mono text-sm tabular-nums">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {item.assumptions?.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                      Assumptions
                    </p>
                    <ul className="list-inside list-disc space-y-1 text-sm">
                      {item.assumptions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {item.notes && (
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                      Notes
                    </p>
                    <p className="text-sm">{item.notes}</p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="flex items-center justify-between border-t pt-4">
        <span className="font-semibold">Total</span>
        <span className="font-mono text-lg tabular-nums">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
