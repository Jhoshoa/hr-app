import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type {
  OrganizationUnitEntity,
  UpdateOrganizationUnitInput
} from "../../domain/entities/organization-unit.entity";
import {
  ORGANIZATION_UNITS_REPOSITORY,
  type OrganizationUnitsRepository
} from "../../domain/ports/organization-units.repository.port";
import { OrganizationUnitsPolicyService } from "../services/organization-units-policy.service";

@Injectable()
export class UpdateOrganizationUnitUseCase {
  constructor(
    @Inject(ORGANIZATION_UNITS_REPOSITORY)
    private readonly organizationUnitsRepository: OrganizationUnitsRepository,
    private readonly policy: OrganizationUnitsPolicyService
  ) {}

  execute = async (input: UpdateOrganizationUnitInput): Promise<OrganizationUnitEntity> => {
    const existing = this.policy.assertUnitExists(
      await this.organizationUnitsRepository.findUnitById(input.tenantId, input.unitId)
    );

    if (input.typeId !== undefined) {
      const type = this.policy.assertTypeExists(
        await this.organizationUnitsRepository.findTypeById(input.tenantId, input.typeId)
      );
      this.policy.assertTypeIsActive(type);
    }

    if (input.parentOrganizationUnitId !== undefined && input.parentOrganizationUnitId !== null) {
      const parent = this.policy.assertUnitExists(
        await this.organizationUnitsRepository.findUnitById(
          input.tenantId,
          input.parentOrganizationUnitId
        )
      );
      this.policy.assertUnitIsActive(parent);
      await this.policy.assertParentDoesNotCreateCycle(
        this.organizationUnitsRepository,
        input.tenantId,
        existing.id,
        input.parentOrganizationUnitId
      );
    }

    if (
      input.primaryLocationId &&
      !(await this.organizationUnitsRepository.activeLocationExists(
        input.tenantId,
        input.primaryLocationId
      ))
    ) {
      throw new BadRequestException("Primary location must be active and belong to the tenant.");
    }

    if (input.name !== undefined) {
      await this.policy.assertUnitNameAvailable(
        this.organizationUnitsRepository,
        input.tenantId,
        input.name,
        existing.id
      );
    }

    await this.policy.assertUnitKeyAvailable(
      this.organizationUnitsRepository,
      input.tenantId,
      input.key,
      existing.id
    );
    await this.policy.assertUnitCodeAvailable(
      this.organizationUnitsRepository,
      input.tenantId,
      input.code,
      existing.id
    );

    return this.organizationUnitsRepository.updateUnit(input);
  };
}
