import { BadRequestException, ConflictException, Inject, Injectable } from "@nestjs/common";
import { EVENT_BUS, type EventBus } from "../../../../events/event-bus.port";
import {
  normalizeCompanyWebsite,
  normalizeEmail,
  normalizeOptionalText,
  normalizeSignupCountry,
  normalizeSignupTimeZone,
  normalizeTenantSlug,
  reservedTenantSlugs,
  tenantSlugPattern
} from "../../domain/company-signup-normalization";
import type {
  CompanySignupRequestEntity,
  CreateCompanySignupRequestInput
} from "../../domain/entities/company-signup-request.entity";
import {
  COMPANY_SIGNUP_REQUESTS_REPOSITORY,
  type CompanySignupRequestsRepository
} from "../../domain/ports/company-signup-requests.repository.port";

@Injectable()
export class CreateCompanySignupRequestUseCase {
  constructor(
    @Inject(COMPANY_SIGNUP_REQUESTS_REPOSITORY)
    private readonly companySignupRequestsRepository: CompanySignupRequestsRepository,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus
  ) {}

  execute = async (
    input: CreateCompanySignupRequestInput
  ): Promise<CompanySignupRequestEntity> => {
    const normalizedInput = this.normalizeInput(input);

    await this.ensureTenantSlugCanBeRequested(normalizedInput.desiredTenantSlug);
    await this.ensureAdminEmailHasNoPendingRequest(normalizedInput.adminEmail);

    const request = await this.companySignupRequestsRepository.create(normalizedInput);

    await this.eventBus.publish({
      name: "CompanySignupRequestSubmitted",
      occurredAt: new Date(),
      payload: {
        companySignupRequestId: request.id,
        desiredTenantSlug: request.desiredTenantSlug,
        adminEmail: request.adminEmail
      }
    });

    return request;
  };

  private normalizeInput = (
    input: CreateCompanySignupRequestInput
  ): CreateCompanySignupRequestInput => ({
    companyName: input.companyName.trim(),
    desiredTenantSlug: normalizeTenantSlug(input.desiredTenantSlug),
    adminFirstName: input.adminFirstName.trim(),
    adminLastName: input.adminLastName.trim(),
    adminEmail: normalizeEmail(input.adminEmail),
    companyWebsite: normalizeCompanyWebsite(input.companyWebsite),
    companySize: normalizeOptionalText(input.companySize),
    country: this.normalizeCountry(input.country),
    timezone: this.normalizeTimeZone(input.timezone),
    preferredLanguage: input.preferredLanguage,
    phone: normalizeOptionalText(input.phone),
    message: normalizeOptionalText(input.message)
  });

  private normalizeCountry = (value: string | undefined): string | undefined => {
    const normalized = normalizeOptionalText(value);

    if (!normalized) {
      return undefined;
    }

    const country = normalizeSignupCountry(normalized);

    if (!country) {
      throw new BadRequestException("Country must be a supported ISO country code.");
    }

    return country;
  };

  private normalizeTimeZone = (value: string | undefined): string | undefined => {
    const normalized = normalizeOptionalText(value);

    if (!normalized) {
      return undefined;
    }

    const timeZone = normalizeSignupTimeZone(normalized);

    if (!timeZone) {
      throw new BadRequestException("Timezone must be a supported IANA timezone.");
    }

    return timeZone;
  };

  private ensureTenantSlugCanBeRequested = async (slug: string): Promise<void> => {
    if (!tenantSlugPattern.test(slug)) {
      throw new BadRequestException("Desired tenant slug has an invalid format.");
    }

    if (reservedTenantSlugs.has(slug)) {
      throw new ConflictException("Desired tenant slug is reserved.");
    }

    if (await this.companySignupRequestsRepository.tenantSlugExists(slug)) {
      throw new ConflictException("Desired tenant slug is already registered.");
    }

    if (await this.companySignupRequestsRepository.pendingRequestExistsForSlug(slug)) {
      throw new ConflictException("A signup request is already pending for this tenant slug.");
    }
  };

  private ensureAdminEmailHasNoPendingRequest = async (email: string): Promise<void> => {
    if (await this.companySignupRequestsRepository.pendingRequestExistsForAdminEmail(email)) {
      throw new ConflictException("A signup request is already pending for this admin email.");
    }
  };
}
