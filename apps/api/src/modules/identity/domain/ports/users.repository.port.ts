import type { PlatformRoleKey } from "@prisma/client";
import type { AuthenticatedUser } from "../entities/authenticated-user.entity";
import type { ExternalAuthUser } from "../entities/external-auth-user.entity";
import type { TenantMembershipContext } from "../entities/tenant-membership.entity";

export const USERS_REPOSITORY = Symbol("USERS_REPOSITORY");

export interface UsersRepository {
  findByExternalAuthId: (
    provider: string,
    providerUserId: string
  ) => Promise<AuthenticatedUser | null>;
  findByEmail: (email: string) => Promise<AuthenticatedUser | null>;
  linkExternalAuthUser: (
    userId: string,
    externalUser: ExternalAuthUser
  ) => Promise<AuthenticatedUser>;
  createFromExternalUser: (externalUser: ExternalAuthUser) => Promise<AuthenticatedUser>;
  syncExternalUserProfile: (
    userId: string,
    externalUser: ExternalAuthUser
  ) => Promise<AuthenticatedUser>;
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
  findPlatformRolesByUserId: (userId: string) => Promise<PlatformRoleKey[]>;
}
