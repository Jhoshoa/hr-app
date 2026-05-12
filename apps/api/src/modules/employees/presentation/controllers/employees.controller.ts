import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { EmployeeStatus } from "@prisma/client";
import { CurrentTenant } from "../../../../common/decorators/current-tenant.decorator";
import { Permissions } from "../../../../common/decorators/permissions.decorator";
import type { TenantContext } from "../../../../common/types/request-context";
import { AddCompensationRecordUseCase } from "../../application/use-cases/add-compensation-record.use-case";
import { AddEmployeeJobAssignmentUseCase } from "../../application/use-cases/add-employee-job-assignment.use-case";
import { AddManagerRelationshipUseCase } from "../../application/use-cases/add-manager-relationship.use-case";
import { CreateEmployeeCustomFieldDefinitionUseCase } from "../../application/use-cases/create-employee-custom-field-definition.use-case";
import { CreateEmployeeUseCase } from "../../application/use-cases/create-employee.use-case";
import { GetEmployeeUseCase } from "../../application/use-cases/get-employee.use-case";
import { ListEmployeesUseCase } from "../../application/use-cases/list-employees.use-case";
import { SetEmployeeCustomFieldValueUseCase } from "../../application/use-cases/set-employee-custom-field-value.use-case";
import { UpdateEmployeeUseCase } from "../../application/use-cases/update-employee.use-case";
import {
  AddCompensationRecordDto,
  AddEmployeeJobAssignmentDto,
  AddManagerRelationshipDto,
  CreateEmployeeCustomFieldDefinitionDto,
  CreateEmployeeDto,
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
    private readonly setEmployeeCustomFieldValueUseCase: SetEmployeeCustomFieldValueUseCase
  ) {}

  @Get("employees")
  @Permissions("employees.read")
  async listEmployees(
    @CurrentTenant() tenant: TenantContext,
    @Query("status") status?: EmployeeStatus,
    @Query("search") search?: string,
    @Query("departmentId") departmentId?: string,
    @Query("locationId") locationId?: string
  ) {
    return this.listEmployeesUseCase.execute(tenant.id, {
      status,
      search,
      departmentId,
      locationId
    });
  }

  @Post("employees")
  @Permissions("employees.manage")
  async createEmployee(@CurrentTenant() tenant: TenantContext, @Body() body: CreateEmployeeDto) {
    return this.createEmployeeUseCase.execute({
      tenantId: tenant.id,
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
  @Permissions("employees.read")
  async getEmployee(
    @CurrentTenant() tenant: TenantContext,
    @Param("employeeId") employeeId: string
  ) {
    return this.getEmployeeUseCase.execute(tenant.id, employeeId);
  }

  @Patch("employees/:employeeId")
  @Permissions("employees.manage")
  async updateEmployee(
    @CurrentTenant() tenant: TenantContext,
    @Param("employeeId") employeeId: string,
    @Body() body: UpdateEmployeeDto
  ) {
    return this.updateEmployeeUseCase.execute({
      tenantId: tenant.id,
      employeeId,
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

  @Post("employees/:employeeId/job-assignments")
  @Permissions("employees.manage")
  async addJobAssignment(
    @CurrentTenant() tenant: TenantContext,
    @Param("employeeId") employeeId: string,
    @Body() body: AddEmployeeJobAssignmentDto
  ) {
    return this.addEmployeeJobAssignmentUseCase.execute({
      tenantId: tenant.id,
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
    @Param("employeeId") employeeId: string,
    @Body() body: AddManagerRelationshipDto
  ) {
    return this.addManagerRelationshipUseCase.execute({
      tenantId: tenant.id,
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
    @Param("employeeId") employeeId: string,
    @Body() body: AddCompensationRecordDto
  ) {
    return this.addCompensationRecordUseCase.execute({
      tenantId: tenant.id,
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
    @Body() body: CreateEmployeeCustomFieldDefinitionDto
  ) {
    return this.createEmployeeCustomFieldDefinitionUseCase.execute({
      tenantId: tenant.id,
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
    @Param("employeeId") employeeId: string,
    @Param("fieldDefinitionId") fieldDefinitionId: string,
    @Body() body: SetEmployeeCustomFieldValueDto
  ) {
    return this.setEmployeeCustomFieldValueUseCase.execute({
      tenantId: tenant.id,
      employeeId,
      fieldDefinitionId,
      value: body.value
    });
  }
}
