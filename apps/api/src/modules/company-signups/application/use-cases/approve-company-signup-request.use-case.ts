import { ConflictException, Injectable } from "@nestjs/common";
import { DEFAULT_TIME_ZONE, normalizeTimeZone } from "@hr-app/timezones";
import { Prisma } from "@prisma/client";
import type { CompanySignupRequest, Prisma as PrismaTypes } from "@prisma/client";
import { PrismaService } from "../../../../database/prisma/prisma.service";
import { EVENT_BUS, type EventBus } from "../../../../events/event-bus.port";
import { Inject } from "@nestjs/common";
import {
  normalizeTenantSlug,
  reservedTenantSlugs,
  tenantSlugPattern
} from "../../domain/company-signup-normalization";
import type { CompanySignupRequestEntity } from "../../domain/entities/company-signup-request.entity";

interface ApproveCompanySignupRequestInput {
  readonly signupRequestId: string;
  readonly reviewedByUserId: string;
  readonly finalTenantSlug?: string;
  readonly initialAdminRoleKey?: "owner";
}

type TransactionClient = PrismaTypes.TransactionClient;

@Injectable()
export class ApproveCompanySignupRequestUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus
  ) {}

  execute = async (
    input: ApproveCompanySignupRequestInput
  ): Promise<CompanySignupRequestEntity> => {
    try {
      const approvedRequest = await this.prisma.$transaction(async (tx) => {
        const request = await tx.companySignupRequest.findUnique({
          where: { id: input.signupRequestId }
        });

        if (!request || request.status !== "PENDING") {
          throw new ConflictException("Signup request has already been reviewed.");
        }

        const finalTenantSlug = normalizeTenantSlug(
          input.finalTenantSlug ?? request.desiredTenantSlug
        );
        this.ensureFinalTenantSlugIsValid(finalTenantSlug);

        const existingTenant = await tx.tenant.findUnique({
          where: { slug: finalTenantSlug }
        });

        if (existingTenant) {
          throw new ConflictException("Final tenant slug is already registered.");
        }

        const tenant = await tx.tenant.create({
          data: {
            name: request.companyName,
            slug: finalTenantSlug,
            defaultLanguage: request.preferredLanguage,
            timezone: normalizeTimeZone(request.timezone) ?? DEFAULT_TIME_ZONE
          }
        });

        const ownerRole = await this.createOwnerRoleWithPermissions(tx, tenant.id);
        const ownerUser = await tx.user.upsert({
          where: { email: request.adminEmail },
          update: {
            name: this.buildAdminName(request)
          },
          create: {
            email: request.adminEmail,
            name: this.buildAdminName(request),
            status: "INVITED"
          }
        });

        const membership = await tx.tenantMembership.upsert({
          where: {
            tenantId_userId: {
              tenantId: tenant.id,
              userId: ownerUser.id
            }
          },
          update: {
            roleId: ownerRole.id,
            status: "ACTIVE",
            joinedAt: new Date()
          },
          create: {
            tenantId: tenant.id,
            userId: ownerUser.id,
            roleId: ownerRole.id,
            status: "ACTIVE",
            joinedAt: new Date()
          }
        });
        await tx.tenantMembershipRole.upsert({
          where: {
            membershipId_roleId: {
              membershipId: membership.id,
              roleId: ownerRole.id
            }
          },
          update: {},
          create: {
            membershipId: membership.id,
            roleId: ownerRole.id
          }
        });

        const updateResult = await tx.companySignupRequest.updateMany({
          where: {
            id: request.id,
            status: "PENDING"
          },
          data: {
            status: "APPROVED",
            approvedTenantId: tenant.id,
            reviewedByUserId: input.reviewedByUserId,
            reviewedAt: new Date()
          }
        });

        if (updateResult.count !== 1) {
          throw new ConflictException("Signup request has already been reviewed.");
        }

        await tx.auditEvent.create({
          data: {
            tenantId: tenant.id,
            actorUserId: input.reviewedByUserId,
            action: "company_signup_request.approved",
            resourceType: "CompanySignupRequest",
            resourceId: request.id,
            metadata: {
              desiredTenantSlug: request.desiredTenantSlug,
              finalTenantSlug,
              adminEmail: request.adminEmail,
              approvedTenantId: tenant.id
            }
          }
        });

        const approved = await tx.companySignupRequest.findUniqueOrThrow({
          include: { approvedTenant: true },
          where: { id: request.id }
        });

        return this.toEntity(approved);
      });

      await this.eventBus.publishMany([
        {
          name: "CompanySignupRequestApproved",
          occurredAt: new Date(),
          payload: {
            companySignupRequestId: approvedRequest.id,
            approvedTenantId: approvedRequest.approvedTenantId ?? ""
          }
        },
        {
          name: "TenantOwnerGranted",
          occurredAt: new Date(),
          payload: {
            companySignupRequestId: approvedRequest.id,
            adminEmail: approvedRequest.adminEmail
          }
        }
      ]);

      return approvedRequest;
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException("Final tenant slug is already registered.");
      }

      throw error;
    }
  };

  private createOwnerRoleWithPermissions = async (
    tx: TransactionClient,
    tenantId: string
  ) => {
    const ownerRole = await tx.role.upsert({
      where: {
        tenantId_key: {
          tenantId,
          key: "owner"
        }
      },
      update: {},
      create: {
        tenantId,
        key: "owner",
        name: "Owner",
        description: "Full tenant access",
        isSystemRole: true
      }
    });
    const permissions = await tx.permission.findMany();

    if (permissions.length > 0) {
      await tx.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId: ownerRole.id,
          permissionId: permission.id
        })),
        skipDuplicates: true
      });
    }

    return ownerRole;
  };

  private ensureFinalTenantSlugIsValid = (slug: string): void => {
    if (!tenantSlugPattern.test(slug)) {
      throw new ConflictException("Final tenant slug has an invalid format.");
    }

    if (reservedTenantSlugs.has(slug)) {
      throw new ConflictException("Final tenant slug is reserved.");
    }
  };

  private buildAdminName = (request: CompanySignupRequest): string =>
    `${request.adminFirstName} ${request.adminLastName}`.trim();

  private isUniqueConstraintError = (error: unknown): boolean =>
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

  private toEntity = (
    request: CompanySignupRequest & {
      approvedTenant?: {
        id: string;
        name: string;
        slug: string;
        status: string;
      } | null;
    }
  ): CompanySignupRequestEntity => ({
    id: request.id,
    companyName: request.companyName,
    desiredTenantSlug: request.desiredTenantSlug,
    adminFirstName: request.adminFirstName,
    adminLastName: request.adminLastName,
    adminEmail: request.adminEmail,
    companyWebsite: request.companyWebsite,
    companySize: request.companySize,
    country: request.country,
    timezone: request.timezone,
    preferredLanguage: request.preferredLanguage,
    phone: request.phone,
    message: request.message,
    status: request.status,
    approvedTenantId: request.approvedTenantId,
    approvedTenant: request.approvedTenant
      ? {
          id: request.approvedTenant.id,
          name: request.approvedTenant.name,
          slug: request.approvedTenant.slug,
          status: request.approvedTenant.status
        }
      : null,
    reviewedByUserId: request.reviewedByUserId,
    reviewedAt: request.reviewedAt,
    rejectionReason: request.rejectionReason,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt
  });
}
