import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../database/prisma/prisma.service";
import type {
  CreateRoleInput,
  RoleDetailEntity,
  RoleSummaryEntity,
  UpdateRoleInput
} from "../../domain/entities/role.entity";
import type { RolesRepository } from "../../domain/ports/roles.repository.port";

type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: {
    permissions: {
      include: {
        permission: true;
      };
    };
  };
}>;

type RoleWithCounts = Prisma.RoleGetPayload<{
  include: {
    _count: {
      select: {
        membershipAssignments: true;
        permissions: true;
      };
    };
  };
}>;

@Injectable()
export class PrismaRolesRepository implements RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  list = async (tenantId: string): Promise<RoleSummaryEntity[]> => {
    const roles = await this.prisma.role.findMany({
      include: {
        _count: {
          select: {
            membershipAssignments: true,
            permissions: true
          }
        }
      },
      orderBy: [{ status: "asc" }, { isSystemRole: "desc" }, { name: "asc" }],
      where: { tenantId }
    });

    return roles.map(this.toSummary);
  };

  findById = async (tenantId: string, roleId: string): Promise<RoleDetailEntity | null> => {
    const role = await this.prisma.role.findFirst({
      include: {
        permissions: {
          include: {
            permission: true
          },
          orderBy: {
            permission: {
              sortOrder: "asc"
            }
          }
        }
      },
      where: {
        id: roleId,
        tenantId
      }
    });

    return role ? this.toDetail(role) : null;
  };

  findByKey = async (tenantId: string, key: string): Promise<RoleDetailEntity | null> => {
    const role = await this.prisma.role.findUnique({
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      },
      where: {
        tenantId_key: {
          tenantId,
          key
        }
      }
    });

    return role ? this.toDetail(role) : null;
  };

  findActiveIdsByTenant = async (tenantId: string, roleIds: readonly string[]): Promise<string[]> => {
    if (roleIds.length === 0) {
      return [];
    }

    const roles = await this.prisma.role.findMany({
      select: { id: true },
      where: {
        id: {
          in: [...roleIds]
        },
        tenantId,
        status: "ACTIVE"
      }
    });

    return roles.map((role) => role.id);
  };

  create = async (input: CreateRoleInput): Promise<RoleDetailEntity> => {
    const role = await this.prisma.role.create({
      data: {
        tenantId: input.tenantId,
        key: input.key,
        name: input.name,
        description: input.description,
        isSystemRole: false,
        status: "ACTIVE",
        permissions: {
          create: input.permissionIds.map((permissionId) => ({
            permissionId
          }))
        }
      }
    });

    const created = await this.findById(input.tenantId, role.id);

    if (!created) {
      throw new Error("Created role could not be loaded.");
    }

    return created;
  };

  update = async (input: UpdateRoleInput): Promise<RoleDetailEntity> => {
    await this.prisma.role.update({
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {})
      },
      where: {
        id: input.roleId
      }
    });

    const updated = await this.findById(input.tenantId, input.roleId);

    if (!updated) {
      throw new Error("Updated role could not be loaded.");
    }

    return updated;
  };

  replacePermissions = async (
    tenantId: string,
    roleId: string,
    permissionIds: readonly string[]
  ): Promise<RoleDetailEntity> => {
    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId }
      });

      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId
          })),
          skipDuplicates: true
        });
      }
    });

    const updated = await this.findById(tenantId, roleId);

    if (!updated) {
      throw new Error("Updated role could not be loaded.");
    }

    return updated;
  };

  setStatus = async (
    tenantId: string,
    roleId: string,
    status: "ACTIVE" | "ARCHIVED"
  ): Promise<RoleDetailEntity> => {
    await this.prisma.role.update({
      data: { status },
      where: { id: roleId }
    });

    const updated = await this.findById(tenantId, roleId);

    if (!updated) {
      throw new Error("Updated role could not be loaded.");
    }

    return updated;
  };

  countActiveMembershipAssignments = async (
    tenantId: string,
    roleId: string
  ): Promise<number> =>
    this.prisma.tenantMembershipRole.count({
      where: {
        roleId,
        membership: {
          tenantId,
          status: "ACTIVE"
        }
      }
    });

  countActiveOwnerMemberships = async (tenantId: string): Promise<number> =>
    this.prisma.tenantMembershipRole.count({
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

  private toSummary = (role: RoleWithCounts): RoleSummaryEntity => ({
    id: role.id,
    tenantId: role.tenantId,
    key: role.key,
    name: role.name,
    description: role.description,
    isSystemRole: role.isSystemRole,
    status: role.status,
    memberCount: role._count.membershipAssignments,
    permissionCount: role._count.permissions,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt
  });

  private toDetail = (role: RoleWithPermissions): RoleDetailEntity => ({
    id: role.id,
    tenantId: role.tenantId,
    key: role.key,
    name: role.name,
    description: role.description,
    isSystemRole: role.isSystemRole,
    status: role.status,
    memberCount: 0,
    permissionCount: role.permissions.length,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    permissions: role.permissions.map((rolePermission) => rolePermission.permission)
  });
}
