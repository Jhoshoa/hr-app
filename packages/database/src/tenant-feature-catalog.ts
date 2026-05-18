export const tenantFeatureCatalog = [
  "organization_units",
  "membership_access_scopes",
  "timesheets",
  "leave_requests",
  "documents",
  "performance_reviews",
  "compensation",
  "advanced_reports",
  "custom_fields",
  "client_projects"
] as const;

export type TenantFeatureKey = (typeof tenantFeatureCatalog)[number];
