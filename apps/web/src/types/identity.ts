export interface TenantSummary {
  readonly tenantId: string;
  readonly tenantSlug: string;
  readonly tenantName: string;
  readonly roleKey: string;
  readonly permissions: readonly string[];
}

export interface CurrentUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
}
