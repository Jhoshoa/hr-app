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

@Injectable()
export class CreateOrganizationUnitTypeUseCase {
  constructor(
    @Inject(ORGANIZATION_UNITS_REPOSITORY)
    private readonly organizationUnitsRepository: OrganizationUnitsRepository,
    private readonly policy: OrganizationUnitsPolicyService
  ) {}

  execute = async (
    input: CreateOrganizationUnitTypeInput
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

    return this.organizationUnitsRepository.createType(input);
  };
}
