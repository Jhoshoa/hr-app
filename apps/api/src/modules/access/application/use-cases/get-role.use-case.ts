import { Inject, Injectable } from "@nestjs/common";
import type { RoleDetailEntity } from "../../domain/entities/role.entity";
import { ROLES_REPOSITORY, type RolesRepository } from "../../domain/ports/roles.repository.port";
import { AccessPolicyService } from "../services/access-policy.service";

@Injectable()
export class GetRoleUseCase {
  constructor(
    @Inject(ROLES_REPOSITORY) private readonly rolesRepository: RolesRepository,
    private readonly accessPolicyService: AccessPolicyService
  ) {}

  execute = async (tenantId: string, roleId: string): Promise<RoleDetailEntity> => {
    const role = await this.rolesRepository.findById(tenantId, roleId);

    return this.accessPolicyService.assertRoleExists(role);
  };
}

