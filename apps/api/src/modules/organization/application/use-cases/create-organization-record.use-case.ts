import { Inject, Injectable } from "@nestjs/common";
import type {
  CreateOrganizationRecordInput,
  OrganizationRecordEntity
} from "../../domain/entities/organization-record.entity";
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository
} from "../../domain/ports/organization.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

export interface CreateOrganizationRecordCommand extends CreateOrganizationRecordInput {
  readonly actorUserId: string;
}

@Injectable()
export class CreateOrganizationRecordUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: CreateOrganizationRecordCommand): Promise<OrganizationRecordEntity> => {
    if (input.parentDepartmentId) {
      await this.organizationRepository.findById(
        input.tenantId,
        "department",
        input.parentDepartmentId
      );
    }

    const { actorUserId, ...createInput } = input;
    const record = await this.organizationRepository.create(createInput);

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId,
      action: `organization.${input.kind}.created`,
      resourceType: input.kind,
      resourceId: record.id,
      metadata: { name: record.name }
    });

    return record;
  };
}
