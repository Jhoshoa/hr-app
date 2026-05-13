import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AuthenticatedUser } from "../../domain/entities/authenticated-user.entity";
import type { ExternalAuthUser } from "../../domain/entities/external-auth-user.entity";
import type { TenantMembershipContext } from "../../domain/entities/tenant-membership.entity";
import type { UsersRepository } from "../../domain/ports/users.repository.port";
import { PrismaService } from "../../../../database/prisma/prisma.service";

type MembershipWithTenantRolePermissions = Prisma.TenantMembershipGetPayload<{
  include: {
    tenant: true;
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
}>;

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByExternalAuthId = async (
    provider: string,
    providerUserId: string
  ): Promise<AuthenticatedUser | null> => {
    const user = await this.prisma.user.findUnique({
      where: { externalAuthUserId: providerUserId }
    });

    if (!user || user.externalAuthProvider !== provider) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      externalAuthProvider: user.externalAuthProvider,
      externalAuthUserId: user.externalAuthUserId
    };
  };

  createFromExternalUser = async (externalUser: ExternalAuthUser): Promise<AuthenticatedUser> => {
    const user = await this.prisma.user.create({
      data: {
        email: externalUser.email,
        name: externalUser.name,
        status: "ACTIVE",
        externalAuthProvider: externalUser.provider,
        externalAuthUserId: externalUser.providerUserId
      }
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      externalAuthProvider: user.externalAuthProvider,
      externalAuthUserId: user.externalAuthUserId
    };
  };

  syncExternalUserProfile = async (
    userId: string,
    externalUser: ExternalAuthUser
  ): Promise<AuthenticatedUser> => {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: externalUser.email,
        name: externalUser.name
      }
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      externalAuthProvider: user.externalAuthProvider,
      externalAuthUserId: user.externalAuthUserId
    };
  };

  ensureDevelopmentTenantMembership = async (
    userId: string,
    tenantSlug: string,
    roleKey: string
  ): Promise<void> => {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      throw new Error(`Development auto-join tenant was not found: ${tenantSlug}`);
    }

    const role = await this.prisma.role.findUnique({
      where: {
        tenantId_key: {
          key: roleKey,
          tenantId: tenant.id
        }
      }
    });

    if (!role) {
      throw new Error(`Development auto-join role was not found: ${roleKey}`);
    }

    await this.prisma.tenantMembership.upsert({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId
        }
      },
      update: {
        roleId: role.id,
        status: "ACTIVE",
        joinedAt: new Date()
      },
      create: {
        roleId: role.id,
        status: "ACTIVE",
        tenantId: tenant.id,
        userId,
        joinedAt: new Date()
      }
    });
  };

  findTenantMembershipsByUserId = async (userId: string): Promise<TenantMembershipContext[]> => {
    const memberships = await this.prisma.tenantMembership.findMany({
      where: {
        userId,
        status: "ACTIVE",
        tenant: { status: "ACTIVE" }
      },
      include: {
        tenant: true,
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
        tenant: {
          name: "asc"
        }
      }
    });

    return memberships.map(this.toMembershipContext);
  };

  findTenantMembershipContext = async (
    userId: string,
    tenantSlug: string
  ): Promise<TenantMembershipContext | null> => {
    const membership = await this.prisma.tenantMembership.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        tenant: {
          slug: tenantSlug,
          status: "ACTIVE"
        }
      },
      include: {
        tenant: true,
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!membership) {
      return null;
    }

    return this.toMembershipContext(membership);
  };

  private toMembershipContext = (
    membership: MembershipWithTenantRolePermissions
  ): TenantMembershipContext => ({
    tenantId: membership.tenantId,
    tenantSlug: membership.tenant.slug,
    tenantName: membership.tenant.name,
    roleKey: membership.role.key,
    permissions: membership.role.permissions.map((rolePermission) => rolePermission.permission.key)
  });
}
