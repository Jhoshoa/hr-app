"use client";

import { Building2 } from "lucide-react";
import { useCurrentTenant } from "@/hooks/use-current-tenant";

export function TenantIdentity() {
  const tenant = useCurrentTenant();

  return (
    <div className="flex min-w-0 items-center gap-3 border-b border-border px-4 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Building2 size={18} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{tenant.tenantName}</p>
        <p className="truncate text-xs text-muted-foreground">{tenant.roleKey.replace("_", " ")}</p>
      </div>
    </div>
  );
}
