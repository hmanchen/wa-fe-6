"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { User, CalendarIcon, FileText } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { createCaseSchema, type CreateCaseInput } from "@/lib/validators/case";
import type { Case } from "@/types/case";

const CASE_TYPE_OPTIONS = [
  { value: "individual", label: "Individual" },
  { value: "couple", label: "Couple" },
  { value: "family", label: "Family" },
] as const;

export interface CaseFormProps {
  initialData?: Partial<Case> | null;
  onSubmit: (values: CreateCaseInput) => Promise<void> | void;
  onCancel?: () => void;
  isLoading?: boolean;
}

function toFormValues(data?: Partial<Case> | null): CreateCaseInput {
  if (!data) {
    return {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      meetingDate: "",
      caseType: "individual",
      description: "",
    };
  }
  return {
    clientName: data.clientName ?? "",
    clientEmail: data.clientEmail ?? "",
    clientPhone: data.clientPhone ?? "",
    meetingDate: data.meetingDate ?? "",
    caseType: data.caseType ?? "individual",
    description: data.description ?? "",
  };
}

export function CaseForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: CaseFormProps) {
  const form = useForm<CreateCaseInput>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: toFormValues(initialData),
  });

  async function handleSubmit(values: CreateCaseInput) {
    await onSubmit(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Card>
          <CardHeader className="pb-4">
            <h2 className="text-lg font-semibold">Case Details</h2>
            <p className="text-muted-foreground text-sm">
              Fill in the client and case information to get started.
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* ── Section: Client Information ── */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="size-4" />
                Client Information
              </div>

              {/* Client Name */}
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Client Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. John Smith"
                        autoComplete="name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email & Phone — side by side on wider screens */}
              <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email Address <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john.smith@example.com"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Phone Number{" "}
                        <span className="text-muted-foreground font-normal">(Optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          autoComplete="tel"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* ── Section: Case Information ── */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="size-4" />
                Case Information
              </div>

              {/* Meeting Date & Case Type — side by side on wider screens */}
              <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                {/* Meeting Date */}
                <FormField
                  control={form.control}
                  name="meetingDate"
                  render={({ field }) => {
                    const selectedDate = field.value
                      ? new Date(field.value)
                      : undefined;

                    return (
                      <FormItem>
                        <FormLabel>
                          Meeting Date{" "}
                          <span className="text-muted-foreground font-normal">(Optional)</span>
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 size-4 shrink-0" />
                                {field.value && selectedDate
                                  ? format(selectedDate, "PPP")
                                  : "Select a date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) =>
                                field.onChange(
                                  date ? date.toISOString() : ""
                                )
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Case Type */}
                <FormField
                  control={form.control}
                  name="caseType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Case Type <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select case type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CASE_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the case objectives, scope, or any relevant notes..."
                        className="min-h-24 resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Optional. Add context about the case.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading
                ? "Saving..."
                : initialData?.id
                  ? "Update Case"
                  : "Create Case"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
