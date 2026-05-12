export interface EmployeeProfileEntity {
  readonly birthDate?: Date | null;
  readonly phone?: string | null;
  readonly address?: string | null;
  readonly emergencyContactName?: string | null;
  readonly emergencyContactPhone?: string | null;
}

export interface EmployeeJobAssignmentEntity {
  readonly id: string;
  readonly departmentId?: string | null;
  readonly jobTitleId?: string | null;
  readonly locationId?: string | null;
  readonly employmentTypeId?: string | null;
  readonly workModeId?: string | null;
  readonly effectiveFrom: Date;
  readonly effectiveTo?: Date | null;
}

export interface ManagerRelationshipEntity {
  readonly id: string;
  readonly employeeId: string;
  readonly managerEmployeeId: string;
  readonly effectiveFrom: Date;
  readonly effectiveTo?: Date | null;
}

export interface CompensationRecordEntity {
  readonly id: string;
  readonly employeeId: string;
  readonly amount: string;
  readonly currency: string;
  readonly frequency: string;
  readonly visibility: string;
  readonly effectiveFrom: Date;
  readonly effectiveTo?: Date | null;
}

export interface EmployeeEntity {
  readonly id: string;
  readonly tenantId: string;
  readonly userId?: string | null;
  readonly employeeNumber: string;
  readonly status: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly workEmail: string;
  readonly personalEmail?: string | null;
  readonly startDate: Date;
  readonly terminationDate?: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly profile?: EmployeeProfileEntity | null;
  readonly jobAssignments?: EmployeeJobAssignmentEntity[];
  readonly managerRelationships?: ManagerRelationshipEntity[];
  readonly compensation?: CompensationRecordEntity[];
  readonly customFieldValues?: EmployeeCustomFieldValueEntity[];
}

export interface EmployeeCustomFieldDefinitionEntity {
  readonly id: string;
  readonly tenantId: string;
  readonly key: string;
  readonly label: string;
  readonly type: string;
  readonly isRequired: boolean;
  readonly visibility: string;
  readonly options?: unknown;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface EmployeeCustomFieldValueEntity {
  readonly id: string;
  readonly tenantId: string;
  readonly employeeId: string;
  readonly fieldDefinitionId: string;
  readonly value: unknown;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
