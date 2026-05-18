import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { OrganizationUnitEntity } from "../../domain/entities/organization-unit.entity";
import {
  ORGANIZATION_UNITS_REPOSITORY,
  type OrganizationUnitsRepository
} from "../../domain/ports/organization-units.repository.port";
import { OrganizationUnitsPolicyService } from "../services/organization-units-policy.service";

@Injectable()
export class ReactivateOrganizationUnitUseCase {
  constructor(
    @Inject(ORGANIZATION_UNITS_REPOSITORY)
    private readonly organizationUnitsRepository: OrganizationUnitsRepository,
    private readonly policy: OrganizationUnitsPolicyService
  ) {}

  execute = async (tenantId: string, unitId: string): Promise<OrganizationUnitEntity> => {
    const unit = this.policy.assertUnitExists(
      await this.organizationUnitsRepository.findUnitById(tenantId, unitId)
    );
    const type = this.policy.assertTypeExists(
      await this.organizationUnitsRepository.findTypeById(tenantId, unit.typeId)
    );
    this.policy.assertTypeIsActive(type);

    if (unit.parentOrganizationUnitId) {
      const parent = this.policy.assertUnitExists(
        await this.organizationUnitsRepository.findUnitById(tenantId, unit.parentOrganizationUnitId)
      );
      this.policy.assertUnitIsActive(parent);
    }

    if (
      unit.primaryLocationId &&
      !(await this.organizationUnitsRepository.activeLocationExists(tenantId, unit.primaryLocationId))
    ) {
      throw new BadRequestException("Primary location must be active and belong to the tenant.");
    }

    return this.organizationUnitsRepository.setUnitStatus(tenantId, unitId, "ACTIVE");
  };
}
