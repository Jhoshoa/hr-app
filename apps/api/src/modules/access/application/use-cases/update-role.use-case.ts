import { Inject, Injectable } from "@nestjs/common";
import type { RoleDetailEntity } from "../../domain/entities/role.entity";
import { ROLES_REPOSITORY, type RolesRepository } from "../../domain/ports/roles.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";
import { AccessPolicyService } from "../services/access-policy.service";

interface UpdateRoleUseCaseInput {
  readonly tenantId: string;
  readonly actorUserId: string;
  readonly roleId: string;
  readonly name?: string;
  readonly description?: string | null;
}

@Injectable()
export class UpdateRoleUseCase {
  constructor(
    @Inject(ROLES_REPOSITORY) private readonly rolesRepository: RolesRepository,
    private readonly accessPolicyService: AccessPolicyService,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: UpdateRoleUseCaseInput): Promise<RoleDetailEntity> => {
    const current = this.accessPolicyService.assertRoleExists(
      await this.rolesRepository.findById(input.tenantId, input.roleId)
    );
    this.accessPolicyService.assertRoleIsEditable(current);

    const role = await this.rolesRepository.update({
      tenantId: input.tenantId,
      roleId: input.roleId,
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {})
    });

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "role.updated",
      resourceType: "Role",
      resourceId: role.id,
      metadata: {
        before: {
          name: current.name,
          description: current.description
        },
        after: {
          name: role.name,
          description: role.description
        }
      }
    });

    return role;
  };
}

