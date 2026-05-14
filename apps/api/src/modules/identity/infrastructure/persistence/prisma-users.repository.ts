import { Injectable } from "@nestjs/common";
import type { PlatformRoleKey, Prisma } from "@prisma/client";
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

    return this.toAuthenticatedUser(user);
  };

  findByEmail = async (email: string): Promise<AuthenticatedUser | null> => {
    const user = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(email) }
    });

    return user ? this.toAuthenticatedUser(user) : null;
  };

  linkExternalAuthUser = async (
    userId: string,
    externalUser: ExternalAuthUser
  ): Promise<AuthenticatedUser> => {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: this.normalizeEmail(externalUser.email),
        name: externalUser.name,
        status: "ACTIVE",
        externalAuthProvider: externalUser.provider,
        externalAuthUserId: externalUser.providerUserId
      }
    });

    return this.toAuthenticatedUser(user);
  };

  createFromExternalUser = async (externalUser: ExternalAuthUser): Promise<AuthenticatedUser> => {
    const user = await this.prisma.user.create({
      data: {
        email: this.normalizeEmail(externalUser.email),
        name: externalUser.name,
        status: "ACTIVE",
        externalAuthProvider: externalUser.provider,
        externalAuthUserId: externalUser.providerUserId
      }
    });

    return this.toAuthenticatedUser(user);
  };

  syncExternalUserProfile = async (
    userId: string,
    externalUser: ExternalAuthUser
  ): Promise<AuthenticatedUser> => {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: this.normalizeEmail(externalUser.email),
        name: externalUser.name,
        externalAuthProvider: externalUser.provider,
        externalAuthUserId: externalUser.providerUserId
      }
    });

    return this.toAuthenticatedUser(user);
  };

  findPlatformRolesByUserId = async (userId: string): Promise<PlatformRoleKey[]> => {
    const roles = await this.prisma.platformUserRole.findMany({
      where: { userId },
      orderBy: { roleKey: "asc" }
    });

    return roles.map((role) => role.roleKey);
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

  private toAuthenticatedUser = (user: {
    id: string;
    email: string;
    name: string | null;
    externalAuthProvider: string | null;
    externalAuthUserId: string | null;
  }): AuthenticatedUser => ({
    id: user.id,
    email: user.email,
    name: user.name ?? undefined,
    externalAuthProvider: user.externalAuthProvider ?? undefined,
    externalAuthUserId: user.externalAuthUserId ?? undefined
  });

  private normalizeEmail = (email: string): string => email.trim().toLowerCase();
}
