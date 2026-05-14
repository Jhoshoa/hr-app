import { baseApi } from "@/features/api/base-api";
import type { CompanySignupRequestPayload } from "./company-signup-schema";
import type {
  ApprovePlatformCompanySignupRequestPayload,
  AdminEmailAvailabilityResponse,
  AvailabilityResponse,
  CompanySignupRequestResponse,
  CompanyWebsiteAvailabilityResponse,
  ListPlatformCompanySignupRequestsParams,
  PlatformCompanySignupRequest,
  PlatformCompanySignupRequestsResponse,
  PlatformTenantResponse,
  RejectPlatformCompanySignupRequestPayload
} from "./company-signup-types";

export const companySignupApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    checkCompanySignupAdminEmailAvailability: builder.query<AdminEmailAvailabilityResponse, string>({
      providesTags: (_result, _error, value) => [{ type: "CompanySignupAvailability", id: `admin-email:${value}` }],
      query: (value) => ({
        params: { value },
        url: "/company-signup-requests/availability/admin-email"
      })
    }),
    checkCompanySignupTenantSlugAvailability: builder.query<AvailabilityResponse, string>({
      providesTags: (_result, _error, value) => [{ type: "CompanySignupAvailability", id: `tenant-slug:${value}` }],
      query: (value) => ({
        params: { value },
        url: "/company-signup-requests/availability/tenant-slug"
      })
    }),
    checkCompanySignupWebsiteAvailability: builder.query<CompanyWebsiteAvailabilityResponse, string>({
      providesTags: (_result, _error, value) => [{ type: "CompanySignupAvailability", id: `website:${value}` }],
      query: (value) => ({
        params: { value },
        url: "/company-signup-requests/availability/company-website"
      })
    }),
    createCompanySignupRequest: builder.mutation<CompanySignupRequestResponse, CompanySignupRequestPayload>({
      invalidatesTags: ["CompanySignupRequest", "CompanySignupAvailability"],
      query: (body) => ({
        body,
        method: "POST",
        url: "/company-signup-requests"
      })
    }),
    listPlatformCompanySignupRequests: builder.query<
      PlatformCompanySignupRequestsResponse,
      ListPlatformCompanySignupRequestsParams
    >({
      providesTags: (result) => [
        { type: "CompanySignupRequest", id: "LIST" },
        ...(result?.items.map((request) => ({ type: "CompanySignupRequest" as const, id: request.id })) ?? [])
      ],
      query: ({ page, pageSize, search, status }) => ({
        params: {
          page,
          pageSize,
          ...(search?.trim() ? { search: search.trim() } : {}),
          ...(status && status !== "ALL" ? { status } : {})
        },
        url: "/platform/company-signup-requests"
      })
    }),
    getPlatformCompanySignupRequest: builder.query<PlatformCompanySignupRequest, string>({
      providesTags: (_result, _error, id) => [{ type: "CompanySignupRequest", id }],
      query: (id) => ({
        url: `/platform/company-signup-requests/${id}`
      })
    }),
    approvePlatformCompanySignupRequest: builder.mutation<
      PlatformCompanySignupRequest,
      ApprovePlatformCompanySignupRequestPayload
    >({
      invalidatesTags: (_result, _error, payload) => [
        { type: "CompanySignupRequest", id: "LIST" },
        { type: "CompanySignupRequest", id: payload.id },
        "CurrentUser"
      ],
      query: ({ id, ...body }) => ({
        body,
        method: "POST",
        url: `/platform/company-signup-requests/${id}/approve`
      })
    }),
    rejectPlatformCompanySignupRequest: builder.mutation<
      PlatformCompanySignupRequest,
      RejectPlatformCompanySignupRequestPayload
    >({
      invalidatesTags: (_result, _error, payload) => [
        { type: "CompanySignupRequest", id: "LIST" },
        { type: "CompanySignupRequest", id: payload.id }
      ],
      query: ({ id, ...body }) => ({
        body,
        method: "POST",
        url: `/platform/company-signup-requests/${id}/reject`
      })
    }),
    archivePlatformTenant: builder.mutation<PlatformTenantResponse, { readonly id: string; readonly reason?: string }>({
      invalidatesTags: ["PlatformTenant", "CompanySignupRequest"],
      query: ({ id, reason }) => ({
        body: { reason },
        method: "POST",
        url: `/platform/tenants/${id}/archive`
      })
    }),
    reactivatePlatformTenant: builder.mutation<PlatformTenantResponse, string>({
      invalidatesTags: ["PlatformTenant", "CompanySignupRequest"],
      query: (id) => ({
        method: "POST",
        url: `/platform/tenants/${id}/reactivate`
      })
    })
  })
});

export const {
  useApprovePlatformCompanySignupRequestMutation,
  useArchivePlatformTenantMutation,
  useCreateCompanySignupRequestMutation,
  useGetPlatformCompanySignupRequestQuery,
  useListPlatformCompanySignupRequestsQuery,
  useLazyCheckCompanySignupAdminEmailAvailabilityQuery,
  useLazyCheckCompanySignupTenantSlugAvailabilityQuery,
  useLazyCheckCompanySignupWebsiteAvailabilityQuery,
  useReactivatePlatformTenantMutation,
  useRejectPlatformCompanySignupRequestMutation
} = companySignupApi;
