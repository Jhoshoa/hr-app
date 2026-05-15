import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../database/prisma/prisma.service";
import type {
  ReplaceTenantUserRolesInput,
  SetTenantMembershipStatusInput,
  TenantUserEntity,
  TenantUserMembershipWithPermissions
} from "../../domain/entities/tenant-user.entity";
import type { TenantUsersRepository } from "../../domain/ports/tenant-users.repository.port";

type MembershipWithUserRolesPermissions = Prisma.TenantMembershipGetPayload<{
  include: {
    user: true;
    roles: {
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true;
              };
            };
          };
        };
      };
    };
  };
}>;

@Injectable()
export class PrismaTenantUsersRepository implements TenantUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  list = async (tenantId: string): Promise<TenantUserEntity[]> => {
    const memberships = await this.prisma.tenantMembership.findMany({
      include: this.membershipInclude,
      orderBy: [
        {
          user: {
            email: "asc"
          }
        }
      ],
      where: { tenantId }
    });

    return memberships.map(this.toTenantUser);
  };

  findByMembershipId = async (
    tenantId: string,
    membershipId: string
  ): Promise<TenantUserEntity | null> => {
    const membership = await this.prisma.tenantMembership.findFirst({
      include: this.membershipInclude,
      where: {
        id: membershipId,
        tenantId
      }
    });

    return membership ? this.toTenantUser(membership) : null;
  };

  findMembershipWithPermissions = async (
    tenantId: string,
    membershipId: string
  ): Promise<TenantUserMembershipWithPermissions | null> => {
    const membership = await this.prisma.tenantMembership.findFirst({
      include: this.membershipInclude,
      where: {
        id: membershipId,
        tenantId
      }
    });

    if (!membership) {
      return null;
    }

    return {
      membershipId: membership.id,
      userId: membership.userId,
      status: membership.status,
      roles: membership.roles.map((membershipRole) => ({
        id: membershipRole.role.id,
        key: membershipRole.role.key,
        permissions: membershipRole.role.permissions.map((rolePermission) => rolePermission.permission)
      }))
    };
  };

  replaceRoles = async (input: ReplaceTenantUserRolesInput): Promise<TenantUserEntity> => {
    const primaryRoleId = input.roleIds[0];

    if (!primaryRoleId) {
      throw new ConflictException("Tenant user must have at least one role.");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.tenantMembershipRole.deleteMany({
        where: {
          membershipId: input.membershipId
        }
      });
      await tx.tenantMembershipRole.createMany({
        data: input.roleIds.map((roleId) => ({
          membershipId: input.membershipId,
          roleId
        })),
        skipDuplicates: true
      });
      await tx.tenantMembership.update({
        data: {
          roleId: primaryRoleId
        },
        where: {
          id: input.membershipId
        }
      });
      await this.assertTenantKeepsOwner(tx, input.tenantId);
    });

    return this.findRequired(input.tenantId, input.membershipId);
  };

  setStatus = async (input: SetTenantMembershipStatusInput): Promise<TenantUserEntity> => {
    await this.prisma.$transaction(async (tx) => {
      await tx.tenantMembership.update({
        data: {
          status: input.status,
          ...(input.status === "ACTIVE" ? { joinedAt: new Date() } : {})
        },
        where: {
          id: input.membershipId
        }
      });
      await this.assertTenantKeepsOwner(tx, input.tenantId);
    });

    return this.findRequired(input.tenantId, input.membershipId);
  };

  private readonly membershipInclude = {
    user: true,
    roles: {
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      },
      orderBy: {
        role: {
          name: "asc"
        }
      }
    }
  } satisfies Prisma.TenantMembershipInclude;

  private readonly findRequired = async (
    tenantId: string,
    membershipId: string
  ): Promise<TenantUserEntity> => {
    const membership = await this.findByMembershipId(tenantId, membershipId);

    if (!membership) {
      throw new NotFoundException("Tenant user was not found.");
    }

    return membership;
  };

  private readonly assertTenantKeepsOwner = async (
    tx: Prisma.TransactionClient,
    tenantId: string
  ): Promise<void> => {
    const ownerCount = await tx.tenantMembershipRole.count({
      where: {
        membership: {
          tenantId,
          status: "ACTIVE"
        },
        role: {
          key: "owner",
          status: "ACTIVE"
        }
      }
    });

    if (ownerCount < 1) {
      throw new ConflictException("Tenant must keep at least one active owner.");
    }
  };

  private readonly toTenantUser = (
    membership: MembershipWithUserRolesPermissions
  ): TenantUserEntity => {
    const effectivePermissions = new Set<string>();

    for (const membershipRole of membership.roles) {
      for (const rolePermission of membershipRole.role.permissions) {
        effectivePermissions.add(rolePermission.permission.key);
      }
    }

    return {
      membershipId: membership.id,
      userId: membership.userId,
      email: membership.user.email,
      name: membership.user.name,
      userStatus: membership.user.status,
      membershipStatus: membership.status,
      roles: membership.roles.map((membershipRole) => ({
        id: membershipRole.role.id,
        key: membershipRole.role.key,
        name: membershipRole.role.name,
        isSystemRole: membershipRole.role.isSystemRole,
        status: membershipRole.role.status
      })),
      effectivePermissions: [...effectivePermissions].sort(),
      invitedAt: membership.invitedAt,
      joinedAt: membership.joinedAt,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt
    };
  };
}
