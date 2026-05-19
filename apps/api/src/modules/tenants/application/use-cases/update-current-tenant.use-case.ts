import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { TimezonePolicyService } from "../../../../common/timezones/timezone-policy.service";
import type {
  TenantEntity,
  UpdateTenantProfileInput,
  UpdateTenantSettingsInput
} from "../../domain/entities/tenant.entity";
import {
  normalizeTenantProfileCountry,
  normalizeTenantProfileOptionalText,
  normalizeTenantProfilePhone,
  normalizeTenantProfileWebsite
} from "../../domain/tenant-profile-normalization";
import { TENANTS_REPOSITORY, type TenantsRepository } from "../../domain/ports/tenants.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

export interface UpdateCurrentTenantCommand extends UpdateTenantSettingsInput {
  readonly actorUserId: string;
}

@Injectable()
export class UpdateCurrentTenantUseCase {
  constructor(
    @Inject(TENANTS_REPOSITORY) private readonly tenantsRepository: TenantsRepository,
    private readonly timezonePolicyService: TimezonePolicyService,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: UpdateCurrentTenantCommand): Promise<TenantEntity> => {
    const tenant = await this.tenantsRepository.findById(input.tenantId);

    if (!tenant) {
      throw new NotFoundException("Tenant was not found.");
    }

    const { actorUserId, ...updateInput } = input;
    const normalizedInput: UpdateTenantSettingsInput = {
      ...updateInput,
      ...(updateInput.timezone !== undefined
        ? { timezone: this.timezonePolicyService.assertSupported(updateInput.timezone) }
        : {}),
      ...(updateInput.profile !== undefined
        ? { profile: this.normalizeProfile(updateInput.profile) }
        : {})
    };
    const updatedTenant = await this.tenantsRepository.updateSettings(normalizedInput);

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId,
      action: "tenant.settings.updated",
      resourceType: "tenant",
      resourceId: updatedTenant.id,
      metadata: {
        updatedFields: this.getUpdatedFields(normalizedInput)
      }
    });

    return updatedTenant;
  };

  private normalizeProfile = (profile: UpdateTenantProfileInput): UpdateTenantProfileInput => {
    const country =
      profile.country !== undefined ? normalizeTenantProfileCountry(profile.country) : undefined;
    const phone =
      profile.phone !== undefined ? normalizeTenantProfilePhone(profile.phone, country) : undefined;

    const normalizedProfile: UpdateTenantProfileInput = {
      ...(profile.website !== undefined
        ? { website: normalizeTenantProfileWebsite(profile.website) }
        : {}),
      ...(profile.companySize !== undefined
        ? { companySize: normalizeTenantProfileOptionalText(profile.companySize) }
        : {}),
      ...(profile.country !== undefined ? { country } : {}),
      ...(profile.phone !== undefined ? { phone } : {})
    };

    if (profile.country !== undefined && profile.country && !country) {
      throw new BadRequestException("Company profile country must be a supported ISO country code.");
    }

    if (profile.phone !== undefined) {
      if (profile.phone && !phone) {
        throw new BadRequestException("Company profile phone must be a valid supported E.164 phone number.");
      }
    }

    return normalizedProfile;
  };

  private getUpdatedFields = (input: UpdateTenantSettingsInput): string[] => {
    const fields = Object.keys(input).filter((key) => key !== "tenantId" && key !== "profile");
    const profileFields = input.profile
      ? Object.keys(input.profile).map((key) => `profile.${key}`)
      : [];

    return [...fields, ...profileFields];
  };
}
