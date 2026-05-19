import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { normalizeCountryCode, normalizeSubdivisionCode } from "@hr-app/geo";
import { normalizeTimeZone } from "@hr-app/timezones";
import type {
  OrganizationRecordEntity,
  UpdateOrganizationRecordInput
} from "../../domain/entities/organization-record.entity";
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository
} from "../../domain/ports/organization.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

export interface UpdateOrganizationRecordCommand extends UpdateOrganizationRecordInput {
  readonly actorUserId: string;
}

@Injectable()
export class UpdateOrganizationRecordUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: UpdateOrganizationRecordCommand): Promise<OrganizationRecordEntity> => {
    if (input.parentDepartmentId) {
      if (input.parentDepartmentId === input.id) {
        throw new BadRequestException("Department cannot be its own parent.");
      }

      await this.organizationRepository.findById(
        input.tenantId,
        "department",
        input.parentDepartmentId
      );
    }

    const { actorUserId, ...updateInput } = input;
    const normalizedInput =
      updateInput.kind === "location"
        ? await this.normalizeLocationInput(updateInput)
        : updateInput;
    const record = await this.organizationRepository.update(normalizedInput);

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId,
      action: `organization.${input.kind}.updated`,
      resourceType: input.kind,
      resourceId: record.id,
      metadata: {
        updatedFields: Object.keys(updateInput).filter((key) => !["tenantId", "kind", "id"].includes(key))
      }
    });

    return record;
  };

  private normalizeLocationInput = async (
    input: Omit<UpdateOrganizationRecordCommand, "actorUserId">
  ): Promise<Omit<UpdateOrganizationRecordCommand, "actorUserId">> => {
    const currentRecord =
      input.subdivisionCode !== undefined || input.country !== undefined
        ? await this.organizationRepository.findById(input.tenantId, "location", input.id)
        : null;
    const country =
      input.country !== undefined ? this.normalizeCountry(input.country) : currentRecord?.country ?? undefined;
    const normalizedSubdivision =
      input.subdivisionCode !== undefined
        ? this.normalizeSubdivision(country, input.subdivisionCode)
        : input.country !== undefined
          ? null
          : undefined;

    return {
      ...input,
      ...(input.country !== undefined ? { country } : {}),
      ...(input.subdivisionCode !== undefined || input.country !== undefined
        ? { subdivisionCode: normalizedSubdivision }
        : {}),
      ...(input.timezone !== undefined ? { timezone: this.normalizeLocationTimeZone(input.timezone) } : {})
    };
  };

  private normalizeCountry = (value: string | undefined): string => {
    const country = normalizeCountryCode(value);

    if (!country) {
      throw new BadRequestException("Country must be a supported ISO country code.");
    }

    return country;
  };

  private normalizeSubdivision = (
    countryCode: string | null | undefined,
    value: string | null | undefined
  ): string | null => {
    if (!value) {
      return null;
    }

    const subdivisionCode = normalizeSubdivisionCode(countryCode, value);

    if (!subdivisionCode) {
      throw new BadRequestException("Subdivision must be supported for the selected country.");
    }

    return subdivisionCode;
  };

  private normalizeLocationTimeZone = (value: string | undefined): string => {
    const timeZone = normalizeTimeZone(value);

    if (!timeZone) {
      throw new BadRequestException("Timezone must be a supported IANA timezone.");
    }

    return timeZone;
  };
}
