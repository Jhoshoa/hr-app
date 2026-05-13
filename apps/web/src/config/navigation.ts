import {
  BarChart3,
  BriefcaseBusiness,
  ClipboardCheck,
  FileText,
  Gauge,
  Settings,
  UserRoundCheck,
  UsersRound
} from "lucide-react";
import type { NavigationItem } from "@/types/navigation";

export const navigationItems: NavigationItem[] = [
  {
    href: "/dashboard",
    icon: Gauge,
    label: "Dashboard",
    permissions: ["tenant.read"]
  },
  {
    href: "/employees",
    icon: UsersRound,
    label: "Employees",
    permissions: ["employees.read"]
  },
  {
    href: "/directory",
    icon: UserRoundCheck,
    label: "Directory",
    permissions: ["employees.read"]
  },
  {
    href: "/leave",
    icon: ClipboardCheck,
    label: "Leave",
    permissions: ["employees.read"]
  },
  {
    href: "/documents",
    icon: FileText,
    label: "Documents",
    permissions: ["employees.read"]
  },
  {
    href: "/recruiting",
    icon: BriefcaseBusiness,
    label: "Recruiting",
    permissions: ["users.manage"]
  },
  {
    href: "/reports",
    icon: BarChart3,
    label: "Reports",
    permissions: ["audit.read"]
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
    permissions: ["roles.manage"]
  }
];
