import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { TenantEntity, UpdateTenantSettingsInput } from "../../domain/entities/tenant.entity";
import { TENANTS_REPOSITORY, type TenantsRepository } from "../../domain/ports/tenants.repository.port";

@Injectable()
export class UpdateCurrentTenantUseCase {
  constructor(@Inject(TENANTS_REPOSITORY) private readonly tenantsRepository: TenantsRepository) {}

  execute = async (input: UpdateTenantSettingsInput): Promise<TenantEntity> => {
    const tenant = await this.tenantsRepository.findById(input.tenantId);

    if (!tenant) {
      throw new NotFoundException("Tenant was not found.");
    }

    return this.tenantsRepository.updateSettings(input);
  };
}
