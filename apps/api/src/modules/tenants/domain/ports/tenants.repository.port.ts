import type { TenantEntity, UpdateTenantSettingsInput } from "../entities/tenant.entity";

export const TENANTS_REPOSITORY = Symbol("TENANTS_REPOSITORY");

export interface TenantsRepository {
  findById: (tenantId: string) => Promise<TenantEntity | null>;
  findBySlug: (slug: string) => Promise<TenantEntity | null>;
  updateSettings: (input: UpdateTenantSettingsInput) => Promise<TenantEntity>;
}
