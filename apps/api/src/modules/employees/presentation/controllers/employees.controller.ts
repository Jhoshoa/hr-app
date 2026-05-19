import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { EmployeeStatus } from "@prisma/client";
import { CurrentTenant } from "../../../../common/decorators/current-tenant.decorator";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator";
import { Permissions } from "../../../../common/decorators/permissions.decorator";
import type { AuthenticatedUserContext, TenantContext } from "../../../../common/types/request-context";
import { AddCompensationRecordUseCase } from "../../application/use-cases/add-compensation-record.use-case";
import { AddEmployeeJobAssignmentUseCase } from "../../application/use-cases/add-employee-job-assignment.use-case";
import { AddManagerRelationshipUseCase } from "../../application/use-cases/add-manager-relationship.use-case";
import { CreateEmployeeCustomFieldDefinitionUseCase } from "../../application/use-cases/create-employee-custom-field-definition.use-case";
import { CreateEmployeeUseCase } from "../../application/use-cases/create-employee.use-case";
import { DeleteEmployeeProfileUseCase } from "../../application/use-cases/delete-employee-profile.use-case";
import { ExportEmployeesCsvUseCase } from "../../application/use-cases/export-employees-csv.use-case";
import { GetEmployeeUseCase } from "../../application/use-cases/get-employee.use-case";
import { ImportEmployeesCsvUseCase } from "../../application/use-cases/import-employees-csv.use-case";
import { ListEmployeesUseCase } from "../../application/use-cases/list-employees.use-case";
import { SetEmployeeCustomFieldValueUseCase } from "../../application/use-cases/set-employee-custom-field-value.use-case";
import { UpdateEmployeeUseCase } from "../../application/use-cases/update-employee.use-case";
import { UpsertEmployeeProfileUseCase } from "../../application/use-cases/upsert-employee-profile.use-case";
import {
  AddCompensationRecordDto,
  AddEmployeeJobAssignmentDto,
  AddManagerRelationshipDto,
  CreateEmployeeCustomFieldDefinitionDto,
  CreateEmployeeDto,
  EmployeeProfileDto,
  ImportEmployeesCsvDto,
  SetEmployeeCustomFieldValueDto,
  UpdateEmployeeDto
} from "../dto/employee.dto";

@ApiBearerAuth()
@ApiTags("employees")
@Controller()
export class EmployeesController {
  constructor(
    private readonly createEmployeeUseCase: CreateEmployeeUseCase,
    private readonly listEmployeesUseCase: ListEmployeesUseCase,
    private readonly getEmployeeUseCase: GetEmployeeUseCase,
    private readonly updateEmployeeUseCase: UpdateEmployeeUseCase,
    private readonly addEmployeeJobAssignmentUseCase: AddEmployeeJobAssignmentUseCase,
    private readonly addManagerRelationshipUseCase: AddManagerRelationshipUseCase,
    private readonly addCompensationRecordUseCase: AddCompensationRecordUseCase,
    private readonly createEmployeeCustomFieldDefinitionUseCase: CreateEmployeeCustomFieldDefinitionUseCase,
    private readonly setEmployeeCustomFieldValueUseCase: SetEmployeeCustomFieldValueUseCase,
    private readonly upsertEmployeeProfileUseCase: UpsertEmployeeProfileUseCase,
    private readonly deleteEmployeeProfileUseCase: DeleteEmployeeProfileUseCase,
    private readonly exportEmployeesCsvUseCase: ExportEmployeesCsvUseCase,
    private readonly importEmployeesCsvUseCase: ImportEmployeesCsvUseCase
  ) {}

  @Get("employees")
  async listEmployees(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Query("status") status?: EmployeeStatus,
    @Query("search") search?: string,
    @Query("departmentId") departmentId?: string,
    @Query("locationId") locationId?: string,
    @Query("organizationUnitId") organizationUnitId?: string
  ) {
    return this.listEmployeesUseCase.execute(tenant.id, {
      status,
      search,
      departmentId,
      locationId,
      organizationUnitId
    }, {
      userId: user.id,
      permissions: tenant.permissions
    });
  }

  @Get("employees/export.csv")
  @Permissions("employees.manage")
  @Header("Content-Type", "text/csv")
  async exportEmployeesCsv(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Query("status") status?: EmployeeStatus,
    @Query("search") search?: string,
    @Query("departmentId") departmentId?: string,
    @Query("locationId") locationId?: string,
    @Query("organizationUnitId") organizationUnitId?: string
  ) {
    return this.exportEmployeesCsvUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      filters: {
        status,
        search,
        departmentId,
        locationId,
        organizationUnitId
      }
    });
  }

  @Post("employees/import.csv")
  @Permissions("employees.manage")
  async importEmployeesCsv(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: ImportEmployeesCsvDto
  ) {
    return this.importEmployeesCsvUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      content: body.content
    });
  }

  @Post("employees")
  @Permissions("employees.manage")
  async createEmployee(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: CreateEmployeeDto
  ) {
    return this.createEmployeeUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      userId: body.userId,
      employeeNumber: body.employeeNumber,
      firstName: body.firstName,
      lastName: body.lastName,
      workEmail: body.workEmail,
      personalEmail: body.personalEmail,
      startDate: new Date(body.startDate),
      profile: body.profile
        ? {
            ...body.profile,
            birthDate: body.profile.birthDate ? new Date(body.profile.birthDate) : undefined
          }
        : undefined
    });
  }

  @Get("employees/:employeeId")
  async getEmployee(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("employeeId") employeeId: string
  ) {
    return this.getEmployeeUseCase.execute(tenant.id, employeeId, {
      userId: user.id,
      permissions: tenant.permissions
    });
  }

  @Patch("employees/:employeeId")
  @Permissions("employees.manage")
  async updateEmployee(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("employeeId") employeeId: string,
    @Body() body: UpdateEmployeeDto
  ) {
    return this.updateEmployeeUseCase.execute({
      tenantId: tenant.id,
      employeeId,
      actorUserId: user.id,
      status: body.status,
      firstName: body.firstName,
      lastName: body.lastName,
      workEmail: body.workEmail,
      personalEmail: body.personalEmail,
      terminationDate: body.terminationDate ? new Date(body.terminationDate) : undefined,
      profile: body.profile
        ? {
            ...body.profile,
            birthDate: body.profile.birthDate ? new Date(body.profile.birthDate) : undefined
          }
        : undefined
    });
  }

  @Get("employees/:employeeId/profile")
  async getEmployeeProfile(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("employeeId") employeeId: string
  ) {
    const employee = await this.getEmployeeUseCase.execute(tenant.id, employeeId, {
      userId: user.id,
      permissions: tenant.permissions
    });

    return employee.profile ?? null;
  }

  @Patch("employees/:employeeId/profile")
  @Permissions("employees.manage")
  async upsertEmployeeProfile(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("employeeId") employeeId: string,
    @Body() body: EmployeeProfileDto
  ) {
    return this.upsertEmployeeProfileUseCase.execute({
      tenantId: tenant.id,
      employeeId,
      actorUserId: user.id,
      profile: {
        ...body,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined
      }
    });
  }

  @Delete("employees/:employeeId/profile")
  @Permissions("employees.manage")
  async deleteEmployeeProfile(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("employeeId") employeeId: string
  ) {
    await this.deleteEmployeeProfileUseCase.execute({
      tenantId: tenant.id,
      employeeId,
      actorUserId: user.id
    });

    return { deleted: true };
  }

  @Post("employees/:employeeId/job-assignments")
  @Permissions("employees.manage")
  async addJobAssignment(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("employeeId") employeeId: string,
    @Body() body: AddEmployeeJobAssignmentDto
  ) {
    return this.addEmployeeJobAssignmentUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      employeeId,
      ...body,
      effectiveFrom: new Date(body.effectiveFrom),
      effectiveTo: body.effectiveTo ? new Date(body.effectiveTo) : undefined
    });
  }

  @Post("employees/:employeeId/manager-relationships")
  @Permissions("employees.manage")
  async addManagerRelationship(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("employeeId") employeeId: string,
    @Body() body: AddManagerRelationshipDto
  ) {
    return this.addManagerRelationshipUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      employeeId,
      managerEmployeeId: body.managerEmployeeId,
      effectiveFrom: new Date(body.effectiveFrom),
      effectiveTo: body.effectiveTo ? new Date(body.effectiveTo) : undefined
    });
  }

  @Post("employees/:employeeId/compensation-records")
  @Permissions("employees.compensation.manage")
  async addCompensationRecord(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("employeeId") employeeId: string,
    @Body() body: AddCompensationRecordDto
  ) {
    return this.addCompensationRecordUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      employeeId,
      amount: body.amount,
      currency: body.currency ?? "BOB",
      frequency: body.frequency ?? "MONTHLY",
      visibility: body.visibility ?? "HR_ONLY",
      effectiveFrom: new Date(body.effectiveFrom),
      effectiveTo: body.effectiveTo ? new Date(body.effectiveTo) : undefined
    });
  }

  @Post("employee-custom-fields")
  @Permissions("employees.custom-fields.manage")
  async createCustomFieldDefinition(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: CreateEmployeeCustomFieldDefinitionDto
  ) {
    return this.createEmployeeCustomFieldDefinitionUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      key: body.key,
      label: body.label,
      type: body.type,
      isRequired: body.isRequired,
      visibility: body.visibility ?? "HR_ONLY",
      options: body.options
    });
  }

  @Patch("employees/:employeeId/custom-field-values/:fieldDefinitionId")
  @Permissions("employees.manage")
  async setCustomFieldValue(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("employeeId") employeeId: string,
    @Param("fieldDefinitionId") fieldDefinitionId: string,
    @Body() body: SetEmployeeCustomFieldValueDto
  ) {
    return this.setEmployeeCustomFieldValueUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      employeeId,
      fieldDefinitionId,
      value: body.value
    });
  }
}
