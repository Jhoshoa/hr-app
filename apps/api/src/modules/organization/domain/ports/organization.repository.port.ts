import type {
  CreateOrganizationRecordInput,
  OrganizationRecordEntity,
  OrganizationRecordKind,
  UpdateOrganizationRecordInput
} from "../entities/organization-record.entity";

export const ORGANIZATION_REPOSITORY = Symbol("ORGANIZATION_REPOSITORY");

export interface OrganizationRepository {
  create(input: CreateOrganizationRecordInput): Promise<OrganizationRecordEntity>;
  findById(
    tenantId: string,
    kind: OrganizationRecordKind,
    id: string
  ): Promise<OrganizationRecordEntity>;
  list(tenantId: string, kind: OrganizationRecordKind): Promise<OrganizationRecordEntity[]>;
  update(input: UpdateOrganizationRecordInput): Promise<OrganizationRecordEntity>;
  archive(
    tenantId: string,
    kind: OrganizationRecordKind,
    id: string
  ): Promise<OrganizationRecordEntity>;
  reactivate(
    tenantId: string,
    kind: OrganizationRecordKind,
    id: string
  ): Promise<OrganizationRecordEntity>;
}
