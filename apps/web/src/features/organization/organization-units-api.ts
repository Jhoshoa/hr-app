import { baseApi } from "@/features/api/base-api";
import type {
  OrganizationUnit,
  OrganizationUnitPayload,
  OrganizationUnitType,
  OrganizationUnitTypePayload
} from "./organization-units-types";

interface TenantScopedRequest {
  readonly tenantSlug: string;
}

interface TypeByIdRequest extends TenantScopedRequest {
  readonly typeId: string;
}

interface TypeMutationRequest extends TenantScopedRequest {
  readonly payload: OrganizationUnitTypePayload;
}

interface TypeOrderRequest extends TenantScopedRequest {
  readonly typeIds: readonly string[];
}

interface TypeUpdateRequest extends TypeByIdRequest {
  readonly payload: OrganizationUnitTypePayload;
}

interface UnitByIdRequest extends TenantScopedRequest {
  readonly unitId: string;
}

interface UnitMutationRequest extends TenantScopedRequest {
  readonly payload: OrganizationUnitPayload;
}

interface UnitUpdateRequest extends UnitByIdRequest {
  readonly payload: OrganizationUnitPayload;
}

export const organizationUnitsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listOrganizationUnitTypes: builder.query<OrganizationUnitType[], TenantScopedRequest>({
      query: () => "organization-unit-types",
      providesTags: (_result, _error, { tenantSlug }) => [
        { type: "OrganizationUnitType", id: tenantSlug }
      ]
    }),
    createOrganizationUnitType: builder.mutation<OrganizationUnitType, TypeMutationRequest>({
      query: ({ payload }) => ({
        url: "organization-unit-types",
        method: "POST",
        body: payload
      }),
      invalidatesTags: (_result, _error, { tenantSlug }) => [
        { type: "OrganizationUnitType", id: tenantSlug }
      ]
    }),
    updateOrganizationUnitType: builder.mutation<OrganizationUnitType, TypeUpdateRequest>({
      query: ({ typeId, payload }) => ({
        url: `organization-unit-types/${typeId}`,
        method: "PATCH",
        body: payload
      }),
      invalidatesTags: (_result, _error, { tenantSlug }) => [
        { type: "OrganizationUnitType", id: tenantSlug }
      ]
    }),
    archiveOrganizationUnitType: builder.mutation<OrganizationUnitType, TypeByIdRequest>({
      query: ({ typeId }) => ({
        url: `organization-unit-types/${typeId}/archive`,
        method: "POST"
      }),
      invalidatesTags: (_result, _error, { tenantSlug }) => [
        { type: "OrganizationUnitType", id: tenantSlug }
      ]
    }),
    reactivateOrganizationUnitType: builder.mutation<OrganizationUnitType, TypeByIdRequest>({
      query: ({ typeId }) => ({
        url: `organization-unit-types/${typeId}/reactivate`,
        method: "POST"
      }),
      invalidatesTags: (_result, _error, { tenantSlug }) => [
        { type: "OrganizationUnitType", id: tenantSlug }
      ]
    }),
    reorderOrganizationUnitTypes: builder.mutation<OrganizationUnitType[], TypeOrderRequest>({
      query: ({ typeIds }) => ({
        url: "organization-unit-types/order",
        method: "PUT",
        body: { typeIds }
      }),
      invalidatesTags: (_result, _error, { tenantSlug }) => [
        { type: "OrganizationUnitType", id: tenantSlug }
      ]
    }),
    listOrganizationUnits: builder.query<OrganizationUnit[], TenantScopedRequest>({
      query: () => "organization-units",
      providesTags: (_result, _error, { tenantSlug }) => [
        { type: "OrganizationUnit", id: tenantSlug }
      ]
    }),
    createOrganizationUnit: builder.mutation<OrganizationUnit, UnitMutationRequest>({
      query: ({ payload }) => ({
        url: "organization-units",
        method: "POST",
        body: payload
      }),
      invalidatesTags: (_result, _error, { tenantSlug }) => [
        { type: "OrganizationUnit", id: tenantSlug }
      ]
    }),
    updateOrganizationUnit: builder.mutation<OrganizationUnit, UnitUpdateRequest>({
      query: ({ unitId, payload }) => ({
        url: `organization-units/${unitId}`,
        method: "PATCH",
        body: payload
      }),
      invalidatesTags: (_result, _error, { tenantSlug }) => [
        { type: "OrganizationUnit", id: tenantSlug }
      ]
    }),
    archiveOrganizationUnit: builder.mutation<OrganizationUnit, UnitByIdRequest>({
      query: ({ unitId }) => ({
        url: `organization-units/${unitId}/archive`,
        method: "POST"
      }),
      invalidatesTags: (_result, _error, { tenantSlug }) => [
        { type: "OrganizationUnit", id: tenantSlug }
      ]
    }),
    reactivateOrganizationUnit: builder.mutation<OrganizationUnit, UnitByIdRequest>({
      query: ({ unitId }) => ({
        url: `organization-units/${unitId}/reactivate`,
        method: "POST"
      }),
      invalidatesTags: (_result, _error, { tenantSlug }) => [
        { type: "OrganizationUnit", id: tenantSlug }
      ]
    })
  })
});

export const {
  useArchiveOrganizationUnitMutation,
  useArchiveOrganizationUnitTypeMutation,
  useCreateOrganizationUnitMutation,
  useCreateOrganizationUnitTypeMutation,
  useListOrganizationUnitsQuery,
  useListOrganizationUnitTypesQuery,
  useReorderOrganizationUnitTypesMutation,
  useReactivateOrganizationUnitMutation,
  useReactivateOrganizationUnitTypeMutation,
  useUpdateOrganizationUnitMutation,
  useUpdateOrganizationUnitTypeMutation
} = organizationUnitsApi;
