export interface TenantEntity {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly status: string;
  readonly defaultLanguage: string;
  readonly defaultCurrency: string;
  readonly timezone: string;
}
