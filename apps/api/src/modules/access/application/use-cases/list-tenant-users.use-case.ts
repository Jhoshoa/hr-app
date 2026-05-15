import { Inject, Injectable } from "@nestjs/common";
import type { TenantUserEntity } from "../../domain/entities/tenant-user.entity";
import {
  TENANT_USERS_REPOSITORY,
  type TenantUsersRepository
} from "../../domain/ports/tenant-users.repository.port";

@Injectable()
export class ListTenantUsersUseCase {
  constructor(
    @Inject(TENANT_USERS_REPOSITORY)
    private readonly tenantUsersRepository: TenantUsersRepository
  ) {}

  execute = async (tenantId: string): Promise<TenantUserEntity[]> =>
    this.tenantUsersRepository.list(tenantId);
}

