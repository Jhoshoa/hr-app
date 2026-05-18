import { Inject, Injectable } from "@nestjs/common";
import type {
  CreateOrganizationUnitTypeInput,
  OrganizationUnitTypeEntity
} from "../../domain/entities/organization-unit-type.entity";
import {
  ORGANIZATION_UNITS_REPOSITORY,
  type OrganizationUnitsRepository
} from "../../domain/ports/organization-units.repository.port";
import { OrganizationUnitsPolicyService } from "../services/organization-units-policy.service";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

export interface CreateOrganizationUnitTypeCommand extends CreateOrganizationUnitTypeInput {
  readonly actorUserId: string;
}

@Injectable()
export class CreateOrganizationUnitTypeUseCase {
  constructor(
    @Inject(ORGANIZATION_UNITS_REPOSITORY)
    private readonly organizationUnitsRepository: OrganizationUnitsRepository,
    private readonly policy: OrganizationUnitsPolicyService,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (
    input: CreateOrganizationUnitTypeCommand
  ): Promise<OrganizationUnitTypeEntity> => {
    await this.policy.assertTypeKeyAvailable(
      this.organizationUnitsRepository,
      input.tenantId,
      input.key
    );
    await this.policy.assertTypeNameAvailable(
      this.organizationUnitsRepository,
      input.tenantId,
      input.name
    );

    const { actorUserId, ...createInput } = input;
    const type = await this.organizationUnitsRepository.createType({
      ...createInput,
      sortOrder: createInput.sortOrder ?? (await this.getNextSortOrder(input.tenantId))
    });

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId,
      action: "organization_unit_type.created",
      resourceType: "organization_unit_type",
      resourceId: type.id,
      metadata: { key: type.key, name: type.name }
    });

    return type;
  };

  private readonly getNextSortOrder = async (tenantId: string): Promise<number> => {
    const maxSortOrder = await this.organizationUnitsRepository.getMaxTypeSortOrder(tenantId);

    return maxSortOrder === null ? 0 : maxSortOrder + 1;
  };
}
