import type { AuthenticatedUser } from "../entities/authenticated-user.entity";
import type { ExternalAuthUser } from "../entities/external-auth-user.entity";
import type { TenantMembershipContext } from "../entities/tenant-membership.entity";

export const USERS_REPOSITORY = Symbol("USERS_REPOSITORY");

export interface UsersRepository {
  findByExternalAuthId: (
    provider: string,
    providerUserId: string
  ) => Promise<AuthenticatedUser | null>;
  createFromExternalUser: (externalUser: ExternalAuthUser) => Promise<AuthenticatedUser>;
  ensureDevelopmentTenantMembership: (
    userId: string,
    tenantSlug: string,
    roleKey: string
  ) => Promise<void>;
  findTenantMembershipsByUserId: (userId: string) => Promise<TenantMembershipContext[]>;
  findTenantMembershipContext: (
    userId: string,
    tenantSlug: string
  ) => Promise<TenantMembershipContext | null>;
}
