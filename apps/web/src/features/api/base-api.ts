import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { env } from "@/config/env";
import { getAccessToken } from "@/lib/auth/session";
import type { RootState } from "@/store";

export const baseApi = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: env.apiBaseUrl,
    prepareHeaders: async (headers, { getState }) => {
      const token = await getAccessToken();
      const tenantSlug = (getState() as RootState).tenant.currentTenant.tenantSlug;

      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }

      if (tenantSlug) {
        headers.set("x-tenant-slug", tenantSlug);
      }

      return headers;
    }
  }),
  endpoints: () => ({}),
  reducerPath: "baseApi",
  tagTypes: ["CurrentUser", "Tenant", "AuditEvent"]
});
