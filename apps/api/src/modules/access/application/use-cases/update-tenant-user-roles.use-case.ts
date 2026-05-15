import { Inject, Injectable } from "@nestjs/common";
import type { TenantUserEntity } from "../../domain/entities/tenant-user.entity";
import { ROLES_REPOSITORY, type RolesRepository } from "../../domain/ports/roles.repository.port";
import {
  TENANT_USERS_REPOSITORY,
  type TenantUsersRepository
} from "../../domain/ports/tenant-users.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";
import { AccessPolicyService } from "../services/access-policy.service";

interface UpdateTenantUserRolesUseCaseInput {
  readonly tenantId: string;
  readonly actorUserId: string;
  readonly membershipId: string;
  readonly roleIds: readonly string[];
}

@Injectable()
export class UpdateTenantUserRolesUseCase {
  constructor(
    @Inject(TENANT_USERS_REPOSITORY)
    private readonly tenantUsersRepository: TenantUsersRepository,
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: RolesRepository,
    private readonly accessPolicyService: AccessPolicyService,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: UpdateTenantUserRolesUseCaseInput): Promise<TenantUserEntity> => {
    const current = this.accessPolicyService.assertTenantUserExists(
      await this.tenantUsersRepository.findByMembershipId(input.tenantId, input.membershipId)
    );
    this.accessPolicyService.assertActorIsNotTargetMembership(input.actorUserId, current);
    const roleIds = await this.accessPolicyService.assertRoleIdsAreValid(
      this.rolesRepository,
      input.tenantId,
      input.roleIds
    );

    const tenantUser = await this.tenantUsersRepository.replaceRoles({
      tenantId: input.tenantId,
      membershipId: input.membershipId,
      roleIds
    });

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "membership.roles_updated",
      resourceType: "TenantMembership",
      resourceId: input.membershipId,
      metadata: {
        targetUserId: current.userId,
        targetEmail: current.email,
        before: current.roles.map((role) => role.key),
        after: tenantUser.roles.map((role) => role.key),
        roleIds
      }
    });

    return tenantUser;
  };
}

