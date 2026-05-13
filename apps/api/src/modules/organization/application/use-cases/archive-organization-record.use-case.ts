import { Inject, Injectable } from "@nestjs/common";
import type {
  OrganizationRecordEntity,
  OrganizationRecordKind
} from "../../domain/entities/organization-record.entity";
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository
} from "../../domain/ports/organization.repository.port";

@Injectable()
export class ArchiveOrganizationRecordUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository
  ) {}

  execute = async (
    tenantId: string,
    kind: OrganizationRecordKind,
    id: string
  ): Promise<OrganizationRecordEntity> => this.organizationRepository.archive(tenantId, kind, id);
}
