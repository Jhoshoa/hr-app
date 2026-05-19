"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasAllFeatures } from "@/config/features";
import { navigationItems } from "@/config/navigation";
import { hasAnyPermission } from "@/config/permissions";
import { useCurrentTenant } from "@/hooks/use-current-tenant";
import { cn } from "@/lib/utils";

export function SidebarNav() {
  const pathname = usePathname();
  const tenant = useCurrentTenant();
  const items = navigationItems.filter(
    (item) =>
      hasAllFeatures(tenant.features ?? [], item.features ?? []) &&
      hasAnyPermission(tenant.permissions, item.permissions)
  );

  return (
    <nav className="space-y-1 px-3">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            className={cn(
              "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              isActive && "bg-muted text-foreground"
            )}
            href={item.href}
            key={item.href}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
