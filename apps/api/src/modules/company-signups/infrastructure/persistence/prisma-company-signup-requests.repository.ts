import { Injectable } from "@nestjs/common";
import type { CompanySignupRequest } from "@prisma/client";
import { PrismaService } from "../../../../database/prisma/prisma.service";
import type {
  CompanySignupRequestEntity,
  CreateCompanySignupRequestInput
} from "../../domain/entities/company-signup-request.entity";
import type { CompanySignupRequestsRepository } from "../../domain/ports/company-signup-requests.repository.port";

@Injectable()
export class PrismaCompanySignupRequestsRepository implements CompanySignupRequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create = async (
    input: CreateCompanySignupRequestInput
  ): Promise<CompanySignupRequestEntity> => {
    const request = await this.prisma.companySignupRequest.create({
      data: {
        companyName: input.companyName,
        desiredTenantSlug: input.desiredTenantSlug,
        adminFirstName: input.adminFirstName,
        adminLastName: input.adminLastName,
        adminEmail: input.adminEmail,
        companyWebsite: input.companyWebsite,
        companySize: input.companySize,
        country: input.country,
        timezone: input.timezone,
        preferredLanguage: input.preferredLanguage,
        phone: input.phone,
        message: input.message
      }
    });

    return this.toEntity(request);
  };

  tenantSlugExists = async (slug: string): Promise<boolean> => {
    const count = await this.prisma.tenant.count({
      where: { slug }
    });

    return count > 0;
  };

  pendingRequestExistsForSlug = async (slug: string): Promise<boolean> => {
    const count = await this.prisma.companySignupRequest.count({
      where: {
        desiredTenantSlug: slug,
        status: "PENDING"
      }
    });

    return count > 0;
  };

  pendingRequestExistsForAdminEmail = async (email: string): Promise<boolean> => {
    const count = await this.prisma.companySignupRequest.count({
      where: {
        adminEmail: email,
        status: "PENDING"
      }
    });

    return count > 0;
  };

  userExistsByEmail = async (email: string): Promise<boolean> => {
    const count = await this.prisma.user.count({
      where: { email }
    });

    return count > 0;
  };

  countPendingRequestsForCompanyWebsite = async (website: string): Promise<number> =>
    this.prisma.companySignupRequest.count({
      where: {
        companyWebsite: website,
        status: "PENDING"
      }
    });

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
    reviewedByUserId: request.reviewedByUserId,
    reviewedAt: request.reviewedAt,
    rejectionReason: request.rejectionReason,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt
  });
}
