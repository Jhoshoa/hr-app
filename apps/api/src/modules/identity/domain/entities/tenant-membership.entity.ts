export interface TenantMembershipContext {
  readonly tenantId: string;
  readonly tenantSlug: string;
  readonly roleKey: string;
  readonly permissions: string[];
}
