import { Inject, Injectable } from "@nestjs/common";
import type {
  OrganizationRecordEntity,
  OrganizationRecordKind
} from "../../domain/entities/organization-record.entity";
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository
} from "../../domain/ports/organization.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

@Injectable()
export class ArchiveOrganizationRecordUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (
    tenantId: string,
    kind: OrganizationRecordKind,
    id: string,
    actorUserId: string
  ): Promise<OrganizationRecordEntity> => {
    const record = await this.organizationRepository.archive(tenantId, kind, id);

    await this.createAuditEventUseCase.execute({
      tenantId,
      actorUserId,
      action: `organization.${kind}.archived`,
      resourceType: kind,
      resourceId: record.id,
      metadata: { name: record.name }
    });

    return record;
  };
}
