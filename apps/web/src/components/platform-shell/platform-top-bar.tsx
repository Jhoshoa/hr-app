"use client";

import { ShieldCheck } from "lucide-react";
import { PlatformUserMenu } from "./platform-user-menu";

export function PlatformTopBar() {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-surface px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-muted-foreground">
        <ShieldCheck size={17} aria-hidden="true" />
        <span className="truncate">Platform admin</span>
      </div>
      <PlatformUserMenu />
    </header>
  );
}
