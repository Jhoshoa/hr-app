import { Inject, Injectable } from "@nestjs/common";
import type { RoleDetailEntity } from "../../domain/entities/role.entity";
import { ROLES_REPOSITORY, type RolesRepository } from "../../domain/ports/roles.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";
import { AccessPolicyService } from "../services/access-policy.service";
import { PermissionValidationService } from "../services/permission-validation.service";

interface UpdateRolePermissionsUseCaseInput {
  readonly tenantId: string;
  readonly actorUserId: string;
  readonly roleId: string;
  readonly permissionIds: readonly string[];
}

@Injectable()
export class UpdateRolePermissionsUseCase {
  constructor(
    @Inject(ROLES_REPOSITORY) private readonly rolesRepository: RolesRepository,
    private readonly accessPolicyService: AccessPolicyService,
    private readonly permissionValidationService: PermissionValidationService,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: UpdateRolePermissionsUseCaseInput): Promise<RoleDetailEntity> => {
    const current = this.accessPolicyService.assertRoleExists(
      await this.rolesRepository.findById(input.tenantId, input.roleId)
    );
    this.accessPolicyService.assertRoleIsEditable(current);

    const permissionIds = [...new Set(input.permissionIds)];
    await this.permissionValidationService.assertPermissionIdsExist(permissionIds);

    const role = await this.rolesRepository.replacePermissions(
      input.tenantId,
      input.roleId,
      permissionIds
    );

    await this.accessPolicyService.assertTenantKeepsOwner(this.rolesRepository, input.tenantId);
    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "role.permissions_updated",
      resourceType: "Role",
      resourceId: role.id,
      metadata: {
        before: current.permissions.map((permission) => permission.key),
        after: role.permissions.map((permission) => permission.key),
        permissionIds
      }
    });

    return role;
  };
}

