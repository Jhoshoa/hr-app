import { Building2, ClipboardList, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface PlatformNavigationItem {
  readonly href?: string;
  readonly icon: LucideIcon;
  readonly label: string;
}

export const platformNavigationItems: PlatformNavigationItem[] = [
  {
    href: "/platform/company-signups",
    icon: ClipboardList,
    label: "Company signups"
  },
  {
    icon: Building2,
    label: "Tenants"
  },
  {
    icon: UsersRound,
    label: "Platform users"
  }
];
