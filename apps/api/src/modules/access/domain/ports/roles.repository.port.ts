import type {
  CreateRoleInput,
  RoleDetailEntity,
  RoleSummaryEntity,
  UpdateRoleInput
} from "../entities/role.entity";

export const ROLES_REPOSITORY = Symbol("ROLES_REPOSITORY");

export interface RolesRepository {
  list: (tenantId: string) => Promise<RoleSummaryEntity[]>;
  findById: (tenantId: string, roleId: string) => Promise<RoleDetailEntity | null>;
  findByKey: (tenantId: string, key: string) => Promise<RoleDetailEntity | null>;
  create: (input: CreateRoleInput) => Promise<RoleDetailEntity>;
  update: (input: UpdateRoleInput) => Promise<RoleDetailEntity>;
  replacePermissions: (
    tenantId: string,
    roleId: string,
    permissionIds: readonly string[]
  ) => Promise<RoleDetailEntity>;
  setStatus: (
    tenantId: string,
    roleId: string,
    status: "ACTIVE" | "ARCHIVED"
  ) => Promise<RoleDetailEntity>;
  countActiveMembershipAssignments: (tenantId: string, roleId: string) => Promise<number>;
  countActiveOwnerMemberships: (tenantId: string) => Promise<number>;
}

