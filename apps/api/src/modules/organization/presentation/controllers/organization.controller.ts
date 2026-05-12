import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentTenant } from "../../../../common/decorators/current-tenant.decorator";
import { Permissions } from "../../../../common/decorators/permissions.decorator";
import type { TenantContext } from "../../../../common/types/request-context";
import { CreateOrganizationRecordUseCase } from "../../application/use-cases/create-organization-record.use-case";
import { ListOrganizationRecordsUseCase } from "../../application/use-cases/list-organization-records.use-case";
import {
  CreateClientProjectDto,
  CreateDepartmentDto,
  CreateEmploymentTypeDto,
  CreateJobTitleDto,
  CreateLocationDto,
  CreateWorkModeDto
} from "../dto/create-organization-record.dto";

@ApiBearerAuth()
@ApiTags("organization")
@Controller()
export class OrganizationController {
  constructor(
    private readonly createOrganizationRecordUseCase: CreateOrganizationRecordUseCase,
    private readonly listOrganizationRecordsUseCase: ListOrganizationRecordsUseCase
  ) {}

  @Get("departments")
  @Permissions("organization.read")
  async listDepartments(@CurrentTenant() tenant: TenantContext) {
    return this.listOrganizationRecordsUseCase.execute(tenant.id, "department");
  }

  @Post("departments")
  @Permissions("organization.manage")
  async createDepartment(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: CreateDepartmentDto
  ) {
    return this.createOrganizationRecordUseCase.execute({
      tenantId: tenant.id,
      kind: "department",
      ...body
    });
  }

  @Get("locations")
  @Permissions("organization.read")
  async listLocations(@CurrentTenant() tenant: TenantContext) {
    return this.listOrganizationRecordsUseCase.execute(tenant.id, "location");
  }

  @Post("locations")
  @Permissions("organization.manage")
  async createLocation(@CurrentTenant() tenant: TenantContext, @Body() body: CreateLocationDto) {
    return this.createOrganizationRecordUseCase.execute({ tenantId: tenant.id, kind: "location", ...body });
  }

  @Get("job-titles")
  @Permissions("organization.read")
  async listJobTitles(@CurrentTenant() tenant: TenantContext) {
    return this.listOrganizationRecordsUseCase.execute(tenant.id, "jobTitle");
  }

  @Post("job-titles")
  @Permissions("organization.manage")
  async createJobTitle(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: CreateJobTitleDto
  ) {
    return this.createOrganizationRecordUseCase.execute({ tenantId: tenant.id, kind: "jobTitle", ...body });
  }

  @Get("employment-types")
  @Permissions("organization.read")
  async listEmploymentTypes(@CurrentTenant() tenant: TenantContext) {
    return this.listOrganizationRecordsUseCase.execute(tenant.id, "employmentType");
  }

  @Post("employment-types")
  @Permissions("organization.manage")
  async createEmploymentType(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: CreateEmploymentTypeDto
  ) {
    return this.createOrganizationRecordUseCase.execute({
      tenantId: tenant.id,
      kind: "employmentType",
      ...body
    });
  }

  @Get("work-modes")
  @Permissions("organization.read")
  async listWorkModes(@CurrentTenant() tenant: TenantContext) {
    return this.listOrganizationRecordsUseCase.execute(tenant.id, "workMode");
  }

  @Post("work-modes")
  @Permissions("organization.manage")
  async createWorkMode(@CurrentTenant() tenant: TenantContext, @Body() body: CreateWorkModeDto) {
    return this.createOrganizationRecordUseCase.execute({ tenantId: tenant.id, kind: "workMode", ...body });
  }

  @Get("client-projects")
  @Permissions("organization.read")
  async listClientProjects(@CurrentTenant() tenant: TenantContext) {
    return this.listOrganizationRecordsUseCase.execute(tenant.id, "clientProject");
  }

  @Post("client-projects")
  @Permissions("organization.manage")
  async createClientProject(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: CreateClientProjectDto
  ) {
    return this.createOrganizationRecordUseCase.execute({
      tenantId: tenant.id,
      kind: "clientProject",
      ...body
    });
  }
}
