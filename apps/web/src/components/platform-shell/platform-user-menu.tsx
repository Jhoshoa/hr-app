"use client";

import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { baseApi } from "@/features/api/base-api";
import { clearCurrentUser } from "@/features/auth/auth-slice";
import { clearTenants } from "@/features/tenants/tenant-slice";
import { usePlatformRoles } from "@/hooks/use-platform-roles";
import { useCurrentUser } from "@/hooks/use-current-user";
import { loginPath } from "@/lib/auth/auth-redirects";
import { createSupabaseBrowserClient } from "@/lib/auth/supabase-client";
import { clearWorkspaceContextCache } from "@/lib/auth/workspace-cache";
import { useAppDispatch } from "@/store/hooks";

const roleLabels: Record<string, string> = {
  PLATFORM_ADMIN: "Platform admin",
  PLATFORM_OWNER: "Platform owner",
  PLATFORM_SUPPORT: "Platform support"
};

const getDisplayName = (name: string | undefined, email: string | undefined) =>
  name?.trim() || email?.split("@")[0] || "Signed-in user";

export function PlatformUserMenu() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const currentUser = useCurrentUser();
  const platformRoles = usePlatformRoles();
  const displayName = getDisplayName(currentUser?.name, currentUser?.email);
  const roleSummary = platformRoles.map((role) => roleLabels[role] ?? role).join(", ");

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();

    await supabase?.auth.signOut();
    clearWorkspaceContextCache();
    dispatch(baseApi.util.resetApiState());
    dispatch(clearCurrentUser());
    dispatch(clearTenants());
    setIsOpen(false);
    router.replace(loginPath);
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative flex items-center gap-3" ref={menuRef}>
      <div className="hidden text-right sm:block">
        <p className="max-w-48 truncate text-sm font-medium">{displayName}</p>
        <p className="max-w-48 truncate text-xs text-muted-foreground">{currentUser?.email ?? "Loading account"}</p>
      </div>
      <Button
        aria-expanded={isOpen}
        aria-label="Platform account menu"
        className="h-9 gap-1 px-2"
        onClick={() => setIsOpen((value) => !value)}
        variant="secondary"
      >
        <UserRound size={17} aria-hidden="true" />
        <ChevronDown size={14} aria-hidden="true" />
      </Button>

      {isOpen ? (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{currentUser?.email}</p>
          </div>

          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Platform access</p>
            <p className="mt-1 truncate text-sm font-medium">{roleSummary || "Platform user"}</p>
          </div>

          <div className="py-2">
            <button
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
              onClick={handleLogout}
              type="button"
            >
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
