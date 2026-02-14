"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, differenceInYears } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { cn } from "@/lib/utils";
import {
  personalInfoSchema,
  type PersonalInfoInput,
} from "@/lib/validators/discovery";
import type { ClientPersonalInfo } from "@/types";

// ── Static data ──────────────────────────────────────────────

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

// ── Form value mappers ───────────────────────────────────────

function toFormValues(data?: ClientPersonalInfo | null): PersonalInfoInput {
  if (!data) {
    return {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      maritalStatus: "",
      partnerFirstName: "",
      partnerLastName: "",
      partnerDateOfBirth: "",
      dependents: 0,
      email: "",
      phone: "",
      address: { country: "", street: "", city: "", state: "", postalCode: "" },
    };
  }
  return {
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    dateOfBirth: data.dateOfBirth ?? "",
    gender: data.gender ?? "",
    maritalStatus: data.maritalStatus ?? "",
    partnerFirstName: data.partnerFirstName ?? "",
    partnerLastName: data.partnerLastName ?? "",
    partnerDateOfBirth: data.partnerDateOfBirth ?? "",
    dependents: data.dependents ?? 0,
    email: data.email ?? "",
    phone: data.phone ?? "",
    address: data.address
      ? {
          country: data.address.country ?? "",
          street: data.address.street ?? "",
          city: data.address.city ?? "",
          state: (data.address as { province?: string }).province ?? "",
          postalCode: data.address.postalCode ?? "",
        }
      : { country: "", street: "", city: "", state: "", postalCode: "" },
  };
}

function toClientPersonalInfo(values: PersonalInfoInput): ClientPersonalInfo {
  const isMarried = values.maritalStatus === "married";
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    dateOfBirth: values.dateOfBirth ?? "",
    gender: (values.gender as ClientPersonalInfo["gender"]) || undefined,
    maritalStatus:
      (values.maritalStatus as ClientPersonalInfo["maritalStatus"]) || undefined,
    partnerFirstName: isMarried ? values.partnerFirstName || undefined : undefined,
    partnerLastName: isMarried ? values.partnerLastName || undefined : undefined,
    partnerDateOfBirth: isMarried ? values.partnerDateOfBirth || undefined : undefined,
    dependents: values.dependents ?? 0,
    email: values.email || undefined,
    phone: values.phone || undefined,
    address:
      values.address?.street ||
      values.address?.city ||
      values.address?.state ||
      values.address?.postalCode ||
      values.address?.country
        ? {
            country: values.address?.country || undefined,
            street: values.address?.street,
            city: values.address?.city,
            province: values.address?.state,
            postalCode: values.address?.postalCode,
          }
        : undefined,
  };
}

// ── Reusable date picker ─────────────────────────────────────

function DateOfBirthPicker({
  value,
  onChange,
  label,
  className,
}: {
  value?: string;
  onChange: (val: string) => void;
  label: string;
  className?: string;
}) {
  return (
    <FormItem className={className}>
      <FormLabel>{label}</FormLabel>
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

// ── Age badge ────────────────────────────────────────────────

function AgeBadge({ dateOfBirth }: { dateOfBirth?: string }) {
  const age = calculateAge(dateOfBirth ?? "");
  if (age === null) return null;
  return (
    <div className="flex items-center rounded-md bg-muted px-3 py-2">
      <span className="text-sm text-muted-foreground">
        Age: <span className="font-semibold text-foreground">{age} years</span>
      </span>
    </div>
  );
}

// ── Main form ────────────────────────────────────────────────

export interface ClientInfoFormProps {
  defaultValues?: ClientPersonalInfo | null;
  onSubmit: (data: ClientPersonalInfo) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function ClientInfoForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: ClientInfoFormProps) {
  const form = useForm<PersonalInfoInput>({
    resolver: zodResolver(personalInfoSchema) as never,
    defaultValues: toFormValues(defaultValues),
  });

  const maritalStatus = form.watch("maritalStatus");
  const dateOfBirth = form.watch("dateOfBirth");
  const partnerDateOfBirth = form.watch("partnerDateOfBirth");
  const selectedCountry = form.watch("address.country");
  const isMarried = maritalStatus === "married";

  const regionOptions = getRegionOptions(selectedCountry ?? "");

  async function handleSubmit(values: PersonalInfoInput) {
    await onSubmit(toClientPersonalInfo(values));
  }

  return (
    <Form {...form}>
      <form
        id="discovery-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        {/* Name */}
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
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
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* DOB + Gender */}
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <DateOfBirthPicker
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
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {GENDER_OPTIONS.map((opt) => (
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

        {/* Client age */}
        <AgeBadge dateOfBirth={dateOfBirth} />

        {/* Marital status + dependents */}
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="maritalStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marital status</FormLabel>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    // Clear partner fields when switching away from married
                    if (val !== "married") {
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
                    {MARITAL_STATUS_OPTIONS.map((opt) => (
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

        {/* Partner information — shown only when married */}
        {isMarried && (
          <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
            <p className="text-sm font-medium text-foreground">
              Partner / Spouse Information
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="partnerFirstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partner first name</FormLabel>
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
                    <FormLabel>Partner last name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="partnerDateOfBirth"
              render={({ field }) => (
                <DateOfBirthPicker
                  value={field.value}
                  onChange={field.onChange}
                  label="Partner date of birth"
                  className="sm:w-1/2"
                />
              )}
            />
            <AgeBadge dateOfBirth={partnerDateOfBirth} />
          </div>
        )}

        {/* Email + phone */}
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Address */}
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm font-medium">Address</p>
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Country */}
            <FormField
              control={form.control}
              name="address.country"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Country</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val);
                      // Clear state/province when country changes
                      form.setValue("address.state", "");
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="sm:w-1/2">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COUNTRY_OPTIONS.map((opt) => (
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
            {/* Street */}
            <FormField
              control={form.control}
              name="address.street"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Street address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* City */}
            <FormField
              control={form.control}
              name="address.city"
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
            {/* State / Province — dropdown when country is selected, text input otherwise */}
            <FormField
              control={form.control}
              name="address.state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {selectedCountry === "CA" ? "Province" : "State"}
                  </FormLabel>
                  {regionOptions.length > 0 ? (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={`Select ${selectedCountry === "CA" ? "province" : "state"}`}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regionOptions.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
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
            {/* Postal code */}
            <FormField
              control={form.control}
              name="address.postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {selectedCountry === "US" ? "ZIP code" : "Postal code"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={selectedCountry === "US" ? "12345" : "A1A 1A1"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </Form>
  );
}
