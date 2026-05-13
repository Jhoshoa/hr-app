import type { ReactNode } from "react";
import { hasAnyPermission } from "@/config/permissions";
import { useCurrentTenant } from "@/hooks/use-current-tenant";

interface PermissionGateProps {
  readonly children: ReactNode;
  readonly permissions: readonly string[];
}

export function PermissionGate({ children, permissions }: PermissionGateProps) {
  const tenant = useCurrentTenant();

  if (!hasAnyPermission(tenant.permissions, permissions)) {
    return null;
  }

  return children;
}
