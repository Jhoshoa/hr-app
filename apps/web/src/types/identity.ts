export type PlatformRoleKey = "PLATFORM_OWNER" | "PLATFORM_ADMIN" | "PLATFORM_SUPPORT";

export interface TenantSummary {
  readonly tenantId: string;
  readonly tenantSlug: string;
  readonly tenantName: string;
  readonly roleKey: string;
  readonly roles?: TenantRoleSummary[];
  readonly permissions: string[];
  readonly features: string[];
}

export interface TenantRoleSummary {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly isSystemRole: boolean;
}

export interface CurrentUser {
  readonly id: string;
  readonly email: string;
  readonly name?: string;
  readonly externalAuthProvider?: string;
  readonly externalAuthUserId?: string;
}
