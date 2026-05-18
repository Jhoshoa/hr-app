export interface TenantMembershipContext {
  readonly tenantId: string;
  readonly tenantSlug: string;
  readonly tenantName: string;
  readonly roleKey: string;
  readonly roles?: readonly {
    readonly id: string;
    readonly key: string;
    readonly name: string;
    readonly isSystemRole: boolean;
  }[];
  readonly permissions: string[];
  readonly features: string[];
}
