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
import type { PersonFinancialBackground, EmploymentRecord, Retirement401kDetails } from "@/types/financial-interview";

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
    income: {},
    monthlyExpenses: {},
    retirement401k: { has401k: false },
    employmentHistory: [makeEmptyEmployment()],
    hsa: { hasHSA: false },
    ira: { hasIRA: false },
    rothIRA: { hasRothIRA: false },
    pension: { hasPension: false },
    plan403b457b: { hasPlan: false },
    brokerage: { hasBrokerage: false },
    cd: { hasCDs: false },
    bonds: { hasBonds: false },
    annuity: { hasAnnuity: false },
    equityCompensation: { hasEquityComp: false },
    education529: { has529: false },
    realEstate: { hasRealEstate: false },
    crypto: { hasCrypto: false },
    cashOnHand: { hasCashOnHand: false },
    socialSecurity: { hasEstimate: false },
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

      {/* ── Income ── */}
      <div onFocus={() => notifyStep("income")} onClick={() => notifyStep("income")}>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Income
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <CurrencyInput
            label="Annual salary"
            value={data.income.annualSalary}
            onChange={(v) =>
              update({ income: { ...data.income, annualSalary: v } })
            }
          />
          <CurrencyInput
            label="Annual bonus / commission"
            value={data.income.annualBonus}
            onChange={(v) =>
              update({ income: { ...data.income, annualBonus: v } })
            }
          />
          <div className="space-y-1">
            <Label className="text-xs">Pay frequency</Label>
            <Select
              value={data.income.incomeFrequency ?? ""}
              onValueChange={(v) =>
                update({
                  income: {
                    ...data.income,
                    incomeFrequency: v as PersonFinancialBackground["income"]["incomeFrequency"],
                  },
                })
              }
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="semi-monthly">Semi-monthly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <CurrencyInput
            label="Other income (annual)"
            value={data.income.otherIncome}
            onChange={(v) =>
              update({ income: { ...data.income, otherIncome: v } })
            }
          />
          <div className="space-y-1">
            <Label className="text-xs">Other income source</Label>
            <Input
              className="text-sm"
              placeholder="e.g. Rental income, side business"
              value={data.income.otherIncomeSource ?? ""}
              onChange={(e) =>
                update({
                  income: { ...data.income, otherIncomeSource: e.target.value },
                })
              }
            />
          </div>
        </div>
        {(data.income.annualSalary || data.income.annualBonus || data.income.otherIncome) && (
          <div className="mt-3 rounded-lg bg-primary/5 px-4 py-2">
            <span className="text-xs font-medium text-muted-foreground">Total annual income: </span>
            <span className="text-sm font-bold text-foreground">
              ${((data.income.annualSalary ?? 0) + (data.income.annualBonus ?? 0) + (data.income.otherIncome ?? 0)).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <Separator />

      {/* ── Monthly Expenses ── */}
      <div onFocus={() => notifyStep("expenses")} onClick={() => notifyStep("expenses")}>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Monthly Expenses
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <CurrencyInput
            label="Housing (mortgage / rent)"
            value={data.monthlyExpenses.housing}
            onChange={(v) =>
              update({ monthlyExpenses: { ...data.monthlyExpenses, housing: v } })
            }
          />
          <CurrencyInput
            label="Utilities"
            value={data.monthlyExpenses.utilities}
            onChange={(v) =>
              update({ monthlyExpenses: { ...data.monthlyExpenses, utilities: v } })
            }
          />
          <CurrencyInput
            label="Transportation"
            value={data.monthlyExpenses.transportation}
            onChange={(v) =>
              update({ monthlyExpenses: { ...data.monthlyExpenses, transportation: v } })
            }
          />
          <CurrencyInput
            label="Groceries"
            value={data.monthlyExpenses.groceries}
            onChange={(v) =>
              update({ monthlyExpenses: { ...data.monthlyExpenses, groceries: v } })
            }
          />
          <CurrencyInput
            label="Insurance premiums"
            value={data.monthlyExpenses.insurance}
            onChange={(v) =>
              update({ monthlyExpenses: { ...data.monthlyExpenses, insurance: v } })
            }
          />
          <CurrencyInput
            label="Childcare / education"
            value={data.monthlyExpenses.childcare}
            onChange={(v) =>
              update({ monthlyExpenses: { ...data.monthlyExpenses, childcare: v } })
            }
          />
          <CurrencyInput
            label="Entertainment"
            value={data.monthlyExpenses.entertainment}
            onChange={(v) =>
              update({ monthlyExpenses: { ...data.monthlyExpenses, entertainment: v } })
            }
          />
          <CurrencyInput
            label="Dining out"
            value={data.monthlyExpenses.diningOut}
            onChange={(v) =>
              update({ monthlyExpenses: { ...data.monthlyExpenses, diningOut: v } })
            }
          />
          <CurrencyInput
            label="Subscriptions"
            value={data.monthlyExpenses.subscriptions}
            onChange={(v) =>
              update({ monthlyExpenses: { ...data.monthlyExpenses, subscriptions: v } })
            }
          />
        </div>
        <div className="mt-3">
          <CurrencyInput
            label="Other monthly expenses"
            value={data.monthlyExpenses.otherExpenses}
            onChange={(v) =>
              update({ monthlyExpenses: { ...data.monthlyExpenses, otherExpenses: v } })
            }
          />
        </div>
        {(() => {
          const total =
            (data.monthlyExpenses.housing ?? 0) +
            (data.monthlyExpenses.utilities ?? 0) +
            (data.monthlyExpenses.transportation ?? 0) +
            (data.monthlyExpenses.groceries ?? 0) +
            (data.monthlyExpenses.insurance ?? 0) +
            (data.monthlyExpenses.childcare ?? 0) +
            (data.monthlyExpenses.entertainment ?? 0) +
            (data.monthlyExpenses.diningOut ?? 0) +
            (data.monthlyExpenses.subscriptions ?? 0) +
            (data.monthlyExpenses.otherExpenses ?? 0);
          if (total === 0) return null;
          const annualExpenses = total * 12;
          const annualIncome = (data.income.annualSalary ?? 0) + (data.income.annualBonus ?? 0) + (data.income.otherIncome ?? 0);
          const surplus = annualIncome > 0 ? annualIncome / 12 - total : 0;
          return (
            <div className="mt-3 flex flex-wrap gap-4 rounded-lg bg-primary/5 px-4 py-2">
              <div>
                <span className="text-xs font-medium text-muted-foreground">Total monthly: </span>
                <span className="text-sm font-bold text-foreground">${total.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Annual: </span>
                <span className="text-sm font-bold text-foreground">${annualExpenses.toLocaleString()}</span>
              </div>
              {annualIncome > 0 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Monthly surplus: </span>
                  <span className={cn("text-sm font-bold", surplus >= 0 ? "text-green-600" : "text-red-600")}>
                    {surplus >= 0 ? "+" : ""}${Math.round(surplus).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      <Separator />

      {/* ── 401(k) Retirement ── */}
      <div onFocus={() => notifyStep("retirement401k")} onClick={() => notifyStep("retirement401k")}>
        <ToggleSection
          label="401(k) Retirement Plan"
          description="Employer-sponsored tax-deferred retirement savings"
          enabled={data.retirement401k.has401k}
          onToggle={(v) =>
            update({ retirement401k: { ...data.retirement401k, has401k: v } })
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <CurrencyInput
              label="Current 401(k) balance"
              value={data.retirement401k.currentBalance}
              onChange={(v) =>
                update({ retirement401k: { ...data.retirement401k, currentBalance: v } })
              }
            />
            <PercentInput
              label="Your contribution %"
              value={data.retirement401k.employeeContributionPercent}
              onChange={(v) =>
                update({ retirement401k: { ...data.retirement401k, employeeContributionPercent: v } })
              }
            />
            <PercentInput
              label="Employer match %"
              value={data.retirement401k.employerMatchPercent}
              onChange={(v) =>
                update({ retirement401k: { ...data.retirement401k, employerMatchPercent: v } })
              }
            />
            <div className="flex items-center gap-3 pt-5">
              <Switch
                checked={data.retirement401k.isMaxedOut ?? false}
                onCheckedChange={(v) =>
                  update({ retirement401k: { ...data.retirement401k, isMaxedOut: v } })
                }
              />
              <Label className="text-xs">Maxing out contributions? ($23,500 limit)</Label>
            </div>
          </div>
          <Separator className="my-3" />
          <div className="flex items-center gap-3">
            <Switch
              checked={data.retirement401k.hasOld401k ?? false}
              onCheckedChange={(v) =>
                update({ retirement401k: { ...data.retirement401k, hasOld401k: v } })
              }
            />
            <Label className="text-xs">Has old 401(k) from previous employer?</Label>
          </div>
          {data.retirement401k.hasOld401k && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <CurrencyInput
                label="Old 401(k) balance"
                value={data.retirement401k.old401kBalance}
                onChange={(v) =>
                  update({ retirement401k: { ...data.retirement401k, old401kBalance: v } })
                }
              />
              <div className="space-y-1">
                <Label className="text-xs">What was done with it?</Label>
                <Select
                  value={data.retirement401k.old401kAction ?? ""}
                  onValueChange={(v) =>
                    update({
                      retirement401k: {
                        ...data.retirement401k,
                        old401kAction: v as Retirement401kDetails["old401kAction"],
                      },
                    })
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rolled-over">Rolled over to IRA</SelectItem>
                    <SelectItem value="left-with-employer">Left with previous employer</SelectItem>
                    <SelectItem value="cashed-out">Cashed out</SelectItem>
                    <SelectItem value="converted-to-roth">Converted to Roth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </ToggleSection>
      </div>

      <Separator />

      {/* ── HSA ── */}
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

      {/* ── Pension / Defined Benefit ── */}
      <div onFocus={() => notifyStep("pension")} onClick={() => notifyStep("pension")}>
        <ToggleSection
          label="Pension / Defined Benefit Plan"
          description="Employer-sponsored guaranteed retirement income"
          enabled={data.pension.hasPension}
          onToggle={(v) =>
            update({ pension: { ...data.pension, hasPension: v } })
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Employer / Plan provider</Label>
              <Input
                className="text-sm"
                placeholder="e.g. State of California"
                value={data.pension.employer ?? ""}
                onChange={(e) =>
                  update({ pension: { ...data.pension, employer: e.target.value } })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Years of service</Label>
              <Input
                type="number"
                min={0}
                className="text-sm"
                placeholder="0"
                value={data.pension.yearsOfService ?? ""}
                onChange={(e) =>
                  update({
                    pension: {
                      ...data.pension,
                      yearsOfService: e.target.value === "" ? undefined : parseInt(e.target.value, 10),
                    },
                  })
                }
              />
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <CurrencyInput
              label="Est. monthly benefit at retirement"
              value={data.pension.estimatedMonthlyBenefit}
              onChange={(v) =>
                update({ pension: { ...data.pension, estimatedMonthlyBenefit: v } })
              }
            />
            <CurrencyInput
              label="Lump-sum option (if offered)"
              value={data.pension.lumpSumOption}
              onChange={(v) =>
                update({ pension: { ...data.pension, lumpSumOption: v } })
              }
            />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Eligible retirement age</Label>
              <Input
                type="number"
                min={50}
                max={75}
                className="text-sm"
                placeholder="e.g. 65"
                value={data.pension.eligibleRetirementAge ?? ""}
                onChange={(e) =>
                  update({
                    pension: {
                      ...data.pension,
                      eligibleRetirementAge: e.target.value === "" ? undefined : parseInt(e.target.value, 10),
                    },
                  })
                }
              />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <Switch
                checked={data.pension.isVested ?? false}
                onCheckedChange={(v) =>
                  update({ pension: { ...data.pension, isVested: v } })
                }
              />
              <Label className="text-xs">Fully vested?</Label>
            </div>
          </div>
        </ToggleSection>
      </div>

      <Separator />

      {/* ── 403(b) / 457(b) Plans ── */}
      <div onFocus={() => notifyStep("plan403b457b")} onClick={() => notifyStep("plan403b457b")}>
        <ToggleSection
          label="403(b) / 457(b) Plan"
          description="Retirement plan for teachers, non-profits & government"
          enabled={data.plan403b457b.hasPlan}
          onToggle={(v) =>
            update({ plan403b457b: { ...data.plan403b457b, hasPlan: v } })
          }
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Plan type</Label>
              <Select
                value={data.plan403b457b.planType ?? ""}
                onValueChange={(v) =>
                  update({
                    plan403b457b: {
                      ...data.plan403b457b,
                      planType: v as "403b" | "457b" | "both",
                    },
                  })
                }
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="403b">403(b)</SelectItem>
                  <SelectItem value="457b">457(b)</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CurrencyInput
              label="Annual contribution"
              value={data.plan403b457b.annualContribution}
              onChange={(v) =>
                update({ plan403b457b: { ...data.plan403b457b, annualContribution: v } })
              }
            />
            <CurrencyInput
              label="Current balance"
              value={data.plan403b457b.currentBalance}
              onChange={(v) =>
                update({ plan403b457b: { ...data.plan403b457b, currentBalance: v } })
              }
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <Switch
                checked={data.plan403b457b.employerMatch ?? false}
                onCheckedChange={(v) =>
                  update({ plan403b457b: { ...data.plan403b457b, employerMatch: v } })
                }
              />
              <Label className="text-xs">Employer match?</Label>
            </div>
            {data.plan403b457b.employerMatch && (
              <div className="w-36">
                <PercentInput
                  label="Match %"
                  value={data.plan403b457b.employerMatchPercent}
                  onChange={(v) =>
                    update({ plan403b457b: { ...data.plan403b457b, employerMatchPercent: v } })
                  }
                />
              </div>
            )}
            <div className="flex items-center gap-3">
              <Switch
                checked={data.plan403b457b.isMaxedOut ?? false}
                onCheckedChange={(v) =>
                  update({ plan403b457b: { ...data.plan403b457b, isMaxedOut: v } })
                }
              />
              <Label className="text-xs">Maxing out?</Label>
            </div>
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

      {/* ── Bond Holdings (incl. Municipal Bonds) ── */}
      <div onFocus={() => notifyStep("bonds")} onClick={() => notifyStep("bonds")}>
        <ToggleSection
          label="Bond Holdings"
          description="Municipal, Treasury, Corporate bonds & bond funds"
          enabled={data.bonds.hasBonds}
          onToggle={(v) =>
            update({ bonds: { ...data.bonds, hasBonds: v } })
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <CurrencyInput
              label="Municipal bonds (tax-free)"
              value={data.bonds.municipalBondValue}
              onChange={(v) =>
                update({ bonds: { ...data.bonds, municipalBondValue: v } })
              }
            />
            <CurrencyInput
              label="US Treasury / I-Bonds"
              value={data.bonds.treasuryBondValue}
              onChange={(v) =>
                update({ bonds: { ...data.bonds, treasuryBondValue: v } })
              }
            />
            <CurrencyInput
              label="Corporate bonds"
              value={data.bonds.corporateBondValue}
              onChange={(v) =>
                update({ bonds: { ...data.bonds, corporateBondValue: v } })
              }
            />
            <CurrencyInput
              label="Bond funds / ETFs"
              value={data.bonds.bondFundValue}
              onChange={(v) =>
                update({ bonds: { ...data.bonds, bondFundValue: v } })
              }
            />
          </div>
          <div className="mt-3 w-48">
            <PercentInput
              label="Average yield"
              value={data.bonds.averageYieldPercent}
              onChange={(v) =>
                update({ bonds: { ...data.bonds, averageYieldPercent: v } })
              }
            />
          </div>
        </ToggleSection>
      </div>

      <Separator />

      {/* ── Annuities ── */}
      <div onFocus={() => notifyStep("annuity")} onClick={() => notifyStep("annuity")}>
        <ToggleSection
          label="Annuities"
          description="Insurance-based investment / income products"
          enabled={data.annuity.hasAnnuity}
          onToggle={(v) =>
            update({ annuity: { ...data.annuity, hasAnnuity: v } })
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Annuity type</Label>
              <Select
                value={data.annuity.type ?? ""}
                onValueChange={(v) =>
                  update({
                    annuity: {
                      ...data.annuity,
                      type: v as "fixed" | "variable" | "indexed" | "immediate",
                    },
                  })
                }
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="variable">Variable</SelectItem>
                  <SelectItem value="indexed">Fixed Indexed</SelectItem>
                  <SelectItem value="immediate">Immediate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Insurance company</Label>
              <Input
                className="text-sm"
                placeholder="e.g. Pacific Life"
                value={data.annuity.provider ?? ""}
                onChange={(e) =>
                  update({ annuity: { ...data.annuity, provider: e.target.value } })
                }
              />
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <CurrencyInput
              label="Current value"
              value={data.annuity.currentValue}
              onChange={(v) =>
                update({ annuity: { ...data.annuity, currentValue: v } })
              }
            />
            <PercentInput
              label="Guaranteed rate"
              value={data.annuity.guaranteedRate}
              onChange={(v) =>
                update({ annuity: { ...data.annuity, guaranteedRate: v } })
              }
            />
            <div className="space-y-1">
              <Label className="text-xs">Surrender period left (yrs)</Label>
              <Input
                type="number"
                min={0}
                className="text-sm"
                placeholder="0"
                value={data.annuity.surrenderPeriodYearsRemaining ?? ""}
                onChange={(e) =>
                  update({
                    annuity: {
                      ...data.annuity,
                      surrenderPeriodYearsRemaining: e.target.value === "" ? undefined : parseInt(e.target.value, 10),
                    },
                  })
                }
              />
            </div>
          </div>
        </ToggleSection>
      </div>

      <Separator />

      {/* ── Stock Options / RSUs / ESPP ── */}
      <div onFocus={() => notifyStep("equityComp")} onClick={() => notifyStep("equityComp")}>
        <ToggleSection
          label="Stock Options / RSUs / ESPP"
          description="Employer equity compensation"
          enabled={data.equityCompensation.hasEquityComp}
          onToggle={(v) =>
            update({ equityCompensation: { ...data.equityCompensation, hasEquityComp: v } })
          }
        >
          <div className="mb-3 space-y-1">
            <Label className="text-xs">Company</Label>
            <Input
              className="text-sm"
              placeholder="e.g. Google"
              value={data.equityCompensation.companyName ?? ""}
              onChange={(e) =>
                update({ equityCompensation: { ...data.equityCompensation, companyName: e.target.value } })
              }
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <CurrencyInput
              label="Vested stock options value"
              value={data.equityCompensation.vestedOptionsValue}
              onChange={(v) =>
                update({ equityCompensation: { ...data.equityCompensation, vestedOptionsValue: v } })
              }
            />
            <CurrencyInput
              label="Unvested stock options value"
              value={data.equityCompensation.unvestedOptionsValue}
              onChange={(v) =>
                update({ equityCompensation: { ...data.equityCompensation, unvestedOptionsValue: v } })
              }
            />
            <CurrencyInput
              label="Vested RSUs value"
              value={data.equityCompensation.vestedRSUValue}
              onChange={(v) =>
                update({ equityCompensation: { ...data.equityCompensation, vestedRSUValue: v } })
              }
            />
            <CurrencyInput
              label="Unvested RSUs value"
              value={data.equityCompensation.unvestedRSUValue}
              onChange={(v) =>
                update({ equityCompensation: { ...data.equityCompensation, unvestedRSUValue: v } })
              }
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <Switch
                checked={data.equityCompensation.hasESPP ?? false}
                onCheckedChange={(v) =>
                  update({ equityCompensation: { ...data.equityCompensation, hasESPP: v } })
                }
              />
              <Label className="text-xs">Participates in ESPP?</Label>
            </div>
            {data.equityCompensation.hasESPP && (
              <div className="w-36">
                <PercentInput
                  label="ESPP contribution %"
                  value={data.equityCompensation.esppContributionPercent}
                  onChange={(v) =>
                    update({ equityCompensation: { ...data.equityCompensation, esppContributionPercent: v } })
                  }
                />
              </div>
            )}
          </div>
        </ToggleSection>
      </div>

      <Separator />

      {/* ── 529 Education Savings ── */}
      <div onFocus={() => notifyStep("education529")} onClick={() => notifyStep("education529")}>
        <ToggleSection
          label="529 Education Savings Plan"
          description="Tax-advantaged savings for education expenses"
          enabled={data.education529.has529}
          onToggle={(v) =>
            update({ education529: { ...data.education529, has529: v } })
          }
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">State plan</Label>
              <Input
                className="text-sm"
                placeholder="e.g. NY 529 Direct"
                value={data.education529.statePlan ?? ""}
                onChange={(e) =>
                  update({ education529: { ...data.education529, statePlan: e.target.value } })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">No. of accounts</Label>
              <Input
                type="number"
                min={0}
                className="text-sm"
                placeholder="1"
                value={data.education529.numberOfAccounts ?? ""}
                onChange={(e) =>
                  update({
                    education529: {
                      ...data.education529,
                      numberOfAccounts: e.target.value === "" ? undefined : parseInt(e.target.value, 10),
                    },
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Beneficiaries</Label>
              <Input
                type="number"
                min={0}
                className="text-sm"
                placeholder="1"
                value={data.education529.beneficiaryCount ?? ""}
                onChange={(e) =>
                  update({
                    education529: {
                      ...data.education529,
                      beneficiaryCount: e.target.value === "" ? undefined : parseInt(e.target.value, 10),
                    },
                  })
                }
              />
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <CurrencyInput
              label="Total balance"
              value={data.education529.totalBalance}
              onChange={(v) =>
                update({ education529: { ...data.education529, totalBalance: v } })
              }
            />
            <CurrencyInput
              label="Annual contribution"
              value={data.education529.annualContribution}
              onChange={(v) =>
                update({ education529: { ...data.education529, annualContribution: v } })
              }
            />
          </div>
        </ToggleSection>
      </div>

      <Separator />

      {/* ── Real Estate Investments ── */}
      <div onFocus={() => notifyStep("realEstate")} onClick={() => notifyStep("realEstate")}>
        <ToggleSection
          label="Real Estate Investments"
          description="Investment properties, rental income & home equity"
          enabled={data.realEstate.hasRealEstate}
          onToggle={(v) =>
            update({ realEstate: { ...data.realEstate, hasRealEstate: v } })
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <CurrencyInput
              label="Primary home equity"
              value={data.realEstate.primaryHomeEquity}
              onChange={(v) =>
                update({ realEstate: { ...data.realEstate, primaryHomeEquity: v } })
              }
            />
            <div className="space-y-1">
              <Label className="text-xs">Investment properties</Label>
              <Input
                type="number"
                min={0}
                className="text-sm"
                placeholder="0"
                value={data.realEstate.numberOfProperties ?? ""}
                onChange={(e) =>
                  update({
                    realEstate: {
                      ...data.realEstate,
                      numberOfProperties: e.target.value === "" ? undefined : parseInt(e.target.value, 10),
                    },
                  })
                }
              />
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <CurrencyInput
              label="Total market value"
              value={data.realEstate.totalMarketValue}
              onChange={(v) =>
                update({ realEstate: { ...data.realEstate, totalMarketValue: v } })
              }
            />
            <CurrencyInput
              label="Total mortgage balance"
              value={data.realEstate.totalMortgageBalance}
              onChange={(v) =>
                update({ realEstate: { ...data.realEstate, totalMortgageBalance: v } })
              }
            />
            <CurrencyInput
              label="Monthly rental income"
              value={data.realEstate.monthlyRentalIncome}
              onChange={(v) =>
                update({ realEstate: { ...data.realEstate, monthlyRentalIncome: v } })
              }
            />
          </div>
        </ToggleSection>
      </div>

      <Separator />

      {/* ── Cryptocurrency / Digital Assets ── */}
      <div onFocus={() => notifyStep("crypto")} onClick={() => notifyStep("crypto")}>
        <ToggleSection
          label="Cryptocurrency / Digital Assets"
          description="Bitcoin, Ethereum, and other digital asset holdings"
          enabled={data.crypto.hasCrypto}
          onToggle={(v) =>
            update({ crypto: { ...data.crypto, hasCrypto: v } })
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <CurrencyInput
              label="Total current value"
              value={data.crypto.totalValue}
              onChange={(v) =>
                update({ crypto: { ...data.crypto, totalValue: v } })
              }
            />
            <CurrencyInput
              label="Approximate cost basis"
              value={data.crypto.approximateCostBasis}
              onChange={(v) =>
                update({ crypto: { ...data.crypto, approximateCostBasis: v } })
              }
            />
            <div className="space-y-1">
              <Label className="text-xs">Platform(s)</Label>
              <Input
                className="text-sm"
                placeholder="e.g. Coinbase, Kraken"
                value={data.crypto.platforms ?? ""}
                onChange={(e) =>
                  update({ crypto: { ...data.crypto, platforms: e.target.value } })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Major holdings</Label>
              <Input
                className="text-sm"
                placeholder="e.g. BTC, ETH, SOL"
                value={data.crypto.majorHoldings ?? ""}
                onChange={(e) =>
                  update({ crypto: { ...data.crypto, majorHoldings: e.target.value } })
                }
              />
            </div>
          </div>
        </ToggleSection>
      </div>

      <Separator />

      {/* ── Cash on Hand ── */}
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

      {/* ── Social Security / CPP Estimate ── */}
      <div onFocus={() => notifyStep("socialSecurity")} onClick={() => notifyStep("socialSecurity")}>
        <ToggleSection
          label="Social Security / CPP Estimate"
          description="Projected government retirement benefits"
          enabled={data.socialSecurity.hasEstimate}
          onToggle={(v) =>
            update({ socialSecurity: { ...data.socialSecurity, hasEstimate: v } })
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Full retirement age</Label>
              <Input
                type="number"
                min={62}
                max={70}
                className="text-sm"
                placeholder="e.g. 67"
                value={data.socialSecurity.fullRetirementAge ?? ""}
                onChange={(e) =>
                  update({
                    socialSecurity: {
                      ...data.socialSecurity,
                      fullRetirementAge: e.target.value === "" ? undefined : parseInt(e.target.value, 10),
                    },
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Qualifying work years</Label>
              <Input
                type="number"
                min={0}
                className="text-sm"
                placeholder="e.g. 25"
                value={data.socialSecurity.qualifyingYears ?? ""}
                onChange={(e) =>
                  update({
                    socialSecurity: {
                      ...data.socialSecurity,
                      qualifyingYears: e.target.value === "" ? undefined : parseInt(e.target.value, 10),
                    },
                  })
                }
              />
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <CurrencyInput
              label="Monthly at age 62 (early)"
              value={data.socialSecurity.estimatedBenefitEarly}
              onChange={(v) =>
                update({ socialSecurity: { ...data.socialSecurity, estimatedBenefitEarly: v } })
              }
            />
            <CurrencyInput
              label="Monthly at FRA"
              value={data.socialSecurity.estimatedMonthlyBenefitFRA}
              onChange={(v) =>
                update({ socialSecurity: { ...data.socialSecurity, estimatedMonthlyBenefitFRA: v } })
              }
            />
            <CurrencyInput
              label="Monthly at age 70 (delayed)"
              value={data.socialSecurity.estimatedBenefitDelayed}
              onChange={(v) =>
                update({ socialSecurity: { ...data.socialSecurity, estimatedBenefitDelayed: v } })
              }
            />
          </div>
        </ToggleSection>
      </div>

      <Separator />

      {/* ── Systematic Investments ── */}
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
