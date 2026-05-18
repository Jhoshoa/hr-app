import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { TenantEntity, UpdateTenantSettingsInput } from "../../domain/entities/tenant.entity";
import { TENANTS_REPOSITORY, type TenantsRepository } from "../../domain/ports/tenants.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

export interface UpdateCurrentTenantCommand extends UpdateTenantSettingsInput {
  readonly actorUserId: string;
}

@Injectable()
export class UpdateCurrentTenantUseCase {
  constructor(
    @Inject(TENANTS_REPOSITORY) private readonly tenantsRepository: TenantsRepository,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: UpdateCurrentTenantCommand): Promise<TenantEntity> => {
    const tenant = await this.tenantsRepository.findById(input.tenantId);

    if (!tenant) {
      throw new NotFoundException("Tenant was not found.");
    }

    const { actorUserId, ...updateInput } = input;
    const updatedTenant = await this.tenantsRepository.updateSettings(updateInput);

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId,
      action: "tenant.settings.updated",
      resourceType: "tenant",
      resourceId: updatedTenant.id,
      metadata: {
        updatedFields: Object.keys(updateInput).filter((key) => key !== "tenantId")
      }
    });

    return updatedTenant;
  };
}
