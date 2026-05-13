import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentTenant } from "../../../../common/decorators/current-tenant.decorator";
import { Permissions } from "../../../../common/decorators/permissions.decorator";
import type { TenantContext } from "../../../../common/types/request-context";
import { ArchiveOrganizationRecordUseCase } from "../../application/use-cases/archive-organization-record.use-case";
import { CreateOrganizationRecordUseCase } from "../../application/use-cases/create-organization-record.use-case";
import { GetOrganizationRecordUseCase } from "../../application/use-cases/get-organization-record.use-case";
import { ListOrganizationRecordsUseCase } from "../../application/use-cases/list-organization-records.use-case";
import { ReactivateOrganizationRecordUseCase } from "../../application/use-cases/reactivate-organization-record.use-case";
import { UpdateOrganizationRecordUseCase } from "../../application/use-cases/update-organization-record.use-case";
import {
  CreateClientProjectDto,
  CreateDepartmentDto,
  CreateEmploymentTypeDto,
  CreateJobTitleDto,
  CreateLocationDto,
  CreateWorkModeDto,
  UpdateClientProjectDto,
  UpdateDepartmentDto,
  UpdateEmploymentTypeDto,
  UpdateJobTitleDto,
  UpdateLocationDto,
  UpdateWorkModeDto
} from "../dto/create-organization-record.dto";

@ApiBearerAuth()
@ApiTags("organization")
@Controller()
export class OrganizationController {
  constructor(
    private readonly createOrganizationRecordUseCase: CreateOrganizationRecordUseCase,
    private readonly listOrganizationRecordsUseCase: ListOrganizationRecordsUseCase,
    private readonly getOrganizationRecordUseCase: GetOrganizationRecordUseCase,
    private readonly updateOrganizationRecordUseCase: UpdateOrganizationRecordUseCase,
    private readonly archiveOrganizationRecordUseCase: ArchiveOrganizationRecordUseCase,
    private readonly reactivateOrganizationRecordUseCase: ReactivateOrganizationRecordUseCase
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

  @Get("departments/:departmentId")
  @Permissions("organization.read")
  async getDepartment(
    @CurrentTenant() tenant: TenantContext,
    @Param("departmentId") departmentId: string
  ) {
    return this.getOrganizationRecordUseCase.execute(tenant.id, "department", departmentId);
  }

  @Patch("departments/:departmentId")
  @Permissions("organization.manage")
  async updateDepartment(
    @CurrentTenant() tenant: TenantContext,
    @Param("departmentId") departmentId: string,
    @Body() body: UpdateDepartmentDto
  ) {
    return this.updateOrganizationRecordUseCase.execute({
      tenantId: tenant.id,
      kind: "department",
      id: departmentId,
      ...body
    });
  }

  @Post("departments/:departmentId/archive")
  @Permissions("organization.manage")
  async archiveDepartment(
    @CurrentTenant() tenant: TenantContext,
    @Param("departmentId") departmentId: string
  ) {
    return this.archiveOrganizationRecordUseCase.execute(tenant.id, "department", departmentId);
  }

  @Post("departments/:departmentId/reactivate")
  @Permissions("organization.manage")
  async reactivateDepartment(
    @CurrentTenant() tenant: TenantContext,
    @Param("departmentId") departmentId: string
  ) {
    return this.reactivateOrganizationRecordUseCase.execute(tenant.id, "department", departmentId);
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

  @Get("locations/:locationId")
  @Permissions("organization.read")
  async getLocation(@CurrentTenant() tenant: TenantContext, @Param("locationId") locationId: string) {
    return this.getOrganizationRecordUseCase.execute(tenant.id, "location", locationId);
  }

  @Patch("locations/:locationId")
  @Permissions("organization.manage")
  async updateLocation(
    @CurrentTenant() tenant: TenantContext,
    @Param("locationId") locationId: string,
    @Body() body: UpdateLocationDto
  ) {
    return this.updateOrganizationRecordUseCase.execute({
      tenantId: tenant.id,
      kind: "location",
      id: locationId,
      ...body
    });
  }

  @Post("locations/:locationId/archive")
  @Permissions("organization.manage")
  async archiveLocation(
    @CurrentTenant() tenant: TenantContext,
    @Param("locationId") locationId: string
  ) {
    return this.archiveOrganizationRecordUseCase.execute(tenant.id, "location", locationId);
  }

  @Post("locations/:locationId/reactivate")
  @Permissions("organization.manage")
  async reactivateLocation(
    @CurrentTenant() tenant: TenantContext,
    @Param("locationId") locationId: string
  ) {
    return this.reactivateOrganizationRecordUseCase.execute(tenant.id, "location", locationId);
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

  @Get("job-titles/:jobTitleId")
  @Permissions("organization.read")
  async getJobTitle(
    @CurrentTenant() tenant: TenantContext,
    @Param("jobTitleId") jobTitleId: string
  ) {
    return this.getOrganizationRecordUseCase.execute(tenant.id, "jobTitle", jobTitleId);
  }

  @Patch("job-titles/:jobTitleId")
  @Permissions("organization.manage")
  async updateJobTitle(
    @CurrentTenant() tenant: TenantContext,
    @Param("jobTitleId") jobTitleId: string,
    @Body() body: UpdateJobTitleDto
  ) {
    return this.updateOrganizationRecordUseCase.execute({
      tenantId: tenant.id,
      kind: "jobTitle",
      id: jobTitleId,
      ...body
    });
  }

  @Post("job-titles/:jobTitleId/archive")
  @Permissions("organization.manage")
  async archiveJobTitle(
    @CurrentTenant() tenant: TenantContext,
    @Param("jobTitleId") jobTitleId: string
  ) {
    return this.archiveOrganizationRecordUseCase.execute(tenant.id, "jobTitle", jobTitleId);
  }

  @Post("job-titles/:jobTitleId/reactivate")
  @Permissions("organization.manage")
  async reactivateJobTitle(
    @CurrentTenant() tenant: TenantContext,
    @Param("jobTitleId") jobTitleId: string
  ) {
    return this.reactivateOrganizationRecordUseCase.execute(tenant.id, "jobTitle", jobTitleId);
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

  @Get("employment-types/:employmentTypeId")
  @Permissions("organization.read")
  async getEmploymentType(
    @CurrentTenant() tenant: TenantContext,
    @Param("employmentTypeId") employmentTypeId: string
  ) {
    return this.getOrganizationRecordUseCase.execute(tenant.id, "employmentType", employmentTypeId);
  }

  @Patch("employment-types/:employmentTypeId")
  @Permissions("organization.manage")
  async updateEmploymentType(
    @CurrentTenant() tenant: TenantContext,
    @Param("employmentTypeId") employmentTypeId: string,
    @Body() body: UpdateEmploymentTypeDto
  ) {
    return this.updateOrganizationRecordUseCase.execute({
      tenantId: tenant.id,
      kind: "employmentType",
      id: employmentTypeId,
      ...body
    });
  }

  @Post("employment-types/:employmentTypeId/archive")
  @Permissions("organization.manage")
  async archiveEmploymentType(
    @CurrentTenant() tenant: TenantContext,
    @Param("employmentTypeId") employmentTypeId: string
  ) {
    return this.archiveOrganizationRecordUseCase.execute(tenant.id, "employmentType", employmentTypeId);
  }

  @Post("employment-types/:employmentTypeId/reactivate")
  @Permissions("organization.manage")
  async reactivateEmploymentType(
    @CurrentTenant() tenant: TenantContext,
    @Param("employmentTypeId") employmentTypeId: string
  ) {
    return this.reactivateOrganizationRecordUseCase.execute(tenant.id, "employmentType", employmentTypeId);
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

  @Get("work-modes/:workModeId")
  @Permissions("organization.read")
  async getWorkMode(@CurrentTenant() tenant: TenantContext, @Param("workModeId") workModeId: string) {
    return this.getOrganizationRecordUseCase.execute(tenant.id, "workMode", workModeId);
  }

  @Patch("work-modes/:workModeId")
  @Permissions("organization.manage")
  async updateWorkMode(
    @CurrentTenant() tenant: TenantContext,
    @Param("workModeId") workModeId: string,
    @Body() body: UpdateWorkModeDto
  ) {
    return this.updateOrganizationRecordUseCase.execute({
      tenantId: tenant.id,
      kind: "workMode",
      id: workModeId,
      ...body
    });
  }

  @Post("work-modes/:workModeId/archive")
  @Permissions("organization.manage")
  async archiveWorkMode(
    @CurrentTenant() tenant: TenantContext,
    @Param("workModeId") workModeId: string
  ) {
    return this.archiveOrganizationRecordUseCase.execute(tenant.id, "workMode", workModeId);
  }

  @Post("work-modes/:workModeId/reactivate")
  @Permissions("organization.manage")
  async reactivateWorkMode(
    @CurrentTenant() tenant: TenantContext,
    @Param("workModeId") workModeId: string
  ) {
    return this.reactivateOrganizationRecordUseCase.execute(tenant.id, "workMode", workModeId);
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

  @Get("client-projects/:clientProjectId")
  @Permissions("organization.read")
  async getClientProject(
    @CurrentTenant() tenant: TenantContext,
    @Param("clientProjectId") clientProjectId: string
  ) {
    return this.getOrganizationRecordUseCase.execute(tenant.id, "clientProject", clientProjectId);
  }

  @Patch("client-projects/:clientProjectId")
  @Permissions("organization.manage")
  async updateClientProject(
    @CurrentTenant() tenant: TenantContext,
    @Param("clientProjectId") clientProjectId: string,
    @Body() body: UpdateClientProjectDto
  ) {
    return this.updateOrganizationRecordUseCase.execute({
      tenantId: tenant.id,
      kind: "clientProject",
      id: clientProjectId,
      ...body
    });
  }

  @Post("client-projects/:clientProjectId/archive")
  @Permissions("organization.manage")
  async archiveClientProject(
    @CurrentTenant() tenant: TenantContext,
    @Param("clientProjectId") clientProjectId: string
  ) {
    return this.archiveOrganizationRecordUseCase.execute(tenant.id, "clientProject", clientProjectId);
  }

  @Post("client-projects/:clientProjectId/reactivate")
  @Permissions("organization.manage")
  async reactivateClientProject(
    @CurrentTenant() tenant: TenantContext,
    @Param("clientProjectId") clientProjectId: string
  ) {
    return this.reactivateOrganizationRecordUseCase.execute(tenant.id, "clientProject", clientProjectId);
  }
}
