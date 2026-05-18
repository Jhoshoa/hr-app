import { Inject, Injectable } from "@nestjs/common";
import type { OrganizationUnitEntity } from "../../domain/entities/organization-unit.entity";
import {
  ORGANIZATION_UNITS_REPOSITORY,
  type OrganizationUnitsRepository
} from "../../domain/ports/organization-units.repository.port";
import { OrganizationUnitsPolicyService } from "../services/organization-units-policy.service";

@Injectable()
export class ArchiveOrganizationUnitUseCase {
  constructor(
    @Inject(ORGANIZATION_UNITS_REPOSITORY)
    private readonly organizationUnitsRepository: OrganizationUnitsRepository,
    private readonly policy: OrganizationUnitsPolicyService
  ) {}

  execute = async (tenantId: string, unitId: string): Promise<OrganizationUnitEntity> => {
    this.policy.assertUnitExists(await this.organizationUnitsRepository.findUnitById(tenantId, unitId));
    await this.policy.assertUnitCanBeArchived(this.organizationUnitsRepository, tenantId, unitId);

    return this.organizationUnitsRepository.setUnitStatus(tenantId, unitId, "ARCHIVED");
  };
}
