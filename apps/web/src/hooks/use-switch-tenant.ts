"use client";

import { useCallback } from "react";
import { baseApi } from "@/features/api/base-api";
import { dashboardApi } from "@/features/dashboard/dashboard-api";
import { selectTenant } from "@/features/tenants/tenant-slice";
import { saveSelectedTenantSlugToWorkspaceCache } from "@/lib/auth/workspace-cache";
import { useAppDispatch } from "@/store/hooks";
import { useAvailableTenants } from "./use-available-tenants";
import { useCurrentTenant } from "./use-current-tenant";

export const useSwitchTenant = () => {
  const dispatch = useAppDispatch();
  const currentTenant = useCurrentTenant();
  const availableTenants = useAvailableTenants();

  return useCallback(
    (tenantSlug: string) => {
      if (!tenantSlug || tenantSlug === currentTenant.tenantSlug) {
        return false;
      }

      const tenantExists = availableTenants.some((tenant) => tenant.tenantSlug === tenantSlug);

      if (!tenantExists) {
        return false;
      }

      dispatch(selectTenant(tenantSlug));
      saveSelectedTenantSlugToWorkspaceCache(tenantSlug);
      dispatch(baseApi.util.resetApiState());
      dispatch(dashboardApi.util.resetApiState());

      return true;
    },
    [availableTenants, currentTenant.tenantSlug, dispatch]
  );
};
