import { Inject, Injectable } from "@nestjs/common";
import type { OrganizationUnitTypeEntity } from "../../domain/entities/organization-unit-type.entity";
import {
  ORGANIZATION_UNITS_REPOSITORY,
  type OrganizationUnitsRepository
} from "../../domain/ports/organization-units.repository.port";

@Injectable()
export class ListOrganizationUnitTypesUseCase {
  constructor(
    @Inject(ORGANIZATION_UNITS_REPOSITORY)
    private readonly organizationUnitsRepository: OrganizationUnitsRepository
  ) {}

  execute = async (tenantId: string): Promise<OrganizationUnitTypeEntity[]> =>
    this.organizationUnitsRepository.listTypes(tenantId);
}
