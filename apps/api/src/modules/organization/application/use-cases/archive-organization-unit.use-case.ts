import { Inject, Injectable } from "@nestjs/common";
import type { OrganizationUnitEntity } from "../../domain/entities/organization-unit.entity";
import {
  ORGANIZATION_UNITS_REPOSITORY,
  type OrganizationUnitsRepository
} from "../../domain/ports/organization-units.repository.port";
import { OrganizationUnitsPolicyService } from "../services/organization-units-policy.service";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

@Injectable()
export class ArchiveOrganizationUnitUseCase {
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
    this.policy.assertUnitExists(await this.organizationUnitsRepository.findUnitById(tenantId, unitId));
    await this.policy.assertUnitCanBeArchived(this.organizationUnitsRepository, tenantId, unitId);

    const unit = await this.organizationUnitsRepository.setUnitStatus(tenantId, unitId, "ARCHIVED");

    await this.createAuditEventUseCase.execute({
      tenantId,
      actorUserId,
      action: "organization_unit.archived",
      resourceType: "organization_unit",
      resourceId: unit.id,
      metadata: { name: unit.name, key: unit.key, code: unit.code }
    });

    return unit;
  };
}
