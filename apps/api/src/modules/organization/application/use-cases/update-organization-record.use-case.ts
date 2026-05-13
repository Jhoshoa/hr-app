import { Inject, Injectable } from "@nestjs/common";
import type {
  OrganizationRecordEntity,
  UpdateOrganizationRecordInput
} from "../../domain/entities/organization-record.entity";
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository
} from "../../domain/ports/organization.repository.port";

@Injectable()
export class UpdateOrganizationRecordUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository
  ) {}

  execute = async (input: UpdateOrganizationRecordInput): Promise<OrganizationRecordEntity> =>
    this.organizationRepository.update(input);
}
