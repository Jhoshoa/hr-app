import { ConflictException, Inject, Injectable } from "@nestjs/common";
import type { RoleDetailEntity } from "../../domain/entities/role.entity";
import { ROLES_REPOSITORY, type RolesRepository } from "../../domain/ports/roles.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";
import { assertRoleKeyIsValid, normalizeRoleKey } from "../services/role-key.service";
import { PermissionValidationService } from "../services/permission-validation.service";

interface CreateRoleUseCaseInput {
  readonly tenantId: string;
  readonly actorUserId: string;
  readonly key?: string;
  readonly name: string;
  readonly description?: string | null;
  readonly permissionIds?: readonly string[];
}

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject(ROLES_REPOSITORY) private readonly rolesRepository: RolesRepository,
    private readonly permissionValidationService: PermissionValidationService,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: CreateRoleUseCaseInput): Promise<RoleDetailEntity> => {
    const key = normalizeRoleKey(input.key ?? input.name);
    assertRoleKeyIsValid(key);

    const existingRole = await this.rolesRepository.findByKey(input.tenantId, key);

    if (existingRole) {
      throw new ConflictException("Role key already exists.");
    }

    const permissionIds = [...new Set(input.permissionIds ?? [])];
    await this.permissionValidationService.assertPermissionIdsExist(permissionIds);

    const role = await this.rolesRepository.create({
      tenantId: input.tenantId,
      key,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      permissionIds
    });

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "role.created",
      resourceType: "Role",
      resourceId: role.id,
      metadata: {
        key: role.key,
        name: role.name,
        permissionIds
      }
    });

    return role;
  };
}

