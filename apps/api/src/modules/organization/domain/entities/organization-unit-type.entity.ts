export interface OrganizationUnitTypeEntity {
  readonly id: string;
  readonly tenantId: string;
  readonly key: string;
  readonly name: string;
  readonly sortOrder: number;
  readonly status: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateOrganizationUnitTypeInput {
  readonly tenantId: string;
  readonly key: string;
  readonly name: string;
  readonly sortOrder?: number;
}

export interface UpdateOrganizationUnitTypeInput {
  readonly tenantId: string;
  readonly typeId: string;
  readonly key?: string;
  readonly name?: string;
  readonly sortOrder?: number;
}
