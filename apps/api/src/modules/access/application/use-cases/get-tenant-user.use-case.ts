import { Inject, Injectable } from "@nestjs/common";
import type { TenantUserEntity } from "../../domain/entities/tenant-user.entity";
import {
  TENANT_USERS_REPOSITORY,
  type TenantUsersRepository
} from "../../domain/ports/tenant-users.repository.port";
import { AccessPolicyService } from "../services/access-policy.service";

@Injectable()
export class GetTenantUserUseCase {
  constructor(
    @Inject(TENANT_USERS_REPOSITORY)
    private readonly tenantUsersRepository: TenantUsersRepository,
    private readonly accessPolicyService: AccessPolicyService
  ) {}

  execute = async (tenantId: string, membershipId: string): Promise<TenantUserEntity> => {
    const tenantUser = await this.tenantUsersRepository.findByMembershipId(tenantId, membershipId);

    return this.accessPolicyService.assertTenantUserExists(tenantUser);
  };
}

