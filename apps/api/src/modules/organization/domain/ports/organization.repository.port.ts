import type {
  CreateOrganizationRecordInput,
  OrganizationRecordEntity,
  OrganizationRecordKind
} from "../entities/organization-record.entity";

export const ORGANIZATION_REPOSITORY = Symbol("ORGANIZATION_REPOSITORY");

export interface OrganizationRepository {
  create(input: CreateOrganizationRecordInput): Promise<OrganizationRecordEntity>;
  list(tenantId: string, kind: OrganizationRecordKind): Promise<OrganizationRecordEntity[]>;
}
