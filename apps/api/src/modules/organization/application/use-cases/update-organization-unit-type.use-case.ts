import { Inject, Injectable } from "@nestjs/common";
import type {
  OrganizationUnitTypeEntity,
  UpdateOrganizationUnitTypeInput
} from "../../domain/entities/organization-unit-type.entity";
import {
  ORGANIZATION_UNITS_REPOSITORY,
  type OrganizationUnitsRepository
} from "../../domain/ports/organization-units.repository.port";
import { OrganizationUnitsPolicyService } from "../services/organization-units-policy.service";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

export interface UpdateOrganizationUnitTypeCommand extends UpdateOrganizationUnitTypeInput {
  readonly actorUserId: string;
}

@Injectable()
export class UpdateOrganizationUnitTypeUseCase {
  constructor(
    @Inject(ORGANIZATION_UNITS_REPOSITORY)
    private readonly organizationUnitsRepository: OrganizationUnitsRepository,
    private readonly policy: OrganizationUnitsPolicyService,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (
    input: UpdateOrganizationUnitTypeCommand
  ): Promise<OrganizationUnitTypeEntity> => {
    const existing = this.policy.assertTypeExists(
      await this.organizationUnitsRepository.findTypeById(input.tenantId, input.typeId)
    );

    if (input.key !== undefined) {
      await this.policy.assertTypeKeyAvailable(
        this.organizationUnitsRepository,
        input.tenantId,
        input.key,
        existing.id
      );
    }

    if (input.name !== undefined) {
      await this.policy.assertTypeNameAvailable(
        this.organizationUnitsRepository,
        input.tenantId,
        input.name,
        existing.id
      );
    }

    const { actorUserId, ...updateInput } = input;
    const type = await this.organizationUnitsRepository.updateType(updateInput);

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId,
      action: "organization_unit_type.updated",
      resourceType: "organization_unit_type",
      resourceId: type.id,
      metadata: { key: type.key, name: type.name }
    });

    return type;
  };
}
