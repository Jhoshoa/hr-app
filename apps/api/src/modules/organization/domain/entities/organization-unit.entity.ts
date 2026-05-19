export interface OrganizationUnitSummary {
  readonly id: string;
  readonly key?: string | null;
  readonly name: string;
}

export interface OrganizationUnitTypeSummary {
  readonly id: string;
  readonly key: string;
  readonly name: string;
}

export interface OrganizationUnitLocationSummary {
  readonly id: string;
  readonly name: string;
  readonly city?: string | null;
  readonly country: string;
}

export interface OrganizationUnitEntity {
  readonly id: string;
  readonly tenantId: string;
  readonly parentOrganizationUnitId?: string | null;
  readonly typeId: string;
  readonly primaryLocationId?: string | null;
  readonly key?: string | null;
  readonly name: string;
  readonly legalName?: string | null;
  readonly code?: string | null;
  readonly status: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly type?: OrganizationUnitTypeSummary;
  readonly parent?: OrganizationUnitSummary | null;
  readonly primaryLocation?: OrganizationUnitLocationSummary | null;
}

export interface CreateOrganizationUnitInput {
  readonly tenantId: string;
  readonly typeId: string;
  readonly parentOrganizationUnitId?: string;
  readonly primaryLocationId?: string;
  readonly key?: string;
  readonly name: string;
  readonly legalName?: string;
  readonly code?: string;
}

export interface UpdateOrganizationUnitInput {
  readonly tenantId: string;
  readonly unitId: string;
  readonly typeId?: string;
  readonly parentOrganizationUnitId?: string | null;
  readonly primaryLocationId?: string | null;
  readonly key?: string | null;
  readonly name?: string;
  readonly legalName?: string | null;
  readonly code?: string | null;
}
