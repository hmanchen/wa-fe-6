"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Plus, Trash2, CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, parseCurrencyInput } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";
import {
  existingCoverageFormSchema,
  type ExistingCoverageFormInput,
} from "@/lib/validators/discovery";
import type { ExistingCoverage, ExistingCoverageType } from "@/types";

const COVERAGE_TYPE_OPTIONS: { value: ExistingCoverageType; label: string }[] = [
  { value: "life", label: "Life" },
  { value: "health", label: "Health" },
  { value: "disability", label: "Disability" },
  { value: "critical-illness", label: "Critical Illness" },
  { value: "long-term-care", label: "Long-Term Care" },
  { value: "other", label: "Other" },
];

const formSchema = z.object({
  coverages: z.array(existingCoverageFormSchema),
});

type FormSchema = z.infer<typeof formSchema>;

function toFormValues(data?: ExistingCoverage[] | null): FormSchema {
  if (!data || data.length === 0) {
    return {
      coverages: [
        {
          type: "life",
          provider: "",
          policyNumber: "",
          coverageAmount: undefined,
          premium: undefined,
          startDate: "",
          endDate: "",
          notes: "",
        },
      ],
    };
  }
  return {
    coverages: data.map((c) => ({
      type: c.type,
      provider: c.provider ?? "",
      policyNumber: c.policyNumber ?? "",
      coverageAmount: c.coverageAmount,
      premium: c.premium,
      startDate: c.startDate ?? "",
      endDate: c.endDate ?? "",
      notes: c.notes ?? "",
    })),
  };
}

function toExistingCoverageList(values: FormSchema): ExistingCoverage[] {
  return values.coverages
    .filter(
      (c) =>
        c.type &&
        (c.coverageAmount !== undefined ||
          c.premium !== undefined ||
          c.provider ||
          c.policyNumber ||
          c.startDate)
    )
    .map((c) => ({
      type: c.type as ExistingCoverageType,
      provider: c.provider || "",
      policyNumber: c.policyNumber || undefined,
      coverageAmount: c.coverageAmount ?? 0,
      premium: c.premium ?? 0,
      startDate: c.startDate || new Date().toISOString().split("T")[0],
      endDate: c.endDate || undefined,
      notes: c.notes || undefined,
    }));
}

function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
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
      className="font-mono tabular-nums"
      {...props}
    />
  );
}

export interface ExistingCoverageFormProps {
  defaultValues?: ExistingCoverage[] | null;
  onSubmit: (data: ExistingCoverage[]) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function ExistingCoverageForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: ExistingCoverageFormProps) {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: toFormValues(defaultValues),
  });

  const coverages = form.watch("coverages");
  const totalCoverage = coverages?.reduce(
    (sum, c) => sum + (c.coverageAmount ?? 0),
    0
  );
  const totalPremium = coverages?.reduce(
    (sum, c) => sum + (c.premium ?? 0),
    0
  );

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "coverages",
  });

  async function handleSubmit(values: FormSchema) {
    await onSubmit(toExistingCoverageList(values));
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        <div className="space-y-6">
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <h3 className="text-foreground text-sm font-medium">
                  Policy {index + 1}
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                  aria-label="Remove policy"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`coverages.${index}.type`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Coverage type</FormLabel>
                        <Select
                          onValueChange={f.onChange}
                          value={f.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COVERAGE_TYPE_OPTIONS.map((opt) => (
                              <SelectItem
                                key={opt.value}
                                value={opt.value}
                              >
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`coverages.${index}.provider`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Provider</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Insurance company"
                            {...f}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`coverages.${index}.policyNumber`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Policy number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Policy #"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`coverages.${index}.coverageAmount`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coverage amount</FormLabel>
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
                    name={`coverages.${index}.premium`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Premium</FormLabel>
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`coverages.${index}.startDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(
                                    new Date(field.value),
                                    "PPP"
                                  )
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto size-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={
                                field.value
                                  ? new Date(field.value)
                                  : undefined
                              }
                              onSelect={(date) =>
                                field.onChange(
                                  date
                                    ? date
                                        .toISOString()
                                        .split("T")[0]
                                    : ""
                                )
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`coverages.${index}.endDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End date (optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(
                                    new Date(field.value),
                                    "PPP"
                                  )
                                ) : (
                                  <span>Optional</span>
                                )}
                                <CalendarIcon className="ml-auto size-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={
                                field.value
                                  ? new Date(field.value)
                                  : undefined
                              }
                              onSelect={(date) =>
                                field.onChange(
                                  date
                                    ? date
                                        .toISOString()
                                        .split("T")[0]
                                    : ""
                                )
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`coverages.${index}.notes`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Additional notes"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({
              type: "life",
              provider: "",
              policyNumber: "",
              coverageAmount: undefined,
              premium: undefined,
              startDate: "",
              endDate: "",
              notes: "",
            })
          }
          className="w-full"
        >
          <Plus className="mr-2 size-4" />
          Add coverage
        </Button>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Total existing coverage
                </p>
                <p className="text-xl font-semibold tabular-nums">
                  {formatCurrency(totalCoverage)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-sm">
                  Total premiums
                </p>
                <p className="text-xl font-semibold tabular-nums">
                  {formatCurrency(totalPremium)}
                </p>
              </div>
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
