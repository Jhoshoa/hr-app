import type { PermissionEntity } from "../entities/permission.entity";

export const PERMISSIONS_REPOSITORY = Symbol("PERMISSIONS_REPOSITORY");

export interface PermissionsRepository {
  list: () => Promise<PermissionEntity[]>;
  findIdsByTenantAssignableIds: (permissionIds: readonly string[]) => Promise<string[]>;
}

