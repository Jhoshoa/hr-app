"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { platformNavigationItems } from "@/config/platform-navigation";
import { cn } from "@/lib/utils";

export function PlatformSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 px-3">
      {platformNavigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href ? pathname === item.href || pathname.startsWith(`${item.href}/`) : false;
        const className = cn(
          "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
          item.href
            ? "text-muted-foreground hover:bg-muted hover:text-foreground"
            : "cursor-not-allowed text-muted-foreground/60",
          isActive && "bg-muted text-foreground"
        );

        if (!item.href) {
          return (
            <div className={className} key={item.label}>
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </div>
          );
        }

        return (
          <Link className={className} href={item.href} key={item.href}>
            <Icon size={18} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
