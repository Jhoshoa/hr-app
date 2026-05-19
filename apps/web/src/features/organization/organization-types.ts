export type OrganizationRecordKind =
  | "department"
  | "location"
  | "jobTitle"
  | "employmentType"
  | "workMode"
  | "clientProject";

export interface OrganizationRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly status: "ACTIVE" | "INACTIVE" | "ARCHIVED" | string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly parentDepartmentId?: string | null;
  readonly country?: string | null;
  readonly city?: string | null;
  readonly timezone?: string | null;
  readonly level?: string | null;
  readonly category?: string | null;
  readonly type?: string | null;
  readonly code?: string | null;
}

export interface OrganizationRecordPayload {
  name?: string | null;
  parentDepartmentId?: string | null;
  country?: string | null;
  city?: string | null;
  timezone?: string | null;
  level?: string | null;
  category?: string | null;
  type?: string | null;
  code?: string | null;
}

export interface OrganizationFieldConfig {
  readonly key: keyof OrganizationRecordPayload;
  readonly label: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly control?: "text" | "country" | "timezone";
}

export interface OrganizationCatalogConfig {
  readonly kind: OrganizationRecordKind;
  readonly path: string;
  readonly label: string;
  readonly singularLabel: string;
  readonly description: string;
  readonly fields: readonly OrganizationFieldConfig[];
}
