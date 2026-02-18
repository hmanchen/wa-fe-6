"use client";

import { useState, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, Building2, ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { PersonFinancialBackground, EmploymentRecord } from "@/types/financial-interview";

// ── Default empty record factories ───────────────────────────

function makeEmptyEmployment(): EmploymentRecord {
  return {
    id: crypto.randomUUID(),
    company: "",
    yearsEmployed: 0,
    isCurrent: false,
    has401k: false,
  };
}

function makeEmptyBackground(role: "primary" | "spouse"): PersonFinancialBackground {
  return {
    role,
    yearsInCountry: 0,
    countryOfResidence: "US",
    employmentHistory: [makeEmptyEmployment()],
    hsa: { hasHSA: false },
    ira: { hasIRA: false },
    rothIRA: { hasRothIRA: false },
    brokerage: { hasBrokerage: false },
    cd: { hasCDs: false },
    cashOnHand: { hasCashOnHand: false },
    systematicInvestments: { hasSystematicInvestments: false },
    fundsAbroad: { sendsFundsAbroad: false },
  };
}

// ── Helper: Currency input ───────────────────────────────────

function CurrencyInput({
  label,
  value,
  onChange,
  placeholder = "0",
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          $
        </span>
        <Input
          type="number"
          min={0}
          className="pl-7 text-sm"
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? undefined : Number(e.target.value))
          }
        />
      </div>
    </div>
  );
}

function PercentInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          min={0}
          max={100}
          className="pr-7 text-sm"
          placeholder="0"
          value={value ?? ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? undefined : Number(e.target.value))
          }
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          %
        </span>
      </div>
    </div>
  );
}

// ── Collapsible section toggle ───────────────────────────────

function ToggleSection({
  label,
  description,
  enabled,
  onToggle,
  children,
}: {
  label: string;
  description?: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>
      {enabled && (
        <div className="border-t px-4 py-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Employment card ──────────────────────────────────────────

function EmploymentCard({
  record,
  onChange,
  onRemove,
  canRemove,
}: {
  record: EmploymentRecord;
  onChange: (updated: EmploymentRecord) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [expanded, setExpanded] = useState(true);

  const update = (patch: Partial<EmploymentRecord>) =>
    onChange({ ...record, ...patch });

  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center gap-3 px-4 py-3"
        onClick={() => setExpanded(!expanded)}
      >
        <Building2 className="size-4 text-muted-foreground" />
        <span className="flex-1 text-sm font-medium">
          {record.company || "New Employer"}
          {record.isCurrent && (
            <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
              Current
            </span>
          )}
        </span>
        {canRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        )}
        {expanded ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </div>

      {expanded && (
        <div className="space-y-4 border-t px-4 py-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Company name</Label>
              <Input
                className="text-sm"
                placeholder="e.g. Cognizant"
                value={record.company}
                onChange={(e) => update({ company: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Years employed</Label>
              <Input
                type="number"
                min={0}
                className="text-sm"
                placeholder="0"
                value={record.yearsEmployed || ""}
                onChange={(e) =>
                  update({
                    yearsEmployed:
                      e.target.value === ""
                        ? 0
                        : parseInt(e.target.value, 10),
                  })
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={record.isCurrent}
              onCheckedChange={(v) => update({ isCurrent: v })}
            />
            <Label className="text-xs">Current employer</Label>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={record.has401k}
              onCheckedChange={(v) => update({ has401k: v })}
            />
            <Label className="text-xs">Has / Had 401(k) with this employer</Label>
          </div>

          {record.has401k && (
            <div className="space-y-4 rounded-md border bg-muted/30 p-3">
              {!record.isCurrent ? (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      What was done with the old 401(k)?
                    </Label>
                    <Select
                      value={record.previous401kAction ?? ""}
                      onValueChange={(v) =>
                        update({
                          previous401kAction: v as EmploymentRecord["previous401kAction"],
                        })
                      }
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rolled-over">
                          Rolled over to IRA
                        </SelectItem>
                        <SelectItem value="left-with-employer">
                          Left with previous employer
                        </SelectItem>
                        <SelectItem value="cashed-out">Cashed out</SelectItem>
                        <SelectItem value="converted-to-roth">
                          Converted to Roth
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <CurrencyInput
                    label="Balance (approx)"
                    value={record.previous401kBalance}
                    onChange={(v) => update({ previous401kBalance: v })}
                  />
                </>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <PercentInput
                      label="Employer match %"
                      value={record.employer401kMatchPercent}
                      onChange={(v) =>
                        update({ employer401kMatchPercent: v })
                      }
                    />
                    <PercentInput
                      label="Your contribution %"
                      value={record.employee401kContributionPercent}
                      onChange={(v) =>
                        update({ employee401kContributionPercent: v })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={record.is401kMaxedOut ?? false}
                      onCheckedChange={(v) =>
                        update({ is401kMaxedOut: v })
                      }
                    />
                    <Label className="text-xs">
                      Maxing out 401(k) contributions?
                    </Label>
                  </div>
                  <CurrencyInput
                    label="Current 401(k) balance"
                    value={record.current401kBalance}
                    onChange={(v) => update({ current401kBalance: v })}
                  />
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Form Component ──────────────────────────────────────

export interface Section1FormProps {
  defaultValues?: PersonFinancialBackground;
  role: "primary" | "spouse";
  onSubmit: (data: PersonFinancialBackground) => void | Promise<void>;
  onActiveStepChange?: (step: string) => void;
  isSubmitting?: boolean;
}

export function Section1Form({
  defaultValues,
  role,
  onSubmit,
  onActiveStepChange,
  isSubmitting = false,
}: Section1FormProps) {
  const [data, setData] = useState<PersonFinancialBackground>(
    defaultValues ?? makeEmptyBackground(role)
  );

  const update = useCallback(
    (patch: Partial<PersonFinancialBackground>) => {
      setData((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  const handleSubmit = () => {
    onSubmit(data);
  };

  // Notify parent which section the user is interacting with
  const notifyStep = (step: string) => {
    onActiveStepChange?.(step);
  };

  return (
    <div className="space-y-5">
      {/* ── Step 1: Background & Employment ── */}
      <div onFocus={() => notifyStep("background")} onClick={() => notifyStep("background")}>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Background & Employment
        </h3>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Country of residence</Label>
              <Select
                value={data.countryOfResidence}
                onValueChange={(v) => update({ countryOfResidence: v })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Years in country</Label>
              <Input
                type="number"
                min={0}
                className="text-sm"
                placeholder="e.g. 10"
                value={data.yearsInCountry || ""}
                onChange={(e) =>
                  update({
                    yearsInCountry:
                      e.target.value === ""
                        ? 0
                        : parseInt(e.target.value, 10),
                  })
                }
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Employment History
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() =>
                  update({
                    employmentHistory: [
                      ...data.employmentHistory,
                      makeEmptyEmployment(),
                    ],
                  })
                }
              >
                <Plus className="size-3" />
                Add employer
              </Button>
            </div>

            {data.employmentHistory.map((emp, idx) => (
              <EmploymentCard
                key={emp.id}
                record={emp}
                onChange={(updated) => {
                  const next = [...data.employmentHistory];
                  next[idx] = updated;
                  update({ employmentHistory: next });
                }}
                onRemove={() => {
                  update({
                    employmentHistory: data.employmentHistory.filter(
                      (_, i) => i !== idx
                    ),
                  });
                }}
                canRemove={data.employmentHistory.length > 1}
              />
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Step 2: HSA ── */}
      <div onFocus={() => notifyStep("hsa")} onClick={() => notifyStep("hsa")}>
        <ToggleSection
          label="Health Savings Account (HSA)"
          description="Triple tax-advantaged savings for medical expenses"
          enabled={data.hsa.hasHSA}
          onToggle={(v) =>
            update({ hsa: { ...data.hsa, hasHSA: v } })
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <CurrencyInput
              label="Annual contribution"
              value={data.hsa.annualContribution}
              onChange={(v) =>
                update({
                  hsa: { ...data.hsa, annualContribution: v },
                })
              }
            />
            <CurrencyInput
              label="Current balance"
              value={data.hsa.currentBalance}
              onChange={(v) =>
                update({
                  hsa: { ...data.hsa, currentBalance: v },
                })
              }
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Switch
              checked={data.hsa.isMaxedOut ?? false}
              onCheckedChange={(v) =>
                update({
                  hsa: { ...data.hsa, isMaxedOut: v },
                })
              }
            />
            <Label className="text-xs">Maxing out contributions?</Label>
          </div>
        </ToggleSection>
      </div>

      <Separator />

      {/* ── Step 3: IRA ── */}
      <div onFocus={() => notifyStep("ira")} onClick={() => notifyStep("ira")}>
        <ToggleSection
          label="Traditional IRA"
          description="Tax-deferred individual retirement account"
          enabled={data.ira.hasIRA}
          onToggle={(v) =>
            update({ ira: { ...data.ira, hasIRA: v } })
          }
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">IRA type</Label>
              <Select
                value={data.ira.type ?? ""}
                onValueChange={(v) =>
                  update({
                    ira: {
                      ...data.ira,
                      type: v as "traditional" | "sep" | "simple",
                    },
                  })
                }
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traditional">Traditional</SelectItem>
                  <SelectItem value="sep">SEP</SelectItem>
                  <SelectItem value="simple">SIMPLE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CurrencyInput
              label="Annual contribution"
              value={data.ira.annualContribution}
              onChange={(v) =>
                update({
                  ira: { ...data.ira, annualContribution: v },
                })
              }
            />
            <CurrencyInput
              label="Current balance"
              value={data.ira.currentBalance}
              onChange={(v) =>
                update({
                  ira: { ...data.ira, currentBalance: v },
                })
              }
            />
          </div>
        </ToggleSection>
      </div>

      <Separator />

      {/* ── Step 4: Roth IRA ── */}
      <div onFocus={() => notifyStep("rothIra")} onClick={() => notifyStep("rothIra")}>
        <ToggleSection
          label="Roth IRA"
          description="After-tax contributions, tax-free growth & withdrawals"
          enabled={data.rothIRA.hasRothIRA}
          onToggle={(v) =>
            update({
              rothIRA: { ...data.rothIRA, hasRothIRA: v },
            })
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <CurrencyInput
              label="Annual contribution"
              value={data.rothIRA.annualContribution}
              onChange={(v) =>
                update({
                  rothIRA: {
                    ...data.rothIRA,
                    annualContribution: v,
                  },
                })
              }
            />
            <CurrencyInput
              label="Current balance"
              value={data.rothIRA.currentBalance}
              onChange={(v) =>
                update({
                  rothIRA: {
                    ...data.rothIRA,
                    currentBalance: v,
                  },
                })
              }
            />
          </div>
        </ToggleSection>
      </div>

      <Separator />

      {/* ── Step 5: Brokerage ── */}
      <div onFocus={() => notifyStep("brokerage")} onClick={() => notifyStep("brokerage")}>
        <ToggleSection
          label="Brokerage Account"
          description="Taxable investment account (Robinhood, Fidelity, etc.)"
          enabled={data.brokerage.hasBrokerage}
          onToggle={(v) =>
            update({
              brokerage: { ...data.brokerage, hasBrokerage: v },
            })
          }
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Platform</Label>
              <Input
                className="text-sm"
                placeholder="e.g. Robinhood"
                value={data.brokerage.platform ?? ""}
                onChange={(e) =>
                  update({
                    brokerage: {
                      ...data.brokerage,
                      platform: e.target.value,
                    },
                  })
                }
              />
            </div>
            <CurrencyInput
              label="Current value"
              value={data.brokerage.currentValue}
              onChange={(v) =>
                update({
                  brokerage: {
                    ...data.brokerage,
                    currentValue: v,
                  },
                })
              }
            />
            <div className="space-y-1">
              <Label className="text-xs">Investment types</Label>
              <Input
                className="text-sm"
                placeholder="Stocks, ETFs, etc."
                value={data.brokerage.investmentTypes ?? ""}
                onChange={(e) =>
                  update({
                    brokerage: {
                      ...data.brokerage,
                      investmentTypes: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
        </ToggleSection>
      </div>

      <Separator />

      {/* ── Step 6: Certificates of Deposit (CDs) ── */}
      <div onFocus={() => notifyStep("cd")} onClick={() => notifyStep("cd")}>
        <ToggleSection
          label="Certificates of Deposit (CDs)"
          description="Fixed-term, FDIC-insured savings instruments"
          enabled={data.cd.hasCDs}
          onToggle={(v) =>
            update({ cd: { ...data.cd, hasCDs: v } })
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Institution</Label>
              <Input
                className="text-sm"
                placeholder="e.g. Marcus by Goldman Sachs"
                value={data.cd.institution ?? ""}
                onChange={(e) =>
                  update({
                    cd: { ...data.cd, institution: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Number of CDs</Label>
              <Input
                type="number"
                min={0}
                className="text-sm"
                placeholder="0"
                value={data.cd.numberOfCDs ?? ""}
                onChange={(e) =>
                  update({
                    cd: {
                      ...data.cd,
                      numberOfCDs:
                        e.target.value === ""
                          ? undefined
                          : parseInt(e.target.value, 10),
                    },
                  })
                }
              />
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <CurrencyInput
              label="Total value"
              value={data.cd.totalValue}
              onChange={(v) =>
                update({ cd: { ...data.cd, totalValue: v } })
              }
            />
            <PercentInput
              label="Best interest rate"
              value={data.cd.interestRate}
              onChange={(v) =>
                update({ cd: { ...data.cd, interestRate: v } })
              }
            />
            <div className="space-y-1">
              <Label className="text-xs">Longest term (months)</Label>
              <Input
                type="number"
                min={0}
                className="text-sm"
                placeholder="e.g. 12"
                value={data.cd.longestTermMonths ?? ""}
                onChange={(e) =>
                  update({
                    cd: {
                      ...data.cd,
                      longestTermMonths:
                        e.target.value === ""
                          ? undefined
                          : parseInt(e.target.value, 10),
                    },
                  })
                }
              />
            </div>
          </div>
        </ToggleSection>
      </div>

      <Separator />

      {/* ── Step 7: Cash on Hand ── */}
      <div onFocus={() => notifyStep("cashOnHand")} onClick={() => notifyStep("cashOnHand")}>
        <ToggleSection
          label="Cash on Hand"
          description="Checking, savings, and emergency fund balances"
          enabled={data.cashOnHand.hasCashOnHand}
          onToggle={(v) =>
            update({
              cashOnHand: { ...data.cashOnHand, hasCashOnHand: v },
            })
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <CurrencyInput
              label="Checking account balance"
              value={data.cashOnHand.checkingBalance}
              onChange={(v) =>
                update({
                  cashOnHand: {
                    ...data.cashOnHand,
                    checkingBalance: v,
                  },
                })
              }
            />
            <CurrencyInput
              label="Savings account balance"
              value={data.cashOnHand.savingsBalance}
              onChange={(v) =>
                update({
                  cashOnHand: {
                    ...data.cashOnHand,
                    savingsBalance: v,
                  },
                })
              }
            />
          </div>
          <div className="mt-3">
            <div className="space-y-1">
              <Label className="text-xs">Emergency fund target (months of expenses)</Label>
              <Input
                type="number"
                min={0}
                max={24}
                className="text-sm"
                placeholder="e.g. 6"
                value={data.cashOnHand.emergencyFundMonths ?? ""}
                onChange={(e) =>
                  update({
                    cashOnHand: {
                      ...data.cashOnHand,
                      emergencyFundMonths:
                        e.target.value === ""
                          ? undefined
                          : parseInt(e.target.value, 10),
                    },
                  })
                }
              />
            </div>
          </div>
        </ToggleSection>
      </div>

      <Separator />

      {/* ── Step 8: Systematic Investments ── */}
      <div onFocus={() => notifyStep("systematic")} onClick={() => notifyStep("systematic")}>
        <ToggleSection
          label="Other Systematic Investments"
          description="SIPs, recurring deposits, or other regular investments"
          enabled={data.systematicInvestments.hasSystematicInvestments}
          onToggle={(v) =>
            update({
              systematicInvestments: {
                ...data.systematicInvestments,
                hasSystematicInvestments: v,
              },
            })
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Input
                className="text-sm"
                placeholder="e.g. Monthly mutual fund SIP"
                value={data.systematicInvestments.description ?? ""}
                onChange={(e) =>
                  update({
                    systematicInvestments: {
                      ...data.systematicInvestments,
                      description: e.target.value,
                    },
                  })
                }
              />
            </div>
            <CurrencyInput
              label="Monthly amount"
              value={data.systematicInvestments.monthlyAmount}
              onChange={(v) =>
                update({
                  systematicInvestments: {
                    ...data.systematicInvestments,
                    monthlyAmount: v,
                  },
                })
              }
            />
          </div>
          <div className="mt-3">
            <CurrencyInput
              label="Current value"
              value={data.systematicInvestments.currentValue}
              onChange={(v) =>
                update({
                  systematicInvestments: {
                    ...data.systematicInvestments,
                    currentValue: v,
                  },
                })
              }
            />
          </div>
        </ToggleSection>
      </div>

      <Separator />

      {/* ── Step 7: Funds Abroad ── */}
      <div onFocus={() => notifyStep("fundsAbroad")} onClick={() => notifyStep("fundsAbroad")}>
        <ToggleSection
          label="Funds Sent Abroad"
          description="Regular remittances or transfers to another country"
          enabled={data.fundsAbroad.sendsFundsAbroad}
          onToggle={(v) =>
            update({
              fundsAbroad: {
                ...data.fundsAbroad,
                sendsFundsAbroad: v,
              },
            })
          }
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <CurrencyInput
              label="Monthly amount"
              value={data.fundsAbroad.monthlyAmount}
              onChange={(v) =>
                update({
                  fundsAbroad: {
                    ...data.fundsAbroad,
                    monthlyAmount: v,
                  },
                })
              }
            />
            <div className="space-y-1">
              <Label className="text-xs">Destination country</Label>
              <Input
                className="text-sm"
                placeholder="e.g. India"
                value={data.fundsAbroad.country ?? ""}
                onChange={(e) =>
                  update({
                    fundsAbroad: {
                      ...data.fundsAbroad,
                      country: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Purpose</Label>
              <Input
                className="text-sm"
                placeholder="Family support, investment, etc."
                value={data.fundsAbroad.purpose ?? ""}
                onChange={(e) =>
                  update({
                    fundsAbroad: {
                      ...data.fundsAbroad,
                      purpose: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
        </ToggleSection>
      </div>

      <Separator />

      {/* ── Submit ── */}
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save & Continue"}
        </Button>
      </div>
    </div>
  );
}
