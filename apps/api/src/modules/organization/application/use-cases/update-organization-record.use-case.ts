import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type {
  OrganizationRecordEntity,
  UpdateOrganizationRecordInput
} from "../../domain/entities/organization-record.entity";
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository
} from "../../domain/ports/organization.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

export interface UpdateOrganizationRecordCommand extends UpdateOrganizationRecordInput {
  readonly actorUserId: string;
}

@Injectable()
export class UpdateOrganizationRecordUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: UpdateOrganizationRecordCommand): Promise<OrganizationRecordEntity> => {
    if (input.parentDepartmentId) {
      if (input.parentDepartmentId === input.id) {
        throw new BadRequestException("Department cannot be its own parent.");
      }

      await this.organizationRepository.findById(
        input.tenantId,
        "department",
        input.parentDepartmentId
      );
    }

    const { actorUserId, ...updateInput } = input;
    const record = await this.organizationRepository.update(updateInput);

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId,
      action: `organization.${input.kind}.updated`,
      resourceType: input.kind,
      resourceId: record.id,
      metadata: {
        updatedFields: Object.keys(updateInput).filter((key) => !["tenantId", "kind", "id"].includes(key))
      }
    });

    return record;
  };
}
