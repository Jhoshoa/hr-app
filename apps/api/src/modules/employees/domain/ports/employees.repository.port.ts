import type {
  CompensationRecordEntity,
  EmployeeCustomFieldDefinitionEntity,
  EmployeeCustomFieldValueEntity,
  EmployeeEntity,
  EmployeeJobAssignmentEntity,
  ManagerRelationshipEntity
} from "../entities/employee.entity";
import type {
  CompensationFrequency,
  CompensationVisibility,
  CustomFieldType,
  CustomFieldVisibility,
  EmployeeStatus
} from "@prisma/client";

export const EMPLOYEES_REPOSITORY = Symbol("EMPLOYEES_REPOSITORY");

export interface EmployeeProfileInput {
  readonly birthDate?: Date;
  readonly phone?: string;
  readonly address?: string;
  readonly emergencyContactName?: string;
  readonly emergencyContactPhone?: string;
}

export interface CreateEmployeeInput {
  readonly tenantId: string;
  readonly userId?: string;
  readonly employeeNumber: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly workEmail: string;
  readonly personalEmail?: string;
  readonly startDate: Date;
  readonly profile?: EmployeeProfileInput;
}

export interface UpdateEmployeeInput {
  readonly tenantId: string;
  readonly employeeId: string;
  readonly status?: EmployeeStatus;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly workEmail?: string;
  readonly personalEmail?: string | null;
  readonly terminationDate?: Date | null;
  readonly profile?: EmployeeProfileInput;
}

export interface UpdateEmployeeProfileInput {
  readonly tenantId: string;
  readonly employeeId: string;
  readonly profile: EmployeeProfileInput;
}

export interface EmployeeListFilters {
  readonly status?: EmployeeStatus;
  readonly search?: string;
  readonly departmentId?: string;
  readonly locationId?: string;
  readonly organizationUnitId?: string;
}

export interface AddEmployeeJobAssignmentInput {
  readonly tenantId: string;
  readonly employeeId: string;
  readonly departmentId?: string;
  readonly jobTitleId?: string;
  readonly locationId?: string;
  readonly organizationUnitId?: string;
  readonly employmentTypeId?: string;
  readonly workModeId?: string;
  readonly effectiveFrom: Date;
  readonly effectiveTo?: Date;
}

export interface AddManagerRelationshipInput {
  readonly tenantId: string;
  readonly employeeId: string;
  readonly managerEmployeeId: string;
  readonly effectiveFrom: Date;
  readonly effectiveTo?: Date;
}

export interface AddCompensationRecordInput {
  readonly tenantId: string;
  readonly employeeId: string;
  readonly amount: string;
  readonly currency: string;
  readonly frequency: CompensationFrequency;
  readonly visibility: CompensationVisibility;
  readonly effectiveFrom: Date;
  readonly effectiveTo?: Date;
}

export interface CreateEmployeeCustomFieldDefinitionInput {
  readonly tenantId: string;
  readonly key: string;
  readonly label: string;
  readonly type: CustomFieldType;
  readonly isRequired?: boolean;
  readonly visibility: CustomFieldVisibility;
  readonly options?: unknown;
}

export interface SetEmployeeCustomFieldValueInput {
  readonly tenantId: string;
  readonly employeeId: string;
  readonly fieldDefinitionId: string;
  readonly value: unknown;
}

export interface EmployeesRepository {
  create(input: CreateEmployeeInput): Promise<EmployeeEntity>;
  update(input: UpdateEmployeeInput): Promise<EmployeeEntity>;
  upsertProfile(input: UpdateEmployeeProfileInput): Promise<EmployeeEntity>;
  deleteProfile(tenantId: string, employeeId: string): Promise<void>;
  list(tenantId: string, filters: EmployeeListFilters): Promise<EmployeeEntity[]>;
  listDirectReportsByManagerUserId(
    tenantId: string,
    managerUserId: string,
    filters: EmployeeListFilters
  ): Promise<EmployeeEntity[]>;
  findById(tenantId: string, employeeId: string): Promise<EmployeeEntity | null>;
  findByUserId(tenantId: string, userId: string): Promise<EmployeeEntity | null>;
  addJobAssignment(input: AddEmployeeJobAssignmentInput): Promise<EmployeeJobAssignmentEntity>;
  addManagerRelationship(input: AddManagerRelationshipInput): Promise<ManagerRelationshipEntity>;
  addCompensationRecord(input: AddCompensationRecordInput): Promise<CompensationRecordEntity>;
  createCustomFieldDefinition(
    input: CreateEmployeeCustomFieldDefinitionInput
  ): Promise<EmployeeCustomFieldDefinitionEntity>;
  setCustomFieldValue(
    input: SetEmployeeCustomFieldValueInput
  ): Promise<EmployeeCustomFieldValueEntity>;
}
