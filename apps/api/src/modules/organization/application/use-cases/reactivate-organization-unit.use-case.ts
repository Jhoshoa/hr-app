import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { OrganizationUnitEntity } from "../../domain/entities/organization-unit.entity";
import {
  ORGANIZATION_UNITS_REPOSITORY,
  type OrganizationUnitsRepository
} from "../../domain/ports/organization-units.repository.port";
import { OrganizationUnitsPolicyService } from "../services/organization-units-policy.service";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

@Injectable()
export class ReactivateOrganizationUnitUseCase {
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

    const reactivatedUnit = await this.organizationUnitsRepository.setUnitStatus(tenantId, unitId, "ACTIVE");

    await this.createAuditEventUseCase.execute({
      tenantId,
      actorUserId,
      action: "organization_unit.reactivated",
      resourceType: "organization_unit",
      resourceId: reactivatedUnit.id,
      metadata: {
        name: reactivatedUnit.name,
        key: reactivatedUnit.key,
        code: reactivatedUnit.code
      }
    });

    return reactivatedUnit;
  };
}
