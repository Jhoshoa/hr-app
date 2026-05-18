import type {
  CreateOrganizationUnitInput,
  OrganizationUnitEntity,
  UpdateOrganizationUnitInput
} from "../entities/organization-unit.entity";
import type {
  CreateOrganizationUnitTypeInput,
  OrganizationUnitTypeEntity,
  UpdateOrganizationUnitTypeInput
} from "../entities/organization-unit-type.entity";

export const ORGANIZATION_UNITS_REPOSITORY = Symbol("ORGANIZATION_UNITS_REPOSITORY");

export interface OrganizationUnitsRepository {
  listTypes(tenantId: string): Promise<OrganizationUnitTypeEntity[]>;
  getMaxTypeSortOrder(tenantId: string): Promise<number | null>;
  findTypeById(tenantId: string, typeId: string): Promise<OrganizationUnitTypeEntity | null>;
  findTypeByKey(tenantId: string, key: string): Promise<OrganizationUnitTypeEntity | null>;
  findTypeByName(tenantId: string, name: string): Promise<OrganizationUnitTypeEntity | null>;
  createType(input: CreateOrganizationUnitTypeInput): Promise<OrganizationUnitTypeEntity>;
  updateType(input: UpdateOrganizationUnitTypeInput): Promise<OrganizationUnitTypeEntity>;
  reorderTypes(tenantId: string, typeIds: readonly string[]): Promise<OrganizationUnitTypeEntity[]>;
  setTypeStatus(
    tenantId: string,
    typeId: string,
    status: "ACTIVE" | "ARCHIVED"
  ): Promise<OrganizationUnitTypeEntity>;
  countActiveUnitsByType(tenantId: string, typeId: string): Promise<number>;

  listUnits(tenantId: string): Promise<OrganizationUnitEntity[]>;
  findUnitById(tenantId: string, unitId: string): Promise<OrganizationUnitEntity | null>;
  findUnitByName(tenantId: string, name: string): Promise<OrganizationUnitEntity | null>;
  findUnitByKey(tenantId: string, key: string): Promise<OrganizationUnitEntity | null>;
  findUnitByCode(tenantId: string, code: string): Promise<OrganizationUnitEntity | null>;
  createUnit(input: CreateOrganizationUnitInput): Promise<OrganizationUnitEntity>;
  updateUnit(input: UpdateOrganizationUnitInput): Promise<OrganizationUnitEntity>;
  setUnitStatus(
    tenantId: string,
    unitId: string,
    status: "ACTIVE" | "ARCHIVED"
  ): Promise<OrganizationUnitEntity>;
  countActiveChildren(tenantId: string, unitId: string): Promise<number>;
  countCurrentJobAssignments(tenantId: string, unitId: string): Promise<number>;
  findAncestorIds(tenantId: string, unitId: string): Promise<string[]>;
  activeLocationExists(tenantId: string, locationId: string): Promise<boolean>;
}
