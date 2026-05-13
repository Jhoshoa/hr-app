import type { ReactNode } from "react";
import { SidebarNav } from "./sidebar-nav";
import { TenantIdentity } from "./tenant-identity";
import { TopBar } from "./top-bar";

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-surface lg:block">
        <TenantIdentity />
        <div className="py-4">
          <SidebarNav />
        </div>
      </aside>
      <div className="lg:pl-64">
        <TopBar />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
