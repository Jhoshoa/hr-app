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
    permissions: ["dashboard.read"]
  },
  {
    href: "/employees",
    icon: UsersRound,
    label: "Employees",
    permissions: ["employee.read"]
  },
  {
    href: "/directory",
    icon: UserRoundCheck,
    label: "Directory",
    permissions: ["directory.read"]
  },
  {
    href: "/leave",
    icon: ClipboardCheck,
    label: "Leave",
    permissions: ["leave.read"]
  },
  {
    href: "/documents",
    icon: FileText,
    label: "Documents",
    permissions: ["document.read"]
  },
  {
    href: "/recruiting",
    icon: BriefcaseBusiness,
    label: "Recruiting",
    permissions: ["recruiting.read"]
  },
  {
    href: "/reports",
    icon: BarChart3,
    label: "Reports",
    permissions: ["report.read"]
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
    permissions: ["role.manage"]
  }
];
