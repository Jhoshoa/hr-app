import { ConflictException, Injectable } from "@nestjs/common";
import type { CompanySignupRequest } from "@prisma/client";
import { PrismaService } from "../../../../database/prisma/prisma.service";
import { EVENT_BUS, type EventBus } from "../../../../events/event-bus.port";
import { Inject } from "@nestjs/common";
import type { CompanySignupRequestEntity } from "../../domain/entities/company-signup-request.entity";

interface RejectCompanySignupRequestInput {
  readonly signupRequestId: string;
  readonly reviewedByUserId: string;
  readonly rejectionReason: string;
}

@Injectable()
export class RejectCompanySignupRequestUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus
  ) {}

  execute = async (
    input: RejectCompanySignupRequestInput
  ): Promise<CompanySignupRequestEntity> => {
    const rejectedRequest = await this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.companySignupRequest.updateMany({
        where: {
          id: input.signupRequestId,
          status: "PENDING"
        },
        data: {
          status: "REJECTED",
          reviewedByUserId: input.reviewedByUserId,
          reviewedAt: new Date(),
          rejectionReason: input.rejectionReason.trim()
        }
      });

      if (updateResult.count !== 1) {
        throw new ConflictException("Signup request has already been reviewed.");
      }

      await tx.auditEvent.create({
        data: {
          actorUserId: input.reviewedByUserId,
          action: "company_signup_request.rejected",
          resourceType: "CompanySignupRequest",
          resourceId: input.signupRequestId,
          metadata: {
            rejectionReason: input.rejectionReason.trim()
          }
        }
      });

      const rejected = await tx.companySignupRequest.findUniqueOrThrow({
        where: { id: input.signupRequestId }
      });

      return this.toEntity(rejected);
    });

    await this.eventBus.publish({
      name: "CompanySignupRequestRejected",
      occurredAt: new Date(),
      payload: {
        companySignupRequestId: rejectedRequest.id
      }
    });

    return rejectedRequest;
  };

  private toEntity = (request: CompanySignupRequest): CompanySignupRequestEntity => ({
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
    approvedTenant: null,
    reviewedByUserId: request.reviewedByUserId,
    reviewedAt: request.reviewedAt,
    rejectionReason: request.rejectionReason,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt
  });
}
