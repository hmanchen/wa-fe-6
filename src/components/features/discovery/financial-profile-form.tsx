"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatCurrency, parseCurrencyInput } from "@/lib/formatters/currency";
import { formatPercentage } from "@/lib/formatters/percentage";
import { cn } from "@/lib/utils";
import {
  financialProfileSchema,
  type FinancialProfileInput,
} from "@/lib/validators/discovery";
import type { ClientFinancialProfile } from "@/types";

function toFormValues(data?: ClientFinancialProfile | null): FinancialProfileInput {
  if (!data) {
    return {
      annualIncome: undefined,
      monthlyExpenses: undefined,
      totalAssets: undefined,
      totalLiabilities: undefined,
      investmentAssets: undefined,
      retirementSavings: undefined,
      emergencyFund: undefined,
      monthlyDebtPayments: undefined,
    };
  }
  return {
    annualIncome: data.annualIncome,
    monthlyExpenses: data.monthlyExpenses,
    totalAssets: data.totalAssets,
    totalLiabilities: data.totalLiabilities,
    investmentAssets: data.investmentAssets,
    retirementSavings: data.retirementSavings,
    emergencyFund: data.emergencyFund,
    monthlyDebtPayments: data.monthlyDebtPayments,
  };
}

function toClientFinancialProfile(
  values: FinancialProfileInput
): ClientFinancialProfile {
  const totalAssets = values.totalAssets ?? 0;
  const totalLiabilities = values.totalLiabilities ?? 0;
  return {
    annualIncome: values.annualIncome ?? 0,
    monthlyExpenses: values.monthlyExpenses ?? 0,
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    investmentAssets: values.investmentAssets ?? 0,
    retirementSavings: values.retirementSavings ?? 0,
    emergencyFund: values.emergencyFund ?? 0,
    monthlyDebtPayments: values.monthlyDebtPayments ?? 0,
  };
}

function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
  value?: number;
  onChange: (value: number) => void;
}) {
  const displayValue =
    value === undefined || value === null || Number.isNaN(value)
      ? ""
      : String(value);
  return (
    <Input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={displayValue}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "" || raw === "-") {
          onChange(0);
          return;
        }
        const parsed = parseCurrencyInput(raw);
        onChange(Number.isNaN(parsed) ? 0 : parsed);
      }}
      className={cn("font-mono tabular-nums", className)}
      {...props}
    />
  );
}

export interface FinancialProfileFormProps {
  defaultValues?: ClientFinancialProfile | null;
  onSubmit: (data: ClientFinancialProfile) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function FinancialProfileForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: FinancialProfileFormProps) {
  const form = useForm<FinancialProfileInput>({
    resolver: zodResolver(financialProfileSchema),
    defaultValues: toFormValues(defaultValues),
  });

  const watched = form.watch();

  const netWorth = useMemo(() => {
    const assets = watched.totalAssets ?? 0;
    const liabilities = watched.totalLiabilities ?? 0;
    return assets - liabilities;
  }, [watched.totalAssets, watched.totalLiabilities]);

  const ratios = useMemo(() => {
    const income = watched.annualIncome ?? 0;
    const expenses = watched.monthlyExpenses ?? 0;
    const debt = watched.monthlyDebtPayments ?? 0;
    const emergency = watched.emergencyFund ?? 0;

    const debtToIncome =
      income > 0 && debt > 0 ? (debt * 12) / income : 0;
    const emergencyMonths =
      expenses > 0 && emergency > 0 ? emergency / expenses : 0;

    return { debtToIncome, emergencyMonths };
  }, [
    watched.annualIncome,
    watched.monthlyExpenses,
    watched.monthlyDebtPayments,
    watched.emergencyFund,
  ]);

  async function handleSubmit(values: FinancialProfileInput) {
    await onSubmit(toClientFinancialProfile(values));
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-foreground mb-4 text-sm font-medium">
              Income & expenses
            </h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="annualIncome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual income</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="monthlyExpenses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly expenses</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div>
            <h3 className="text-foreground mb-4 text-sm font-medium">
              Assets
            </h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="totalAssets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total assets</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalLiabilities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total liabilities</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="investmentAssets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investment assets</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="retirementSavings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retirement savings</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergencyFund"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency fund</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="monthlyDebtPayments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly debt payments</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financial summary</CardTitle>
            <CardDescription>Key metrics derived from your inputs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground text-sm">
                Net worth
              </span>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  netWorth >= 0 ? "text-foreground" : "text-destructive"
                )}
              >
                {formatCurrency(netWorth)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground text-sm">
                Debt-to-income ratio
              </span>
              <span className="text-foreground text-sm font-medium tabular-nums">
                {formatPercentage(ratios.debtToIncome * 100)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Emergency fund (months)
              </span>
              <span className="text-foreground text-sm font-medium tabular-nums">
                {ratios.emergencyMonths.toFixed(1)} months
              </span>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </Form>
  );
}
