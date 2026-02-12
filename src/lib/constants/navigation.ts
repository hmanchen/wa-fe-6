import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Briefcase,
  Settings,
} from "lucide-react";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

export const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Cases",
    href: "/cases",
    icon: Briefcase,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];
