export interface TenantEntity {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly status: string;
  readonly defaultLanguage: string;
  readonly defaultCurrency: string;
  readonly timezone: string;
  readonly profile: TenantProfileEntity | null;
}

export interface TenantProfileEntity {
  readonly website: string | null;
  readonly companySize: string | null;
  readonly country: string | null;
  readonly phone: string | null;
  readonly contactEmail: string | null;
}

export interface UpdateTenantProfileInput {
  readonly website?: string | null;
  readonly companySize?: string | null;
  readonly country?: string | null;
  readonly phone?: string | null;
}

export interface UpdateTenantSettingsInput {
  readonly tenantId: string;
  readonly name?: string;
  readonly defaultLanguage?: string;
  readonly defaultCurrency?: string;
  readonly timezone?: string;
  readonly profile?: UpdateTenantProfileInput;
}
