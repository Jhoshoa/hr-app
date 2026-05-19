export type EmployeeStatus = "ACTIVE" | "INACTIVE" | "TERMINATED";

export interface EmployeeListItem {
  readonly id: string;
  readonly employeeNumber: string;
  readonly name: string;
  readonly workEmail: string;
  readonly departmentId?: string | null;
  readonly department: string;
  readonly jobTitleId?: string | null;
  readonly jobTitle: string;
  readonly locationId?: string | null;
  readonly location: string;
  readonly organizationUnit?: string;
  readonly organizationUnitId?: string | null;
  readonly manager: string;
  readonly status: EmployeeStatus;
  readonly startDate: string;
  readonly jobAssignments?: readonly EmployeeJobAssignment[];
}

export interface EmployeeJobAssignment {
  readonly id: string;
  readonly departmentId?: string | null;
  readonly jobTitleId?: string | null;
  readonly locationId?: string | null;
  readonly organizationUnitId?: string | null;
  readonly employmentTypeId?: string | null;
  readonly workModeId?: string | null;
  readonly effectiveFrom: string;
  readonly effectiveTo?: string | null;
}

export interface EmployeeListFilters {
  readonly status?: EmployeeStatus;
  readonly search?: string;
  readonly departmentId?: string;
  readonly locationId?: string;
  readonly organizationUnitId?: string;
}
