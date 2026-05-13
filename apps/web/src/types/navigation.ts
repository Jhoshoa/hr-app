import type { LucideIcon } from "lucide-react";

export interface NavigationItem {
  readonly href: string;
  readonly icon: LucideIcon;
  readonly label: string;
  readonly permissions: readonly string[];
}
