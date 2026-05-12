export type OrganizationRecordKind =
  | "department"
  | "location"
  | "jobTitle"
  | "employmentType"
  | "workMode"
  | "clientProject";

export interface OrganizationRecordEntity {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly status: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly parentDepartmentId?: string | null;
  readonly country?: string | null;
  readonly city?: string | null;
  readonly timezone?: string | null;
  readonly level?: string | null;
  readonly category?: string | null;
  readonly type?: string | null;
  readonly code?: string | null;
}

export interface CreateOrganizationRecordInput {
  readonly tenantId: string;
  readonly kind: OrganizationRecordKind;
  readonly name: string;
  readonly parentDepartmentId?: string;
  readonly country?: string;
  readonly city?: string;
  readonly timezone?: string;
  readonly level?: string;
  readonly category?: string;
  readonly type?: string;
  readonly code?: string;
}
