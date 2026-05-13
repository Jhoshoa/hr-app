"use client";

import { LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currentUserFixture } from "@/test/fixtures/current-user";

export function UserMenu() {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium">{currentUserFixture.name}</p>
        <p className="text-xs text-muted-foreground">{currentUserFixture.email}</p>
      </div>
      <Button aria-label="User account" variant="secondary" className="h-9 w-9 px-0">
        <UserRound size={17} aria-hidden="true" />
      </Button>
      <Button aria-label="Log out" variant="ghost" className="h-9 w-9 px-0">
        <LogOut size={17} aria-hidden="true" />
      </Button>
    </div>
  );
}
