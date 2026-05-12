import { ForbiddenException, Injectable } from "@nestjs/common";
import type { EmployeeEntity } from "../../domain/entities/employee.entity";

export interface EmployeeAccessContext {
  readonly userId: string;
  readonly permissions: string[];
  readonly currentEmployeeId?: string | null;
}

@Injectable()
export class EmployeeVisibilityService {
  canReadAll = (access: EmployeeAccessContext): boolean =>
    access.permissions.includes("employees.read");

  canReadTeam = (access: EmployeeAccessContext): boolean =>
    access.permissions.includes("employees.team.read");

  canReadSelf = (access: EmployeeAccessContext): boolean =>
    access.permissions.includes("employees.self.read");

  canReadCompensation = (access: EmployeeAccessContext): boolean =>
    access.permissions.includes("employees.compensation.read") ||
    access.permissions.includes("employees.compensation.manage");

  assertCanViewEmployee = (employee: EmployeeEntity, access: EmployeeAccessContext): void => {
    if (this.canReadAll(access)) {
      return;
    }

    if (this.isSelf(employee, access) && this.canReadSelf(access)) {
      return;
    }

    if (this.isDirectReport(employee, access) && this.canReadTeam(access)) {
      return;
    }

    throw new ForbiddenException("You cannot view this employee.");
  };

  filterEmployee = (employee: EmployeeEntity, access: EmployeeAccessContext): EmployeeEntity => {
    this.assertCanViewEmployee(employee, access);

    const canReadAll = this.canReadAll(access);
    const canReadSelf = this.isSelf(employee, access) && this.canReadSelf(access);
    const canReadSensitiveProfile = canReadAll || canReadSelf;

    return {
      ...employee,
      personalEmail: canReadSensitiveProfile ? employee.personalEmail : null,
      terminationDate: canReadAll ? employee.terminationDate : null,
      profile: canReadSensitiveProfile
        ? employee.profile
        : employee.profile
          ? {
              phone: employee.profile.phone,
              address: null,
              birthDate: null,
              emergencyContactName: null,
              emergencyContactPhone: null
            }
          : null,
      compensation: this.canReadCompensation(access) ? employee.compensation : undefined
    };
  };

  filterEmployees = (employees: EmployeeEntity[], access: EmployeeAccessContext): EmployeeEntity[] =>
    employees.map((employee) => this.filterEmployee(employee, access));

  private isSelf = (employee: EmployeeEntity, access: EmployeeAccessContext): boolean =>
    Boolean(access.currentEmployeeId && employee.id === access.currentEmployeeId) ||
    Boolean(employee.userId && employee.userId === access.userId);

  private isDirectReport = (employee: EmployeeEntity, access: EmployeeAccessContext): boolean =>
    Boolean(
      access.currentEmployeeId &&
        employee.managerRelationships?.some(
          (relationship) =>
            relationship.managerEmployeeId === access.currentEmployeeId && !relationship.effectiveTo
        )
    );
}
