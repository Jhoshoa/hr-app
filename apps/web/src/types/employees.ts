export type EmployeeStatus = "ACTIVE" | "INACTIVE" | "TERMINATED";

export interface EmployeeListItem {
  readonly id: string;
  readonly employeeNumber: string;
  readonly name: string;
  readonly workEmail: string;
  readonly department: string;
  readonly jobTitle: string;
  readonly location: string;
  readonly organizationUnit?: string;
  readonly organizationUnitId?: string | null;
  readonly manager: string;
  readonly status: EmployeeStatus;
  readonly startDate: string;
}
