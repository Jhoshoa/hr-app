import { Inject, Injectable } from "@nestjs/common";
import type { RoleDetailEntity } from "../../domain/entities/role.entity";
import { ROLES_REPOSITORY, type RolesRepository } from "../../domain/ports/roles.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";
import { AccessPolicyService } from "../services/access-policy.service";

interface ArchiveRoleUseCaseInput {
  readonly tenantId: string;
  readonly actorUserId: string;
  readonly roleId: string;
}

@Injectable()
export class ArchiveRoleUseCase {
  constructor(
    @Inject(ROLES_REPOSITORY) private readonly rolesRepository: RolesRepository,
    private readonly accessPolicyService: AccessPolicyService,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: ArchiveRoleUseCaseInput): Promise<RoleDetailEntity> => {
    const current = this.accessPolicyService.assertRoleExists(
      await this.rolesRepository.findById(input.tenantId, input.roleId)
    );

    await this.accessPolicyService.assertRoleCanBeArchived(this.rolesRepository, current);

    const role = await this.rolesRepository.setStatus(input.tenantId, input.roleId, "ARCHIVED");
    await this.accessPolicyService.assertTenantKeepsOwner(this.rolesRepository, input.tenantId);
    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "role.archived",
      resourceType: "Role",
      resourceId: role.id,
      metadata: {
        key: role.key,
        name: role.name
      }
    });

    return role;
  };
}

