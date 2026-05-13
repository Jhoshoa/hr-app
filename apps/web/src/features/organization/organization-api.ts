import { baseApi } from "@/features/api/base-api";
import { organizationCatalogByKind } from "./organization-config";
import type {
  OrganizationRecord,
  OrganizationRecordKind,
  OrganizationRecordPayload
} from "./organization-types";

interface OrganizationRecordRequest {
  readonly kind: OrganizationRecordKind;
}

interface OrganizationRecordMutationRequest extends OrganizationRecordRequest {
  readonly payload: OrganizationRecordPayload;
}

interface OrganizationRecordByIdRequest extends OrganizationRecordRequest {
  readonly id: string;
}

interface OrganizationRecordUpdateRequest extends OrganizationRecordByIdRequest {
  readonly payload: OrganizationRecordPayload;
}

const pathFor = (kind: OrganizationRecordKind) => organizationCatalogByKind[kind].path;

export const organizationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listOrganizationRecords: builder.query<OrganizationRecord[], OrganizationRecordRequest>({
      query: ({ kind }) => pathFor(kind),
      providesTags: (_result, _error, { kind }) => [{ type: "OrganizationRecord", id: kind }]
    }),
    createOrganizationRecord: builder.mutation<OrganizationRecord, OrganizationRecordMutationRequest>({
      query: ({ kind, payload }) => ({
        url: pathFor(kind),
        method: "POST",
        body: payload
      }),
      invalidatesTags: (_result, _error, { kind }) => [{ type: "OrganizationRecord", id: kind }]
    }),
    updateOrganizationRecord: builder.mutation<OrganizationRecord, OrganizationRecordUpdateRequest>({
      query: ({ kind, id, payload }) => ({
        url: `${pathFor(kind)}/${id}`,
        method: "PATCH",
        body: payload
      }),
      invalidatesTags: (_result, _error, { kind }) => [{ type: "OrganizationRecord", id: kind }]
    }),
    archiveOrganizationRecord: builder.mutation<OrganizationRecord, OrganizationRecordByIdRequest>({
      query: ({ kind, id }) => ({
        url: `${pathFor(kind)}/${id}/archive`,
        method: "POST"
      }),
      invalidatesTags: (_result, _error, { kind }) => [{ type: "OrganizationRecord", id: kind }]
    }),
    reactivateOrganizationRecord: builder.mutation<OrganizationRecord, OrganizationRecordByIdRequest>({
      query: ({ kind, id }) => ({
        url: `${pathFor(kind)}/${id}/reactivate`,
        method: "POST"
      }),
      invalidatesTags: (_result, _error, { kind }) => [{ type: "OrganizationRecord", id: kind }]
    })
  })
});

export const {
  useArchiveOrganizationRecordMutation,
  useCreateOrganizationRecordMutation,
  useListOrganizationRecordsQuery,
  useReactivateOrganizationRecordMutation,
  useUpdateOrganizationRecordMutation
} = organizationApi;
