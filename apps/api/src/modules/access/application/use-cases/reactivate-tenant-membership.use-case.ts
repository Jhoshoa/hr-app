import { Inject, Injectable } from "@nestjs/common";
import type { TenantUserEntity } from "../../domain/entities/tenant-user.entity";
import {
  TENANT_USERS_REPOSITORY,
  type TenantUsersRepository
} from "../../domain/ports/tenant-users.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";
import { AccessPolicyService } from "../services/access-policy.service";

interface ReactivateTenantMembershipUseCaseInput {
  readonly tenantId: string;
  readonly actorUserId: string;
  readonly membershipId: string;
}

@Injectable()
export class ReactivateTenantMembershipUseCase {
  constructor(
    @Inject(TENANT_USERS_REPOSITORY)
    private readonly tenantUsersRepository: TenantUsersRepository,
    private readonly accessPolicyService: AccessPolicyService,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: ReactivateTenantMembershipUseCaseInput): Promise<TenantUserEntity> => {
    const current = this.accessPolicyService.assertTenantUserExists(
      await this.tenantUsersRepository.findByMembershipId(input.tenantId, input.membershipId)
    );

    const tenantUser = await this.tenantUsersRepository.setStatus({
      tenantId: input.tenantId,
      membershipId: input.membershipId,
      status: "ACTIVE"
    });

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "membership.reactivated",
      resourceType: "TenantMembership",
      resourceId: input.membershipId,
      metadata: {
        targetUserId: current.userId,
        targetEmail: current.email,
        roles: current.roles.map((role) => role.key)
      }
    });

    return tenantUser;
  };
}

