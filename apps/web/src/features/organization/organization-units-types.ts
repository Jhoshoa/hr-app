export interface OrganizationUnitType {
  readonly id: string;
  readonly tenantId: string;
  readonly key: string;
  readonly name: string;
  readonly sortOrder: number;
  readonly status: "ACTIVE" | "ARCHIVED" | string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface OrganizationUnitTypePayload {
  readonly key?: string;
  readonly name?: string;
  readonly sortOrder?: number;
}

export interface OrganizationUnitSummary {
  readonly id: string;
  readonly key?: string | null;
  readonly name: string;
}

export interface OrganizationUnit {
  readonly id: string;
  readonly tenantId: string;
  readonly parentOrganizationUnitId?: string | null;
  readonly typeId: string;
  readonly primaryLocationId?: string | null;
  readonly key?: string | null;
  readonly name: string;
  readonly legalName?: string | null;
  readonly code?: string | null;
  readonly status: "ACTIVE" | "ARCHIVED" | string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly type?: {
    readonly id: string;
    readonly key: string;
    readonly name: string;
  };
  readonly parent?: OrganizationUnitSummary | null;
  readonly primaryLocation?: {
    readonly id: string;
    readonly name: string;
    readonly city?: string | null;
    readonly country: string;
  } | null;
}

export interface OrganizationUnitPayload {
  readonly typeId?: string;
  readonly parentOrganizationUnitId?: string | null;
  readonly primaryLocationId?: string | null;
  readonly key?: string | null;
  readonly name?: string;
  readonly legalName?: string | null;
  readonly code?: string | null;
}
