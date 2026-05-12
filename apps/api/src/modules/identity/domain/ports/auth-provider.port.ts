import type { ExternalAuthUser } from "../entities/external-auth-user.entity";

export const AUTH_PROVIDER = Symbol("AUTH_PROVIDER");

export interface AuthProvider {
  verifyAccessToken: (token: string) => Promise<ExternalAuthUser>;
  getExternalUser: (providerUserId: string) => Promise<ExternalAuthUser | null>;
  inviteUser: (email: string, tenantId: string) => Promise<void>;
  disableUser: (providerUserId: string) => Promise<void>;
}
