import { Inject, Injectable } from "@nestjs/common";
import type { RoleSummaryEntity } from "../../domain/entities/role.entity";
import { ROLES_REPOSITORY, type RolesRepository } from "../../domain/ports/roles.repository.port";

@Injectable()
export class ListRolesUseCase {
  constructor(@Inject(ROLES_REPOSITORY) private readonly rolesRepository: RolesRepository) {}

  execute = async (tenantId: string): Promise<RoleSummaryEntity[]> =>
    this.rolesRepository.list(tenantId);
}

