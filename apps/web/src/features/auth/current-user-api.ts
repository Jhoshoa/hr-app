import { baseApi } from "@/features/api/base-api";
import type { CurrentUser, PlatformRoleKey, TenantSummary } from "@/types/identity";

interface BackendTenantMembership {
  readonly tenantId: string;
  readonly tenantSlug: string;
  readonly tenantName: string;
  readonly roleKey: string;
  readonly permissions: string[];
}

interface BackendMeResponse {
  readonly user: CurrentUser;
  readonly tenants: readonly BackendTenantMembership[];
  readonly platformRoles?: readonly PlatformRoleKey[];
}

export interface MeResponse {
  readonly user: CurrentUser;
  readonly tenants: TenantSummary[];
  readonly platformRoles: PlatformRoleKey[];
}

export const currentUserApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<MeResponse, void>({
      providesTags: ["CurrentUser"],
      query: () => "/me",
      transformResponse: (response: BackendMeResponse): MeResponse => ({
        user: response.user,
        tenants: response.tenants.map((tenant) => ({ ...tenant })),
        platformRoles: [...(response.platformRoles ?? [])]
      })
    })
  })
});

export const { useGetMeQuery } = currentUserApi;
