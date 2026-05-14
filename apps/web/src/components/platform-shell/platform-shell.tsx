import type { ReactNode } from "react";
import { PlatformSidebarNav } from "./platform-sidebar-nav";
import { PlatformTopBar } from "./platform-top-bar";

export function PlatformShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-surface lg:block">
        <div className="border-b border-border px-5 py-5">
          <p className="text-sm font-semibold text-foreground">HR Platform</p>
          <p className="mt-1 text-xs text-muted-foreground">Operations console</p>
        </div>
        <div className="py-4">
          <PlatformSidebarNav />
        </div>
      </aside>
      <div className="lg:pl-64">
        <PlatformTopBar />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
