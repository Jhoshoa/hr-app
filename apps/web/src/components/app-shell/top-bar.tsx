"use client";

import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserMenu } from "./user-menu";

export function TopBar() {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-surface px-4 lg:px-6">
      <div className="relative hidden w-full max-w-md md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input className="pl-9" placeholder="Search people, documents, requests" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground hover:bg-muted" aria-label="Notifications">
          <Bell size={17} aria-hidden="true" />
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
