export type AccessRecordStatus = "ACTIVE" | "ARCHIVED" | "INACTIVE";
export type TenantUserStatus = "INVITED" | "ACTIVE" | "DISABLED";
export type TenantInvitationStatus = "PENDING" | "ACCEPTED" | "CANCELLED" | "EXPIRED";

export interface AccessRoleSummary {
  readonly id: string;
  readonly tenantId: string | null;
  readonly key: string;
  readonly name: string;
  readonly description?: string | null;
  readonly isSystemRole: boolean;
  readonly status: AccessRecordStatus;
  readonly memberCount: number;
  readonly permissionCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AccessPermission {
  readonly id: string;
  readonly key: string;
  readonly description: string;
  readonly module?: string | null;
  readonly action?: string | null;
  readonly sortOrder: number;
  readonly isCritical: boolean;
  readonly createdAt: string;
}

export interface AccessRoleDetail extends AccessRoleSummary {
  readonly permissions: AccessPermission[];
}

export interface AccessRoleReference {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly isSystemRole: boolean;
  readonly status: AccessRecordStatus | string;
}

export interface TenantUser {
  readonly membershipId: string;
  readonly userId: string;
  readonly email: string;
  readonly name?: string | null;
  readonly userStatus: TenantUserStatus;
  readonly membershipStatus: TenantUserStatus;
  readonly roles: AccessRoleReference[];
  readonly effectivePermissions: string[];
  readonly invitedAt: string;
  readonly joinedAt?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TenantInvitation {
  readonly id: string;
  readonly tenantId: string;
  readonly email: string;
  readonly membershipId?: string | null;
  readonly status: TenantInvitationStatus;
  readonly invitedByUserId?: string | null;
  readonly acceptedByUserId?: string | null;
  readonly expiresAt: string;
  readonly resendCount: number;
  readonly lastSentAt?: string | null;
  readonly acceptedAt?: string | null;
  readonly cancelledAt?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly roles: AccessRoleReference[];
  readonly acceptanceToken?: string;
}

export interface TenantInvitationPreview {
  readonly tenantName: string;
  readonly invitedEmail: string;
  readonly status: TenantInvitationStatus;
  readonly expiresAt: string;
  readonly roles: readonly {
    readonly name: string;
  }[];
}

export interface CreateRolePayload {
  readonly tenantSlug: string;
  readonly key?: string;
  readonly name: string;
  readonly description?: string;
  readonly permissionIds: readonly string[];
}

export interface UpdateRolePayload {
  readonly tenantSlug: string;
  readonly roleId: string;
  readonly name?: string;
  readonly description?: string;
}

export interface UpdateRolePermissionsPayload {
  readonly tenantSlug: string;
  readonly roleId: string;
  readonly permissionIds: readonly string[];
}

export interface RoleActionPayload {
  readonly tenantSlug: string;
  readonly roleId: string;
}

export interface UpdateTenantUserRolesPayload {
  readonly tenantSlug: string;
  readonly membershipId: string;
  readonly roleIds: readonly string[];
}

export interface TenantUserActionPayload {
  readonly tenantSlug: string;
  readonly membershipId: string;
}

export interface CreateTenantInvitationPayload {
  readonly tenantSlug: string;
  readonly email: string;
  readonly roleIds: readonly string[];
}

export interface TenantInvitationActionPayload {
  readonly tenantSlug: string;
  readonly invitationId: string;
}

export interface AcceptTenantInvitationPayload {
  readonly token: string;
}
