import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type {
  CreateOrganizationUnitInput,
  OrganizationUnitEntity
} from "../../domain/entities/organization-unit.entity";
import {
  ORGANIZATION_UNITS_REPOSITORY,
  type OrganizationUnitsRepository
} from "../../domain/ports/organization-units.repository.port";
import { OrganizationUnitsPolicyService } from "../services/organization-units-policy.service";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

export interface CreateOrganizationUnitCommand extends CreateOrganizationUnitInput {
  readonly actorUserId: string;
}

@Injectable()
export class CreateOrganizationUnitUseCase {
  constructor(
    @Inject(ORGANIZATION_UNITS_REPOSITORY)
    private readonly organizationUnitsRepository: OrganizationUnitsRepository,
    private readonly policy: OrganizationUnitsPolicyService,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: CreateOrganizationUnitCommand): Promise<OrganizationUnitEntity> => {
    const type = this.policy.assertTypeExists(
      await this.organizationUnitsRepository.findTypeById(input.tenantId, input.typeId)
    );
    this.policy.assertTypeIsActive(type);

    if (input.parentOrganizationUnitId) {
      const parent = this.policy.assertUnitExists(
        await this.organizationUnitsRepository.findUnitById(
          input.tenantId,
          input.parentOrganizationUnitId
        )
      );
      this.policy.assertUnitIsActive(parent);
    }

    if (
      input.primaryLocationId &&
      !(await this.organizationUnitsRepository.activeLocationExists(
        input.tenantId,
        input.primaryLocationId
      ))
    ) {
      throw new BadRequestException("Primary location must be active and belong to the tenant.");
    }

    await this.policy.assertUnitNameAvailable(
      this.organizationUnitsRepository,
      input.tenantId,
      input.name
    );
    await this.policy.assertUnitKeyAvailable(
      this.organizationUnitsRepository,
      input.tenantId,
      input.key
    );
    await this.policy.assertUnitCodeAvailable(
      this.organizationUnitsRepository,
      input.tenantId,
      input.code
    );

    const { actorUserId, ...createInput } = input;
    const unit = await this.organizationUnitsRepository.createUnit(createInput);

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId,
      action: "organization_unit.created",
      resourceType: "organization_unit",
      resourceId: unit.id,
      metadata: {
        typeId: unit.typeId,
        parentOrganizationUnitId: unit.parentOrganizationUnitId,
        primaryLocationId: unit.primaryLocationId,
        key: unit.key,
        name: unit.name,
        code: unit.code
      }
    });

    return unit;
  };
}
