import type { PermissionEntity } from "./permission.entity";

export type RoleStatus = "ACTIVE" | "ARCHIVED" | "INACTIVE";

export interface RoleSummaryEntity {
  readonly id: string;
  readonly tenantId: string | null;
  readonly key: string;
  readonly name: string;
  readonly description?: string | null;
  readonly isSystemRole: boolean;
  readonly status: RoleStatus;
  readonly memberCount: number;
  readonly permissionCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface RoleDetailEntity extends RoleSummaryEntity {
  readonly permissions: PermissionEntity[];
}

export interface CreateRoleInput {
  readonly tenantId: string;
  readonly key: string;
  readonly name: string;
  readonly description?: string | null;
  readonly permissionIds: readonly string[];
}

export interface UpdateRoleInput {
  readonly tenantId: string;
  readonly roleId: string;
  readonly name?: string;
  readonly description?: string | null;
}

