import { Inject, Injectable } from "@nestjs/common";
import type { OrganizationUnitTypeEntity } from "../../domain/entities/organization-unit-type.entity";
import {
  ORGANIZATION_UNITS_REPOSITORY,
  type OrganizationUnitsRepository
} from "../../domain/ports/organization-units.repository.port";
import { OrganizationUnitsPolicyService } from "../services/organization-units-policy.service";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

@Injectable()
export class ArchiveOrganizationUnitTypeUseCase {
  constructor(
    @Inject(ORGANIZATION_UNITS_REPOSITORY)
    private readonly organizationUnitsRepository: OrganizationUnitsRepository,
    private readonly policy: OrganizationUnitsPolicyService,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (
    tenantId: string,
    typeId: string,
    actorUserId: string
  ): Promise<OrganizationUnitTypeEntity> => {
    this.policy.assertTypeExists(await this.organizationUnitsRepository.findTypeById(tenantId, typeId));
    await this.policy.assertTypeCanBeArchived(this.organizationUnitsRepository, tenantId, typeId);

    const type = await this.organizationUnitsRepository.setTypeStatus(tenantId, typeId, "ARCHIVED");

    await this.createAuditEventUseCase.execute({
      tenantId,
      actorUserId,
      action: "organization_unit_type.archived",
      resourceType: "organization_unit_type",
      resourceId: type.id,
      metadata: { key: type.key, name: type.name }
    });

    return type;
  };
}
