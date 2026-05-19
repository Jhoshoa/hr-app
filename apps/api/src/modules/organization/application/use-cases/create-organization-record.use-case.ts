import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DEFAULT_COUNTRY_CODE, normalizeCountryCode } from "@hr-app/geo";
import { DEFAULT_TIME_ZONE, normalizeTimeZone } from "@hr-app/timezones";
import type {
  CreateOrganizationRecordInput,
  OrganizationRecordEntity
} from "../../domain/entities/organization-record.entity";
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository
} from "../../domain/ports/organization.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

export interface CreateOrganizationRecordCommand extends CreateOrganizationRecordInput {
  readonly actorUserId: string;
}

@Injectable()
export class CreateOrganizationRecordUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
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
        ? {
            ...createInput,
            country: this.normalizeCountry(createInput.country) ?? DEFAULT_COUNTRY_CODE,
            timezone: this.normalizeLocationTimeZone(createInput.timezone) ?? DEFAULT_TIME_ZONE
          }
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
