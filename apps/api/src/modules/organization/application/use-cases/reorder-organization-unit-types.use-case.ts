import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";
import type { OrganizationUnitTypeEntity } from "../../domain/entities/organization-unit-type.entity";
import {
  ORGANIZATION_UNITS_REPOSITORY,
  type OrganizationUnitsRepository
} from "../../domain/ports/organization-units.repository.port";

interface ReorderOrganizationUnitTypesUseCaseInput {
  readonly tenantId: string;
  readonly actorUserId: string;
  readonly typeIds: readonly string[];
}

@Injectable()
export class ReorderOrganizationUnitTypesUseCase {
  constructor(
    @Inject(ORGANIZATION_UNITS_REPOSITORY)
    private readonly organizationUnitsRepository: OrganizationUnitsRepository,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (
    input: ReorderOrganizationUnitTypesUseCaseInput
  ): Promise<OrganizationUnitTypeEntity[]> => {
    const uniqueTypeIds = new Set(input.typeIds);

    if (uniqueTypeIds.size !== input.typeIds.length) {
      throw new BadRequestException("Organization unit type order cannot contain duplicate ids.");
    }

    const currentTypes = await this.organizationUnitsRepository.listTypes(input.tenantId);
    const currentTypeIds = new Set(currentTypes.map((type) => type.id));

    if (input.typeIds.length !== currentTypes.length) {
      throw new BadRequestException("Organization unit type order must include every type in the tenant.");
    }

    const hasOnlyTenantTypes = input.typeIds.every((typeId) => currentTypeIds.has(typeId));

    if (!hasOnlyTenantTypes) {
      throw new BadRequestException("Organization unit type order contains ids outside the tenant.");
    }

    const reorderedTypes = await this.organizationUnitsRepository.reorderTypes(
      input.tenantId,
      input.typeIds
    );

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "organization_unit_type.reordered",
      resourceType: "organization_unit_type",
      metadata: {
        previousTypeIds: currentTypes.map((type) => type.id),
        typeIds: input.typeIds
      }
    });

    return reorderedTypes;
  };
}
