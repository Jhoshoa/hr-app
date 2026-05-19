import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { RoleDetailEntity } from "../../domain/entities/role.entity";
import type { RolesRepository } from "../../domain/ports/roles.repository.port";
import type { TenantUserEntity } from "../../domain/entities/tenant-user.entity";

@Injectable()
export class AccessPolicyService {
  assertRoleExists = (role: RoleDetailEntity | null): RoleDetailEntity => {
    if (!role) {
      throw new NotFoundException("Role was not found.");
    }

    return role;
  };

  assertRoleIsEditable = (role: RoleDetailEntity): void => {
    if (role.isSystemRole) {
      throw new ConflictException("System roles cannot be modified.");
    }
  };

  assertTenantUserExists = (tenantUser: TenantUserEntity | null): TenantUserEntity => {
    if (!tenantUser) {
      throw new NotFoundException("Tenant user was not found.");
    }

    return tenantUser;
  };

  assertInvitationExists = <TInvitation>(invitation: TInvitation | null): TInvitation => {
    if (!invitation) {
      throw new NotFoundException("Invitation was not found.");
    }

    return invitation;
  };

  assertRoleIdsAreValid = async (
    rolesRepository: RolesRepository,
    tenantId: string,
    roleIds: readonly string[]
  ): Promise<string[]> => {
    const uniqueRoleIds = [...new Set(roleIds)];

    if (uniqueRoleIds.length === 0) {
      throw new BadRequestException("Tenant user must have at least one role.");
    }

    const activeRoleIds = await rolesRepository.findActiveIdsByTenant(tenantId, uniqueRoleIds);

    if (activeRoleIds.length !== uniqueRoleIds.length) {
      throw new BadRequestException("One or more roles are invalid.");
    }

    return uniqueRoleIds;
  };

  assertActorIsNotTargetMembership = (
    actorUserId: string,
    target: Pick<TenantUserEntity, "userId">
  ): void => {
    if (actorUserId === target.userId) {
      throw new ConflictException("Users cannot modify their own tenant access.");
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
