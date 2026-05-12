import { Inject, Injectable } from "@nestjs/common";
import type {
  CreateOrganizationRecordInput,
  OrganizationRecordEntity
} from "../../domain/entities/organization-record.entity";
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository
} from "../../domain/ports/organization.repository.port";

@Injectable()
export class CreateOrganizationRecordUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository
  ) {}

  execute = async (input: CreateOrganizationRecordInput): Promise<OrganizationRecordEntity> =>
    this.organizationRepository.create(input);
}
