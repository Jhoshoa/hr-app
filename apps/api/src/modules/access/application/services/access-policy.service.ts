import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { RoleDetailEntity } from "../../domain/entities/role.entity";
import type { RolesRepository } from "../../domain/ports/roles.repository.port";

@Injectable()
export class AccessPolicyService {
  assertRoleExists = (role: RoleDetailEntity | null): RoleDetailEntity => {
    if (!role) {
      throw new NotFoundException("Role was not found.");
    }

    return role;
  };

  assertRoleIsEditable = (role: RoleDetailEntity): void => {
    if (role.key === "owner") {
      throw new ConflictException("Owner role cannot be modified.");
    }
  };

  assertRoleCanBeArchived = async (
    rolesRepository: RolesRepository,
    role: RoleDetailEntity
  ): Promise<void> => {
    this.assertRoleIsEditable(role);

    if (role.status === "ARCHIVED") {
      throw new ConflictException("Role is already archived.");
    }

    const activeAssignments = await rolesRepository.countActiveMembershipAssignments(
      role.tenantId ?? "",
      role.id
    );

    if (activeAssignments > 0) {
      throw new ConflictException("Role cannot be archived while assigned to active users.");
    }
  };

  assertTenantKeepsOwner = async (
    rolesRepository: RolesRepository,
    tenantId: string
  ): Promise<void> => {
    const activeOwners = await rolesRepository.countActiveOwnerMemberships(tenantId);

    if (activeOwners < 1) {
      throw new ConflictException("Tenant must keep at least one active owner.");
    }
  };
}

