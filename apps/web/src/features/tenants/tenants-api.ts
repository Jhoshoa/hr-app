import { baseApi } from "@/features/api/base-api";

export interface TenantSettings {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly status: string;
  readonly defaultLanguage: "es" | "en" | string;
  readonly defaultCurrency: "BOB" | "USD" | string;
  readonly timezone: string;
}

export interface UpdateTenantSettingsRequest {
  readonly name?: string;
  readonly defaultLanguage?: "es" | "en";
  readonly defaultCurrency?: "BOB" | "USD";
  readonly timezone?: string;
}

export const tenantsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentTenant: builder.query<TenantSettings, void>({
      query: () => "tenants/current",
      providesTags: [{ type: "Tenant", id: "current" }]
    }),
    updateCurrentTenant: builder.mutation<TenantSettings, UpdateTenantSettingsRequest>({
      query: (body) => ({
        url: "tenants/current",
        method: "PATCH",
        body
      }),
      invalidatesTags: [{ type: "Tenant", id: "current" }, "CurrentUser"]
    })
  })
});

export const { useGetCurrentTenantQuery, useUpdateCurrentTenantMutation } = tenantsApi;
