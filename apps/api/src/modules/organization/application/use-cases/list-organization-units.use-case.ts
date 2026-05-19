import { Inject, Injectable } from "@nestjs/common";
import type { OrganizationUnitEntity } from "../../domain/entities/organization-unit.entity";
import {
  ORGANIZATION_UNITS_REPOSITORY,
  type OrganizationUnitsRepository
} from "../../domain/ports/organization-units.repository.port";

@Injectable()
export class ListOrganizationUnitsUseCase {
  constructor(
    @Inject(ORGANIZATION_UNITS_REPOSITORY)
    private readonly organizationUnitsRepository: OrganizationUnitsRepository
  ) {}

  execute = async (tenantId: string): Promise<OrganizationUnitEntity[]> =>
    this.organizationUnitsRepository.listUnits(tenantId);
}
