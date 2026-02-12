"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { parseCurrencyInput } from "@/lib/formatters/currency";
import { goalsFormSchema, type GoalInput } from "@/lib/validators/discovery";
import type { ClientGoal, GoalType } from "@/types";

const GOAL_TYPE_OPTIONS: { value: GoalType; label: string }[] = [
  { value: "income-replacement", label: "Income Replacement" },
  { value: "debt-protection", label: "Debt Protection" },
  { value: "education-funding", label: "Education Funding" },
  { value: "retirement", label: "Retirement" },
  { value: "estate-planning", label: "Estate Planning" },
  { value: "business-succession", label: "Business Succession" },
  { value: "critical-illness", label: "Critical Illness" },
  { value: "disability", label: "Disability" },
];

const PRIORITY_OPTIONS = [
  { value: 1, label: "1 - Lowest" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5 - Highest" },
];

type GoalsFormSchema = { goals: GoalInput[] };

function toFormValues(data?: ClientGoal[] | null): GoalsFormSchema {
  if (!data || data.length === 0) {
    return { goals: [] };
  }
  return {
    goals: data.map((g) => ({
      type: g.type,
      description: g.description,
      priority: g.priority,
      targetAmount: g.targetAmount,
      timeHorizon: g.timeHorizon ? parseInt(g.timeHorizon, 10) : undefined,
    })),
  };
}

function toClientGoals(values: GoalsFormSchema): ClientGoal[] {
  return values.goals.map((g) => ({
    id: crypto.randomUUID(),
    type: g.type as GoalType,
    description: g.description,
    priority: g.priority,
    targetAmount: g.targetAmount,
    timeHorizon: g.timeHorizon ? `${g.timeHorizon} years` : undefined,
  }));
}

function GoalTypeCheckbox({
  goalType,
  selected,
  onToggle,
}: {
  goalType: GoalType;
  selected: boolean;
  onToggle: () => void;
}) {
  const option = GOAL_TYPE_OPTIONS.find((o) => o.value === goalType);
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={`goal-${goalType}`}
        checked={selected}
        onCheckedChange={onToggle}
      />
      <label
        htmlFor={`goal-${goalType}`}
        className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {option?.label ?? goalType}
      </label>
    </div>
  );
}

export interface GoalsFormProps {
  defaultValues?: ClientGoal[] | null;
  onSubmit: (data: ClientGoal[]) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function GoalsForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: GoalsFormProps) {
  const form = useForm<GoalsFormSchema>({
    resolver: zodResolver(goalsFormSchema),
    defaultValues: toFormValues(defaultValues),
  });

  const selectedTypes = form.watch("goals")?.map((g) => g.type) ?? [];

  function addGoal(type: GoalType) {
    const current = form.getValues("goals") ?? [];
    if (current.some((g) => g.type === type)) return;
    form.setValue("goals", [
      ...current,
      {
        type,
        description: "",
        priority: 3,
        targetAmount: undefined,
        timeHorizon: undefined,
      },
    ]);
  }

  function removeGoal(type: GoalType) {
    const current = form.getValues("goals") ?? [];
    form.setValue(
      "goals",
      current.filter((g) => g.type !== type)
    );
  }

  function toggleGoal(type: GoalType) {
    if (selectedTypes.includes(type)) {
      removeGoal(type);
    } else {
      addGoal(type);
    }
  }

  async function handleSubmit(values: GoalsFormSchema) {
    await onSubmit(toClientGoals(values));
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        <div className="space-y-4">
          <h3 className="text-foreground text-sm font-medium">
            Select goal types
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GOAL_TYPE_OPTIONS.map((opt) => (
              <GoalTypeCheckbox
                key={opt.value}
                goalType={opt.value}
                selected={selectedTypes.includes(opt.value)}
                onToggle={() => toggleGoal(opt.value)}
              />
            ))}
          </div>
        </div>

        {selectedTypes.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-foreground text-sm font-medium">
              Goal details
            </h3>
            <p className="text-muted-foreground text-sm">
              Provide details for each selected goal. Expand a section to edit.
            </p>

            {form.watch("goals")?.map((goal, index) => (
              <GoalDetailsSection
                key={goal.type}
                form={form}
                index={index}
                goalType={goal.type}
              />
            ))}
          </div>
        )}

        {selectedTypes.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-muted-foreground text-sm">
              <span className="font-medium text-foreground">
                {selectedTypes.length}
              </span>{" "}
              goal{selectedTypes.length !== 1 ? "s" : ""} selected
            </p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting || selectedTypes.length === 0}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </Form>
  );
}

function GoalDetailsSection({
  form,
  index,
  goalType,
}: {
  form: ReturnType<typeof useForm<GoalsFormSchema>>;
  index: number;
  goalType: GoalType;
}) {
  const option = GOAL_TYPE_OPTIONS.find((o) => o.value === goalType);

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h4 className="text-foreground font-medium">
        {option?.label ?? goalType}
      </h4>

      <FormField
        control={form.control}
        name={`goals.${index}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe this goal and what the client hopes to achieve..."
                className="min-h-[80px]"
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
          name={`goals.${index}.priority`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority (1-5)</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(parseInt(v, 10))}
                value={String(field.value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={String(opt.value)}
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
          name={`goals.${index}.timeHorizon`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time horizon (years)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 10"
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ""
                        ? undefined
                        : parseInt(e.target.value, 10)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name={`goals.${index}.targetAmount`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Target amount (optional)</FormLabel>
            <FormControl>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={
                  field.value === undefined || field.value === null
                    ? ""
                    : String(field.value)
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "" || raw === "-") {
                    field.onChange(undefined);
                    return;
                  }
                  const parsed = parseCurrencyInput(raw);
                  field.onChange(Number.isNaN(parsed) ? undefined : parsed);
                }}
                className="font-mono tabular-nums"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
