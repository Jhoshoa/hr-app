import { Inject, Injectable } from "@nestjs/common";
import type { OrganizationUnitTypeEntity } from "../../domain/entities/organization-unit-type.entity";
import {
  ORGANIZATION_UNITS_REPOSITORY,
  type OrganizationUnitsRepository
} from "../../domain/ports/organization-units.repository.port";
import { OrganizationUnitsPolicyService } from "../services/organization-units-policy.service";

@Injectable()
export class ArchiveOrganizationUnitTypeUseCase {
  constructor(
    @Inject(ORGANIZATION_UNITS_REPOSITORY)
    private readonly organizationUnitsRepository: OrganizationUnitsRepository,
    private readonly policy: OrganizationUnitsPolicyService
  ) {}

  execute = async (tenantId: string, typeId: string): Promise<OrganizationUnitTypeEntity> => {
    this.policy.assertTypeExists(await this.organizationUnitsRepository.findTypeById(tenantId, typeId));
    await this.policy.assertTypeCanBeArchived(this.organizationUnitsRepository, tenantId, typeId);

    return this.organizationUnitsRepository.setTypeStatus(tenantId, typeId, "ARCHIVED");
  };
}
