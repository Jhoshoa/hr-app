import type { PermissionEntity } from "./permission.entity";

export type TenantUserStatus = "INVITED" | "ACTIVE" | "DISABLED";

export interface TenantUserRoleEntity {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly isSystemRole: boolean;
  readonly status: string;
}

export interface TenantUserEntity {
  readonly membershipId: string;
  readonly userId: string;
  readonly email: string;
  readonly name?: string | null;
  readonly userStatus: TenantUserStatus;
  readonly membershipStatus: TenantUserStatus;
  readonly roles: TenantUserRoleEntity[];
  readonly effectivePermissions: string[];
  readonly invitedAt: Date;
  readonly joinedAt?: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ReplaceTenantUserRolesInput {
  readonly tenantId: string;
  readonly membershipId: string;
  readonly roleIds: readonly string[];
}

export interface SetTenantMembershipStatusInput {
  readonly tenantId: string;
  readonly membershipId: string;
  readonly status: "ACTIVE" | "DISABLED";
}

export interface TenantUserMembershipWithPermissions {
  readonly membershipId: string;
  readonly userId: string;
  readonly status: TenantUserStatus;
  readonly roles: readonly {
    readonly id: string;
    readonly key: string;
    readonly permissions: readonly PermissionEntity[];
  }[];
}

