import { baseApi } from "@/features/api/base-api";

export interface TenantProfileSettings {
  readonly website: string | null;
  readonly companySize: string | null;
  readonly country: string | null;
  readonly phone: string | null;
  readonly contactEmail: string | null;
}

export interface TenantSettings {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly status: string;
  readonly defaultLanguage: "es" | "en" | string;
  readonly defaultCurrency: "BOB" | "USD" | string;
  readonly timezone: string;
  readonly profile: TenantProfileSettings | null;
}

export interface UpdateTenantSettingsRequest {
  readonly tenantSlug: string;
  readonly name?: string;
  readonly defaultLanguage?: "es" | "en";
  readonly defaultCurrency?: "BOB" | "USD";
  readonly timezone?: string;
  readonly profile?: Partial<Omit<TenantProfileSettings, "contactEmail">>;
}

export const tenantsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentTenant: builder.query<TenantSettings, string>({
      query: () => "tenants/current",
      providesTags: (_result, _error, tenantSlug) => [{ type: "Tenant", id: `current:${tenantSlug}` }]
    }),
    updateCurrentTenant: builder.mutation<TenantSettings, UpdateTenantSettingsRequest>({
      query: ({ tenantSlug: _tenantSlug, ...body }) => ({
        url: "tenants/current",
        method: "PATCH",
        body
      }),
      invalidatesTags: (_result, _error, { tenantSlug }) => [
        { type: "Tenant", id: `current:${tenantSlug}` },
        "CurrentUser"
      ]
    })
  })
});

export const { useGetCurrentTenantQuery, useUpdateCurrentTenantMutation } = tenantsApi;
