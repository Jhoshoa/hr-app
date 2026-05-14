import { Inject, Injectable } from "@nestjs/common";
import {
  normalizeCompanyWebsite,
  normalizeEmail,
  normalizeTenantSlug,
  reservedTenantSlugs,
  tenantSlugPattern
} from "../../domain/company-signup-normalization";
import type {
  AdminEmailAvailabilityResult,
  AvailabilityResult,
  CompanyWebsiteAvailabilityResult
} from "../../domain/entities/company-signup-request.entity";
import {
  COMPANY_SIGNUP_REQUESTS_REPOSITORY,
  type CompanySignupRequestsRepository
} from "../../domain/ports/company-signup-requests.repository.port";

@Injectable()
export class CheckCompanySignupAvailabilityUseCase {
  constructor(
    @Inject(COMPANY_SIGNUP_REQUESTS_REPOSITORY)
    private readonly companySignupRequestsRepository: CompanySignupRequestsRepository
  ) {}

  checkTenantSlug = async (value: string): Promise<AvailabilityResult> => {
    const slug = normalizeTenantSlug(value);

    if (!tenantSlugPattern.test(slug)) {
      return { value: slug, available: false, reason: "INVALID_FORMAT" };
    }

    if (reservedTenantSlugs.has(slug)) {
      return { value: slug, available: false, reason: "RESERVED" };
    }

    if (await this.companySignupRequestsRepository.tenantSlugExists(slug)) {
      return { value: slug, available: false, reason: "TENANT_EXISTS" };
    }

    if (await this.companySignupRequestsRepository.pendingRequestExistsForSlug(slug)) {
      return { value: slug, available: false, reason: "PENDING_REQUEST_EXISTS" };
    }

    return { value: slug, available: true };
  };

  checkAdminEmail = async (value: string): Promise<AdminEmailAvailabilityResult> => {
    const email = normalizeEmail(value);
    const pendingRequestExists =
      await this.companySignupRequestsRepository.pendingRequestExistsForAdminEmail(email);
    const existingUser = await this.companySignupRequestsRepository.userExistsByEmail(email);

    return {
      value: email,
      available: !pendingRequestExists,
      reason: pendingRequestExists ? "PENDING_REQUEST_EXISTS" : undefined,
      existingUser,
      canReuseExistingUser: existingUser
    };
  };

  checkCompanyWebsite = async (value: string): Promise<CompanyWebsiteAvailabilityResult> => {
    const website = normalizeCompanyWebsite(value) ?? "";
    const matchingPendingRequestCount = website
      ? await this.companySignupRequestsRepository.countPendingRequestsForCompanyWebsite(website)
      : 0;

    return {
      value: website,
      duplicateWarning: matchingPendingRequestCount > 0,
      matchingPendingRequestCount
    };
  };
}
