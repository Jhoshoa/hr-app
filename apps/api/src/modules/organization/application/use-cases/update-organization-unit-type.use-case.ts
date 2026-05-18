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

@Injectable()
export class UpdateOrganizationUnitTypeUseCase {
  constructor(
    @Inject(ORGANIZATION_UNITS_REPOSITORY)
    private readonly organizationUnitsRepository: OrganizationUnitsRepository,
    private readonly policy: OrganizationUnitsPolicyService
  ) {}

  execute = async (
    input: UpdateOrganizationUnitTypeInput
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

    return this.organizationUnitsRepository.updateType(input);
  };
}
