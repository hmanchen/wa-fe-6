"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, differenceInYears } from "date-fns";
import { User, CalendarIcon, FileText, MapPin, Users } from "lucide-react";
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

// ── Static data ──────────────────────────────────────────────

const CASE_TYPE_OPTIONS = [
  { value: "life_insurance", label: "Life Insurance" },
  { value: "retirement_planning", label: "Retirement Planning" },
  { value: "estate_planning", label: "Estate Planning" },
  { value: "investment_review", label: "Investment Review" },
  { value: "comprehensive", label: "Comprehensive" },
  { value: "other", label: "Other" },
] as const;

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

const MARITAL_STATUS_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "common-law", label: "Common Law" },
  { value: "separated", label: "Separated" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
];

const COUNTRY_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
];

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","District of Columbia",
];

const CA_PROVINCES = [
  "Alberta","British Columbia","Manitoba","New Brunswick",
  "Newfoundland and Labrador","Northwest Territories","Nova Scotia",
  "Nunavut","Ontario","Prince Edward Island","Quebec","Saskatchewan","Yukon",
];

// ── Helpers ──────────────────────────────────────────────────

function calculateAge(dateStr: string): number | null {
  if (!dateStr) return null;
  try {
    const dob = new Date(dateStr);
    if (isNaN(dob.getTime())) return null;
    const age = differenceInYears(new Date(), dob);
    return age >= 0 && age < 150 ? age : null;
  } catch {
    return null;
  }
}

function getRegionOptions(country: string): string[] {
  if (country === "US") return US_STATES;
  if (country === "CA") return CA_PROVINCES;
  return [];
}

function AgeBadge({ dateOfBirth }: { dateOfBirth?: string }) {
  const age = calculateAge(dateOfBirth ?? "");
  if (age === null) return null;
  return (
    <span className="ml-2 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      Age: <span className="font-semibold text-foreground">{age}</span>
    </span>
  );
}

// ── DOB Picker ───────────────────────────────────────────────

function DOBField({
  value,
  onChange,
  label,
}: {
  value?: string;
  onChange: (val: string) => void;
  label: string;
}) {
  return (
    <FormItem>
      <FormLabel>
        {label} <span className="text-destructive">*</span>
        <AgeBadge dateOfBirth={value} />
      </FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              className={cn(
                "w-full pl-3 text-left font-normal",
                !value && "text-muted-foreground"
              )}
            >
              {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
              <CalendarIcon className="ml-auto size-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={value ? new Date(value) : undefined}
            onSelect={(date) => onChange(date ? date.toISOString().split("T")[0] : "")}
            defaultMonth={value ? new Date(value) : new Date(1980, 0)}
            startMonth={new Date(1930, 0)}
            endMonth={new Date()}
            disabled={(date) => date > new Date() || date < new Date("1930-01-01")}
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  );
}

// ── Form value mappers ───────────────────────────────────────

function toFormValues(data?: Partial<Case> | null): CreateCaseInput {
  if (!data) {
    return {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      maritalStatus: "",
      dependents: 0,
      clientEmail: "",
      clientPhone: "",
      country: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      partnerFirstName: "",
      partnerLastName: "",
      partnerDateOfBirth: "",
      meetingDate: "",
      caseType: "life_insurance",
      description: "",
    };
  }
  return {
    firstName: (data as Record<string, string>).firstName ?? "",
    lastName: (data as Record<string, string>).lastName ?? "",
    dateOfBirth: (data as Record<string, string>).dateOfBirth ?? "",
    gender: (data as Record<string, string>).gender ?? "",
    maritalStatus: (data as Record<string, string>).maritalStatus ?? "",
    dependents: (data as Record<string, number>).dependents ?? 0,
    clientEmail: data.clientEmail ?? "",
    clientPhone: data.clientPhone ?? "",
    country: (data as Record<string, string>).country ?? "",
    street: (data as Record<string, string>).street ?? "",
    city: (data as Record<string, string>).city ?? "",
    state: (data as Record<string, string>).state ?? "",
    postalCode: (data as Record<string, string>).postalCode ?? "",
    partnerFirstName: (data as Record<string, string>).partnerFirstName ?? "",
    partnerLastName: (data as Record<string, string>).partnerLastName ?? "",
    partnerDateOfBirth: (data as Record<string, string>).partnerDateOfBirth ?? "",
    meetingDate: data.meetingDate ?? "",
    caseType: data.caseType ?? "life_insurance",
    description: data.description ?? "",
  };
}

// ── Main Form ────────────────────────────────────────────────

export interface CaseFormProps {
  initialData?: Partial<Case> | null;
  onSubmit: (values: CreateCaseInput) => Promise<void> | void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function CaseForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: CaseFormProps) {
  const form = useForm<CreateCaseInput>({
    resolver: zodResolver(createCaseSchema) as never,
    defaultValues: toFormValues(initialData),
  });

  const maritalStatus = form.watch("maritalStatus");
  const dateOfBirth = form.watch("dateOfBirth");
  const partnerDateOfBirth = form.watch("partnerDateOfBirth");
  const selectedCountry = form.watch("country");
  const isMarried = maritalStatus === "married";
  const regionOptions = getRegionOptions(selectedCountry ?? "");

  async function handleSubmit(values: CreateCaseInput) {
    await onSubmit(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Card>
          <CardHeader className="pb-4">
            <h2 className="text-lg font-semibold">New Case</h2>
            <p className="text-muted-foreground text-sm">
              Enter the client&apos;s personal details and case information.
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* ══════════ Section: Client Information ══════════ */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="size-4" />
                Client Information
              </div>

              {/* First & Last name */}
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* DOB + Gender */}
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <DOBField
                      value={field.value}
                      onChange={field.onChange}
                      label="Date of birth"
                    />
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GENDER_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Marital status + Dependents */}
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marital status <span className="text-destructive">*</span></FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v);
                          if (v !== "married") {
                            form.setValue("partnerFirstName", "");
                            form.setValue("partnerLastName", "");
                            form.setValue("partnerDateOfBirth", "");
                          }
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MARITAL_STATUS_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
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
                  name="dependents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of dependents</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? undefined : parseInt(e.target.value, 10)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Email + Phone */}
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
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
                      <FormLabel>Phone <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ══════════ Spouse (conditional) ══════════ */}
            {isMarried && (
              <>
                <Separator />
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Users className="size-4" />
                    Spouse / Partner Information
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="partnerFirstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Spouse first name <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Jane" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="partnerLastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Spouse last name <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="sm:w-1/2">
                    <FormField
                      control={form.control}
                      name="partnerDateOfBirth"
                      render={({ field }) => (
                        <DOBField
                          value={field.value}
                          onChange={field.onChange}
                          label="Spouse date of birth"
                        />
                      )}
                    />
                    {partnerDateOfBirth && (
                      <div className="mt-1">
                        <AgeBadge dateOfBirth={partnerDateOfBirth} />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ══════════ Section: Address ══════════ */}
            <Separator />
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="size-4" />
                Address
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v);
                          form.setValue("state", "");
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COUNTRY_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
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
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{selectedCountry === "CA" ? "Province" : "State"}</FormLabel>
                      {regionOptions.length > 0 ? (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${selectedCountry === "CA" ? "province" : "state"}`} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {regionOptions.map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <FormControl>
                          <Input placeholder="State / Province" {...field} />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{selectedCountry === "US" ? "ZIP code" : "Postal code"}</FormLabel>
                      <FormControl>
                        <Input placeholder={selectedCountry === "US" ? "12345" : "A1A 1A1"} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ══════════ Section: Case Information ══════════ */}
            <Separator />
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="size-4" />
                Case Information
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="meetingDate"
                  render={({ field }) => {
                    const selected = field.value ? new Date(field.value) : undefined;
                    return (
                      <FormItem>
                        <FormLabel>Meeting Date <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
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
                                {field.value && selected ? format(selected, "PPP") : "Select a date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selected}
                              onSelect={(date) => field.onChange(date ? date.toISOString() : "")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="caseType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Case Type <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select case type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CASE_TYPE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the case objectives..."
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
              <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? "Saving..." : initialData?.id ? "Update Case" : "Create Case"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
