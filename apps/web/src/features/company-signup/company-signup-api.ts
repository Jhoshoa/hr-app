import { baseApi } from "@/features/api/base-api";
import type { CompanySignupRequestPayload } from "./company-signup-schema";
import type {
  AdminEmailAvailabilityResponse,
  AvailabilityResponse,
  CompanySignupRequestResponse,
  CompanyWebsiteAvailabilityResponse
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
    })
  })
});

export const {
  useCreateCompanySignupRequestMutation,
  useLazyCheckCompanySignupAdminEmailAvailabilityQuery,
  useLazyCheckCompanySignupTenantSlugAvailabilityQuery,
  useLazyCheckCompanySignupWebsiteAvailabilityQuery
} = companySignupApi;
