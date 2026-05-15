import type {
  ReplaceTenantUserRolesInput,
  SetTenantMembershipStatusInput,
  TenantUserEntity,
  TenantUserMembershipWithPermissions
} from "../entities/tenant-user.entity";

export const TENANT_USERS_REPOSITORY = Symbol("TENANT_USERS_REPOSITORY");

export interface TenantUsersRepository {
  list: (tenantId: string) => Promise<TenantUserEntity[]>;
  findByMembershipId: (tenantId: string, membershipId: string) => Promise<TenantUserEntity | null>;
  findMembershipWithPermissions: (
    tenantId: string,
    membershipId: string
  ) => Promise<TenantUserMembershipWithPermissions | null>;
  replaceRoles: (input: ReplaceTenantUserRolesInput) => Promise<TenantUserEntity>;
  setStatus: (input: SetTenantMembershipStatusInput) => Promise<TenantUserEntity>;
}

