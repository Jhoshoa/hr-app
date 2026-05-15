import { ConflictException, Inject, Injectable } from "@nestjs/common";
import type { RoleDetailEntity } from "../../domain/entities/role.entity";
import { ROLES_REPOSITORY, type RolesRepository } from "../../domain/ports/roles.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";
import { AccessPolicyService } from "../services/access-policy.service";

interface ReactivateRoleUseCaseInput {
  readonly tenantId: string;
  readonly actorUserId: string;
  readonly roleId: string;
}

@Injectable()
export class ReactivateRoleUseCase {
  constructor(
    @Inject(ROLES_REPOSITORY) private readonly rolesRepository: RolesRepository,
    private readonly accessPolicyService: AccessPolicyService,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: ReactivateRoleUseCaseInput): Promise<RoleDetailEntity> => {
    const current = this.accessPolicyService.assertRoleExists(
      await this.rolesRepository.findById(input.tenantId, input.roleId)
    );

    if (current.status === "ACTIVE") {
      throw new ConflictException("Role is already active.");
    }

    const role = await this.rolesRepository.setStatus(input.tenantId, input.roleId, "ACTIVE");
    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "role.reactivated",
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

