import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { TenantEntity } from "../../domain/entities/tenant.entity";
import { TENANTS_REPOSITORY, TenantsRepository } from "../../domain/ports/tenants.repository.port";

@Injectable()
export class GetCurrentTenantUseCase {
  constructor(@Inject(TENANTS_REPOSITORY) private readonly tenantsRepository: TenantsRepository) {}

  execute = async (tenantId: string): Promise<TenantEntity> => {
    const tenant = await this.tenantsRepository.findById(tenantId);

    if (!tenant) {
      throw new NotFoundException("Tenant was not found.");
    }

    return tenant;
  };
}
