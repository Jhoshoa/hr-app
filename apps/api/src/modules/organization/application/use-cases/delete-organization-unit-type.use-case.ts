import { Inject, Injectable } from "@nestjs/common";
import type { OrganizationUnitTypeEntity } from "../../domain/entities/organization-unit-type.entity";
import {
  ORGANIZATION_UNITS_REPOSITORY,
  type OrganizationUnitsRepository
} from "../../domain/ports/organization-units.repository.port";
import { OrganizationUnitsPolicyService } from "../services/organization-units-policy.service";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

@Injectable()
export class DeleteOrganizationUnitTypeUseCase {
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
    const type = this.policy.assertTypeExists(
      await this.organizationUnitsRepository.findTypeById(tenantId, typeId)
    );
    this.policy.assertTypeIsArchived(type);
    await this.policy.assertTypeCanBeDeleted(this.organizationUnitsRepository, tenantId, typeId);

    const deletedType = await this.organizationUnitsRepository.deleteType(tenantId, typeId);

    await this.createAuditEventUseCase.execute({
      tenantId,
      actorUserId,
      action: "organization_unit_type.deleted",
      resourceType: "organization_unit_type",
      resourceId: deletedType.id,
      metadata: { key: deletedType.key, name: deletedType.name }
    });

    return deletedType;
  };
}
