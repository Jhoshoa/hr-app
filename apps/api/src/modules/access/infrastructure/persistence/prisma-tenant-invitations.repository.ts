import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../database/prisma/prisma.service";
import type {
  AcceptTenantInvitationInput,
  CreateTenantInvitationInput,
  ResendTenantInvitationInput,
  TenantInvitationEntity,
  TenantInvitationPreviewEntity
} from "../../domain/entities/tenant-invitation.entity";
import type { TenantInvitationsRepository } from "../../domain/ports/tenant-invitations.repository.port";

type InvitationWithRoles = Prisma.TenantInvitationGetPayload<{
  include: {
    roles: {
      include: {
        role: true;
      };
    };
  };
}>;

@Injectable()
export class PrismaTenantInvitationsRepository implements TenantInvitationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list = async (tenantId: string): Promise<TenantInvitationEntity[]> => {
    const invitations = await this.prisma.tenantInvitation.findMany({
      include: this.invitationInclude,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      where: { tenantId }
    });

    return invitations.map(this.toEntity);
  };

  findById = async (
    tenantId: string,
    invitationId: string
  ): Promise<TenantInvitationEntity | null> => {
    const invitation = await this.prisma.tenantInvitation.findFirst({
      include: this.invitationInclude,
      where: {
        id: invitationId,
        tenantId
      }
    });

    return invitation ? this.toEntity(invitation) : null;
  };

  findPendingByEmail = async (
    tenantId: string,
    email: string
  ): Promise<TenantInvitationEntity | null> => {
    const invitation = await this.prisma.tenantInvitation.findFirst({
      include: this.invitationInclude,
      where: {
        tenantId,
        email,
        status: "PENDING"
      }
    });

    return invitation ? this.toEntity(invitation) : null;
  };

  findByTokenHash = async (tokenHash: string): Promise<TenantInvitationEntity | null> => {
    const invitation = await this.prisma.tenantInvitation.findUnique({
      include: this.invitationInclude,
      where: { tokenHash }
    });

    return invitation ? this.toEntity(invitation) : null;
  };

  findPreviewByTokenHash = async (
    tokenHash: string
  ): Promise<TenantInvitationPreviewEntity | null> => {
    const invitation = await this.prisma.tenantInvitation.findUnique({
      select: {
        email: true,
        status: true,
        expiresAt: true,
        tenant: {
          select: {
            name: true
          }
        },
        roles: {
          orderBy: {
            role: {
              name: "asc"
            }
          },
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        }
      },
      where: { tokenHash }
    });

    if (!invitation) {
      return null;
    }

    return {
      tenantName: invitation.tenant.name,
      invitedEmail: invitation.email,
      status:
        invitation.status === "PENDING" && invitation.expiresAt.getTime() <= Date.now()
          ? "EXPIRED"
          : invitation.status,
      expiresAt: invitation.expiresAt,
      roles: invitation.roles.map((invitationRole) => ({
        name: invitationRole.role.name
      }))
    };
  };

  findMembershipStatusByEmail = async (
    tenantId: string,
    email: string
  ): Promise<"INVITED" | "ACTIVE" | "DISABLED" | null> => {
    const membership = await this.prisma.tenantMembership.findFirst({
      select: { status: true },
      where: {
        tenantId,
        user: { email }
      }
    });

    return membership?.status ?? null;
  };

  create = async (input: CreateTenantInvitationInput): Promise<TenantInvitationEntity> => {
    const primaryRoleId = input.roleIds[0];

    if (!primaryRoleId) {
      throw new ConflictException("Invitation must include at least one role.");
    }

    const invitation = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email: input.email },
        update: {},
        create: {
          email: input.email,
          status: "INVITED"
        }
      });
      const membership = await tx.tenantMembership.upsert({
        where: {
          tenantId_userId: {
            tenantId: input.tenantId,
            userId: user.id
          }
        },
        update: {
          roleId: primaryRoleId,
          status: "INVITED"
        },
        create: {
          tenantId: input.tenantId,
          userId: user.id,
          roleId: primaryRoleId,
          status: "INVITED"
        }
      });
      await tx.tenantMembershipRole.deleteMany({
        where: { membershipId: membership.id }
      });
      await tx.tenantMembershipRole.createMany({
        data: input.roleIds.map((roleId) => ({
          membershipId: membership.id,
          roleId
        })),
        skipDuplicates: true
      });

      return tx.tenantInvitation.create({
        data: {
          tenantId: input.tenantId,
          email: input.email,
          membershipId: membership.id,
          tokenHash: input.tokenHash,
          invitedByUserId: input.invitedByUserId,
          expiresAt: input.expiresAt,
          lastSentAt: new Date(),
          roles: {
            create: input.roleIds.map((roleId) => ({
              roleId
            }))
          }
        },
        include: this.invitationInclude
      });
    });

    return this.toEntity(invitation);
  };

  resend = async (input: ResendTenantInvitationInput): Promise<TenantInvitationEntity> => {
    const invitation = await this.prisma.tenantInvitation.update({
      data: {
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        status: "PENDING",
        resendCount: {
          increment: 1
        },
        lastSentAt: new Date()
      },
      include: this.invitationInclude,
      where: {
        id: input.invitationId,
        tenantId: input.tenantId
      }
    });

    return this.toEntity(invitation);
  };

  cancel = async (tenantId: string, invitationId: string): Promise<TenantInvitationEntity> => {
    const invitation = await this.prisma.tenantInvitation.update({
      data: {
        status: "CANCELLED",
        cancelledAt: new Date()
      },
      include: this.invitationInclude,
      where: {
        id: invitationId,
        tenantId
      }
    });

    return this.toEntity(invitation);
  };

  accept = async (input: AcceptTenantInvitationInput): Promise<TenantInvitationEntity> => {
    const invitation = await this.prisma.$transaction(async (tx) => {
      const current = await tx.tenantInvitation.findUnique({
        include: this.invitationInclude,
        where: { tokenHash: input.tokenHash }
      });

      if (!current?.membershipId) {
        throw new NotFoundException("Invitation was not found.");
      }

      await tx.tenantMembership.update({
        data: {
          status: "ACTIVE",
          joinedAt: new Date()
        },
        where: {
          id: current.membershipId
        }
      });

      return tx.tenantInvitation.update({
        data: {
          status: "ACCEPTED",
          acceptedByUserId: input.acceptedByUserId,
          acceptedAt: new Date()
        },
        include: this.invitationInclude,
        where: { id: current.id }
      });
    });

    return this.toEntity(invitation);
  };

  markExpired = async (tokenHash: string): Promise<TenantInvitationEntity> => {
    const invitation = await this.prisma.tenantInvitation.update({
      data: {
        status: "EXPIRED"
      },
      include: this.invitationInclude,
      where: { tokenHash }
    });

    return this.toEntity(invitation);
  };

  private readonly invitationInclude = {
    roles: {
      include: {
        role: true
      },
      orderBy: {
        role: {
          name: "asc"
        }
      }
    }
  } satisfies Prisma.TenantInvitationInclude;

  private readonly toEntity = (invitation: InvitationWithRoles): TenantInvitationEntity => ({
    id: invitation.id,
    tenantId: invitation.tenantId,
    email: invitation.email,
    membershipId: invitation.membershipId,
    status: invitation.status,
    invitedByUserId: invitation.invitedByUserId,
    acceptedByUserId: invitation.acceptedByUserId,
    expiresAt: invitation.expiresAt,
    resendCount: invitation.resendCount,
    lastSentAt: invitation.lastSentAt,
    acceptedAt: invitation.acceptedAt,
    cancelledAt: invitation.cancelledAt,
    createdAt: invitation.createdAt,
    updatedAt: invitation.updatedAt,
    roles: invitation.roles.map((invitationRole) => ({
      id: invitationRole.role.id,
      key: invitationRole.role.key,
      name: invitationRole.role.name,
      isSystemRole: invitationRole.role.isSystemRole,
      status: invitationRole.role.status
    }))
  });
}
