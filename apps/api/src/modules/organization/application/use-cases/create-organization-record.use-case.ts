import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DEFAULT_COUNTRY_CODE, getCountryCodeForTimeZone, normalizeCountryCode } from "@hr-app/geo";
import { DEFAULT_TIME_ZONE, normalizeTimeZone } from "@hr-app/timezones";
import type {
  CreateOrganizationRecordInput,
  OrganizationRecordEntity
} from "../../domain/entities/organization-record.entity";
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository
} from "../../domain/ports/organization.repository.port";
import {
  TENANTS_REPOSITORY,
  type TenantsRepository
} from "../../../tenants/domain/ports/tenants.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

export interface CreateOrganizationRecordCommand extends CreateOrganizationRecordInput {
  readonly actorUserId: string;
}

@Injectable()
export class CreateOrganizationRecordUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
    @Inject(TENANTS_REPOSITORY)
    private readonly tenantsRepository: TenantsRepository,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: CreateOrganizationRecordCommand): Promise<OrganizationRecordEntity> => {
    if (input.parentDepartmentId) {
      await this.organizationRepository.findById(
        input.tenantId,
        "department",
        input.parentDepartmentId
      );
    }

    const { actorUserId, ...createInput } = input;
    const normalizedInput =
      createInput.kind === "location"
        ? await this.normalizeLocationInput(createInput)
        : createInput;
    const record = await this.organizationRepository.create(normalizedInput);

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId,
      action: `organization.${input.kind}.created`,
      resourceType: input.kind,
      resourceId: record.id,
      metadata: { name: record.name }
    });

    return record;
  };

  private normalizeLocationInput = async (
    input: CreateOrganizationRecordInput
  ): Promise<CreateOrganizationRecordInput> => {
    const tenant = await this.tenantsRepository.findById(input.tenantId);
    const timeZone =
      this.normalizeLocationTimeZone(input.timezone) ??
      normalizeTimeZone(tenant?.timezone) ??
      DEFAULT_TIME_ZONE;
    const country =
      this.normalizeCountry(input.country) ??
      getCountryCodeForTimeZone(timeZone) ??
      DEFAULT_COUNTRY_CODE;

    return {
      ...input,
      country,
      timezone: timeZone
    };
  };

  private normalizeCountry = (value: string | undefined): string | undefined => {
    if (!value) {
      return undefined;
    }

    const country = normalizeCountryCode(value);

    if (!country) {
      throw new BadRequestException("Country must be a supported ISO country code.");
    }

    return country;
  };

  private normalizeLocationTimeZone = (value: string | undefined): string | undefined => {
    if (!value) {
      return undefined;
    }

    const timeZone = normalizeTimeZone(value);

    if (!timeZone) {
      throw new BadRequestException("Timezone must be a supported IANA timezone.");
    }

    return timeZone;
  };
}
