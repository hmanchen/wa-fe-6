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
import { User, Settings, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const MOCK_PREFERENCES = {
  currency: "USD",
  dateFormat: "MMM dd, yyyy",
  theme: "system" as "light" | "dark" | "system",
};

const DEFAULT_PROFILE = {
  name: "",
  email: "",
  phone: "",
  licenseNumber: "",
  licenseState: "",
  npn: "",
  firmName: "",
  signature: "",
  showTeamCard: false,
};

export default function SettingsPage() {
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [preferences, setPreferences] = useState(MOCK_PREFERENCES);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);

  // Prevent hydration mismatch — useTheme returns undefined on server
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadAdvisorProfile = async () => {
      setProfileLoading(true);
      setProfileMessage(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setProfileLoading(false);
          return;
        }

        const metadata = user.user_metadata ?? {};
        const authPrefill = {
          name: metadata.full_name ?? "",
          email: user.email ?? "",
          phone: metadata.phone ?? "",
          licenseNumber: metadata.license_number ?? "",
          licenseState: metadata.license_state ?? "",
          npn: metadata.npn ?? "",
          firmName: metadata.firm_name ?? "",
          signature: metadata.signature ?? "",
          showTeamCard: Boolean(metadata.show_team_card ?? false),
        };

        const { data, error } = await supabase
          .from("advisor_profiles")
          .select("*")
          .eq("advisor_id", user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data) {
          setProfile({
            name: data.full_name ?? authPrefill.name,
            email: data.email ?? authPrefill.email,
            phone: data.phone ?? authPrefill.phone,
            licenseNumber: data.license_number ?? authPrefill.licenseNumber,
            licenseState: data.license_state ?? authPrefill.licenseState,
            npn: data.npn ?? authPrefill.npn,
            firmName: data.firm_name ?? authPrefill.firmName,
            signature: data.signature ?? authPrefill.signature,
            showTeamCard: Boolean(data.show_team_card ?? authPrefill.showTeamCard),
          });
        } else {
          setProfile((prev) => ({ ...prev, ...authPrefill }));
        }
      } catch {
        setProfileMessage("Unable to load advisor profile from Supabase.");
      } finally {
        setProfileLoading(false);
      }
    };

    void loadAdvisorProfile();
  }, [supabase]);

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      const payload = {
        advisor_id: user.id,
        full_name: profile.name,
        email: profile.email,
        phone: profile.phone,
        license_number: profile.licenseNumber,
        license_state: profile.licenseState,
        npn: profile.npn,
        firm_name: profile.firmName,
        signature: profile.signature,
        show_team_card: Boolean(profile.showTeamCard),
      };

      const { error } = await supabase
        .from("advisor_profiles")
        .upsert(payload, { onConflict: "advisor_id" });

      if (error) {
        throw error;
      }
      setProfileMessage("Profile saved.");
    } catch {
      setProfileMessage("Unable to save profile. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setPreferencesSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setProfileMessage("Preferences saved.");
    } finally {
      setPreferencesSaving(false);
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
                Advisor details used in client-facing reports
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileLoading && (
                <p className="text-muted-foreground text-sm">Loading advisor profile...</p>
              )}
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
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div className="pr-3">
                  <div className="text-sm font-medium text-foreground">
                    Show Practice Growth Opportunity
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Displays an optional team growth message in Recommendations with disclosure.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={profile.showTeamCard}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      showTeamCard: e.target.checked,
                    }))
                  }
                />
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="licenseState">License State</Label>
                  <Input
                    id="licenseState"
                    value={profile.licenseState}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, licenseState: e.target.value }))
                    }
                    placeholder="TN"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="npn">NPN</Label>
                  <Input
                    id="npn"
                    value={profile.npn}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, npn: e.target.value }))
                    }
                    placeholder="National Producer Number"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firmName">Firm Name</Label>
                  <Input
                    id="firmName"
                    value={profile.firmName}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, firmName: e.target.value }))
                    }
                    placeholder="Your firm name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signature">Signature</Label>
                  <Input
                    id="signature"
                    value={profile.signature}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, signature: e.target.value }))
                    }
                    placeholder="Typed signature"
                  />
                </div>
              </div>
              {profileMessage && (
                <p className="text-muted-foreground text-sm">{profileMessage}</p>
              )}
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
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={profile.firmName}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, firmName: e.target.value }))
                  }
                  placeholder="Your company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signatureCompany">Default Signature</Label>
                <Input
                  id="signatureCompany"
                  value={profile.signature}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, signature: e.target.value }))
                  }
                  placeholder="Advisor signature"
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={profileSaving}>
                {profileSaving ? "Saving..." : "Save Company Details"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
