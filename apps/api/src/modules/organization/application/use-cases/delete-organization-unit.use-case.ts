import { Inject, Injectable } from "@nestjs/common";
import type { OrganizationUnitEntity } from "../../domain/entities/organization-unit.entity";
import {
  ORGANIZATION_UNITS_REPOSITORY,
  type OrganizationUnitsRepository
} from "../../domain/ports/organization-units.repository.port";
import { OrganizationUnitsPolicyService } from "../services/organization-units-policy.service";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

@Injectable()
export class DeleteOrganizationUnitUseCase {
  constructor(
    @Inject(ORGANIZATION_UNITS_REPOSITORY)
    private readonly organizationUnitsRepository: OrganizationUnitsRepository,
    private readonly policy: OrganizationUnitsPolicyService,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (
    tenantId: string,
    unitId: string,
    actorUserId: string
  ): Promise<OrganizationUnitEntity> => {
    const unit = this.policy.assertUnitExists(
      await this.organizationUnitsRepository.findUnitById(tenantId, unitId)
    );
    this.policy.assertUnitIsArchived(unit);
    await this.policy.assertUnitCanBeDeleted(this.organizationUnitsRepository, tenantId, unitId);

    const deletedUnit = await this.organizationUnitsRepository.deleteUnit(tenantId, unitId);

    await this.createAuditEventUseCase.execute({
      tenantId,
      actorUserId,
      action: "organization_unit.deleted",
      resourceType: "organization_unit",
      resourceId: deletedUnit.id,
      metadata: {
        typeId: deletedUnit.typeId,
        parentOrganizationUnitId: deletedUnit.parentOrganizationUnitId,
        primaryLocationId: deletedUnit.primaryLocationId,
        key: deletedUnit.key,
        name: deletedUnit.name,
        code: deletedUnit.code
      }
    });

    return deletedUnit;
  };
}
