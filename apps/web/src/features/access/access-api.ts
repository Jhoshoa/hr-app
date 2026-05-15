import { baseApi } from "@/features/api/base-api";
import type {
  AcceptTenantInvitationPayload,
  AccessPermission,
  AccessRoleDetail,
  AccessRoleSummary,
  CreateRolePayload,
  CreateTenantInvitationPayload,
  RoleActionPayload,
  TenantInvitation,
  TenantInvitationActionPayload,
  TenantInvitationPreview,
  TenantUser,
  TenantUserActionPayload,
  UpdateRolePayload,
  UpdateRolePermissionsPayload,
  UpdateTenantUserRolesPayload
} from "./access-types";

export const accessApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPermissions: builder.query<AccessPermission[], string>({
      query: () => "/permissions",
      transformResponse: (response: { readonly permissions: AccessPermission[] }) => response.permissions,
      providesTags: ["Permission"]
    }),
    listRoles: builder.query<AccessRoleSummary[], string>({
      query: () => "/roles",
      transformResponse: (response: { readonly roles: AccessRoleSummary[] }) => response.roles,
      providesTags: (_result, _error, tenantSlug) => [{ type: "Role", id: `${tenantSlug}:list` }]
    }),
    getRole: builder.query<AccessRoleDetail, { readonly tenantSlug: string; readonly roleId: string }>({
      query: ({ roleId }) => `/roles/${roleId}`,
      providesTags: (_result, _error, { tenantSlug, roleId }) => [
        { type: "Role", id: `${tenantSlug}:${roleId}` }
      ]
    }),
    createRole: builder.mutation<AccessRoleDetail, CreateRolePayload>({
      query: ({ tenantSlug: _tenantSlug, ...body }) => ({
        url: "/roles",
        method: "POST",
        body
      }),
      invalidatesTags: (_result, _error, { tenantSlug }) => [
        { type: "Role", id: `${tenantSlug}:list` },
        { type: "TenantUser", id: `${tenantSlug}:list` },
        "CurrentUser"
      ]
    }),
    updateRole: builder.mutation<AccessRoleDetail, UpdateRolePayload>({
      query: ({ roleId, tenantSlug: _tenantSlug, ...body }) => ({
        url: `/roles/${roleId}`,
        method: "PATCH",
        body
      }),
      invalidatesTags: (_result, _error, { tenantSlug, roleId }) => [
        { type: "Role", id: `${tenantSlug}:list` },
        { type: "Role", id: `${tenantSlug}:${roleId}` },
        { type: "TenantUser", id: `${tenantSlug}:list` },
        "CurrentUser"
      ]
    }),
    updateRolePermissions: builder.mutation<AccessRoleDetail, UpdateRolePermissionsPayload>({
      query: ({ roleId, tenantSlug: _tenantSlug, permissionIds }) => ({
        url: `/roles/${roleId}/permissions`,
        method: "PUT",
        body: { permissionIds }
      }),
      invalidatesTags: (_result, _error, { tenantSlug, roleId }) => [
        { type: "Role", id: `${tenantSlug}:list` },
        { type: "Role", id: `${tenantSlug}:${roleId}` },
        { type: "TenantUser", id: `${tenantSlug}:list` },
        "CurrentUser"
      ]
    }),
    archiveRole: builder.mutation<AccessRoleDetail, RoleActionPayload>({
      query: ({ roleId }) => ({
        url: `/roles/${roleId}/archive`,
        method: "POST"
      }),
      invalidatesTags: (_result, _error, { tenantSlug, roleId }) => [
        { type: "Role", id: `${tenantSlug}:list` },
        { type: "Role", id: `${tenantSlug}:${roleId}` },
        { type: "TenantUser", id: `${tenantSlug}:list` },
        "CurrentUser"
      ]
    }),
    reactivateRole: builder.mutation<AccessRoleDetail, RoleActionPayload>({
      query: ({ roleId }) => ({
        url: `/roles/${roleId}/reactivate`,
        method: "POST"
      }),
      invalidatesTags: (_result, _error, { tenantSlug, roleId }) => [
        { type: "Role", id: `${tenantSlug}:list` },
        { type: "Role", id: `${tenantSlug}:${roleId}` },
        { type: "TenantUser", id: `${tenantSlug}:list` },
        "CurrentUser"
      ]
    }),
    listTenantUsers: builder.query<TenantUser[], string>({
      query: () => "/tenant-users",
      transformResponse: (response: { readonly users: TenantUser[] }) => response.users,
      providesTags: (_result, _error, tenantSlug) => [{ type: "TenantUser", id: `${tenantSlug}:list` }]
    }),
    updateTenantUserRoles: builder.mutation<TenantUser, UpdateTenantUserRolesPayload>({
      query: ({ membershipId, tenantSlug: _tenantSlug, roleIds }) => ({
        url: `/tenant-users/${membershipId}/roles`,
        method: "PUT",
        body: { roleIds }
      }),
      invalidatesTags: (_result, _error, { tenantSlug }) => [
        { type: "TenantUser", id: `${tenantSlug}:list` },
        "CurrentUser"
      ]
    }),
    disableTenantUser: builder.mutation<TenantUser, TenantUserActionPayload>({
      query: ({ membershipId }) => ({
        url: `/tenant-users/${membershipId}/disable`,
        method: "POST"
      }),
      invalidatesTags: (_result, _error, { tenantSlug }) => [
        { type: "TenantUser", id: `${tenantSlug}:list` },
        "CurrentUser"
      ]
    }),
    reactivateTenantUser: builder.mutation<TenantUser, TenantUserActionPayload>({
      query: ({ membershipId }) => ({
        url: `/tenant-users/${membershipId}/reactivate`,
        method: "POST"
      }),
      invalidatesTags: (_result, _error, { tenantSlug }) => [
        { type: "TenantUser", id: `${tenantSlug}:list` },
        "CurrentUser"
      ]
    }),
    listTenantInvitations: builder.query<TenantInvitation[], string>({
      query: () => "/tenant-invitations",
      transformResponse: (response: { readonly invitations: TenantInvitation[] }) => response.invitations,
      providesTags: (_result, _error, tenantSlug) => [
        { type: "TenantInvitation", id: `${tenantSlug}:list` }
      ]
    }),
    createTenantInvitation: builder.mutation<TenantInvitation, CreateTenantInvitationPayload>({
      query: ({ tenantSlug: _tenantSlug, ...body }) => ({
        url: "/tenant-invitations",
        method: "POST",
        body
      }),
      invalidatesTags: (_result, _error, { tenantSlug }) => [
        { type: "TenantInvitation", id: `${tenantSlug}:list` },
        { type: "TenantUser", id: `${tenantSlug}:list` }
      ]
    }),
    resendTenantInvitation: builder.mutation<TenantInvitation, TenantInvitationActionPayload>({
      query: ({ invitationId }) => ({
        url: `/tenant-invitations/${invitationId}/resend`,
        method: "POST"
      }),
      invalidatesTags: (_result, _error, { tenantSlug }) => [
        { type: "TenantInvitation", id: `${tenantSlug}:list` }
      ]
    }),
    cancelTenantInvitation: builder.mutation<TenantInvitation, TenantInvitationActionPayload>({
      query: ({ invitationId }) => ({
        url: `/tenant-invitations/${invitationId}/cancel`,
        method: "POST"
      }),
      invalidatesTags: (_result, _error, { tenantSlug }) => [
        { type: "TenantInvitation", id: `${tenantSlug}:list` },
        { type: "TenantUser", id: `${tenantSlug}:list` }
      ]
    }),
    previewTenantInvitation: builder.query<TenantInvitationPreview, string>({
      query: (token) => ({
        url: "/tenant-invitations/preview",
        params: { token }
      }),
      providesTags: (_result, _error, token) => [{ type: "InvitationPreview", id: token }]
    }),
    acceptTenantInvitation: builder.mutation<TenantInvitation, AcceptTenantInvitationPayload>({
      query: (body) => ({
        url: "/tenant-invitations/accept",
        method: "POST",
        body
      }),
      invalidatesTags: ["CurrentUser", "TenantInvitation", "TenantUser"]
    })
  })
});

export const {
  useAcceptTenantInvitationMutation,
  useArchiveRoleMutation,
  useCancelTenantInvitationMutation,
  useCreateRoleMutation,
  useCreateTenantInvitationMutation,
  useDisableTenantUserMutation,
  useGetRoleQuery,
  useListPermissionsQuery,
  useListRolesQuery,
  useListTenantInvitationsQuery,
  useListTenantUsersQuery,
  usePreviewTenantInvitationQuery,
  useReactivateRoleMutation,
  useReactivateTenantUserMutation,
  useResendTenantInvitationMutation,
  useUpdateRoleMutation,
  useUpdateRolePermissionsMutation,
  useUpdateTenantUserRolesMutation
} = accessApi;
