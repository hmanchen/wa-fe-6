"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Settings, Building2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_PROFILE = {
  name: "Sarah Chen",
  email: "sarah.chen@wealthadvisors.com",
  phone: "+1 (555) 123-4567",
  licenseNumber: "CA-1234567",
};

const MOCK_PREFERENCES = {
  currency: "USD",
  dateFormat: "MMM dd, yyyy",
  theme: "system" as "light" | "dark" | "system",
};

const MOCK_COMPANY = {
  name: "WealthAdvisors Inc.",
  address: "123 Financial District, San Francisco, CA 94105",
};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const [preferences, setPreferences] = useState(MOCK_PREFERENCES);
  const [company, setCompany] = useState(MOCK_COMPANY);
  const [profileSaving, setProfileSaving] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [companySaving, setCompanySaving] = useState(false);

  // Prevent hydration mismatch — useTheme returns undefined on server
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setPreferencesSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
    } finally {
      setPreferencesSaving(false);
    }
  };

  const handleSaveCompany = async () => {
    setCompanySaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
    } finally {
      setCompanySaving(false);
    }
  };

  const handleThemeChange = (value: "light" | "dark" | "system") => {
    setTheme(value);
    setPreferences((prev) => ({ ...prev, theme: value }));
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Settings"
        description="Manage your profile, preferences, and company information"
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full max-w-full grid-cols-3 sm:max-w-md">
          <TabsTrigger value="profile" className="gap-2">
            <User className="size-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Settings className="size-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="size-4" />
            Company
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Profile Information</h3>
              <p className="text-muted-foreground text-sm">
                Your personal details and license information
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Advisor Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license">License Number</Label>
                  <Input
                    id="license"
                    value={profile.licenseNumber}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        licenseNumber: e.target.value,
                      }))
                    }
                    placeholder="State-1234567"
                  />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={profileSaving}>
                {profileSaving ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Preferences</h3>
              <p className="text-muted-foreground text-sm">
                Default display and behavior settings
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select
                    value={preferences.currency}
                    onValueChange={(value) =>
                      setPreferences((prev) => ({ ...prev, currency: value }))
                    }
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={preferences.dateFormat}
                    onValueChange={(value) =>
                      setPreferences((prev) => ({
                        ...prev,
                        dateFormat: value,
                      }))
                    }
                  >
                    <SelectTrigger id="dateFormat">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MMM dd, yyyy">MMM dd, yyyy</SelectItem>
                      <SelectItem value="dd/MM/yyyy">dd/MM/yyyy</SelectItem>
                      <SelectItem value="MM/dd/yyyy">MM/dd/yyyy</SelectItem>
                      <SelectItem value="yyyy-MM-dd">yyyy-MM-dd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                {mounted ? (
                  <Select
                    value={theme ?? "light"}
                    onValueChange={(value: "light" | "dark" | "system") =>
                      handleThemeChange(value)
                    }
                  >
                    <SelectTrigger id="theme" className="max-w-[200px]">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="h-9 w-[200px] animate-pulse rounded-md bg-muted" />
                )}
                <p className="text-muted-foreground text-xs">
                  Choose light, dark, or match your system preference
                </p>
              </div>

              <Button
                onClick={handleSavePreferences}
                disabled={preferencesSaving}
              >
                {preferencesSaving ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Company Information</h3>
              <p className="text-muted-foreground text-sm">
                Your firm&apos;s details for client-facing reports
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={company.name}
                  onChange={(e) =>
                    setCompany((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Your company name"
                />
              </div>
              <div className="space-y-2">
                <Label>Company Logo</Label>
                <div
                  className={cn(
                    "flex min-h-[120px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 p-6 transition-colors",
                    "hover:bg-muted/50"
                  )}
                >
                  <Upload className="text-muted-foreground mb-2 size-8" />
                  <p className="text-muted-foreground mb-1 text-sm font-medium">
                    Upload logo
                  </p>
                  <p className="text-muted-foreground text-xs">
                    PNG, JPG up to 2MB
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Choose File
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={company.address}
                  onChange={(e) =>
                    setCompany((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Company address"
                />
              </div>
              <Button onClick={handleSaveCompany} disabled={companySaving}>
                {companySaving ? "Saving..." : "Save Company"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
