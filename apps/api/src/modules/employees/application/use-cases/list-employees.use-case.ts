import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type { EmployeeEntity } from "../../domain/entities/employee.entity";
import {
  EMPLOYEES_REPOSITORY,
  type EmployeeListFilters,
  type EmployeesRepository
} from "../../domain/ports/employees.repository.port";
import {
  EmployeeVisibilityService,
  type EmployeeAccessContext
} from "../services/employee-visibility.service";

@Injectable()
export class ListEmployeesUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
    private readonly employeeVisibilityService: EmployeeVisibilityService
  ) {}

  execute = async (
    tenantId: string,
    filters: EmployeeListFilters,
    access: Omit<EmployeeAccessContext, "currentEmployeeId">
  ): Promise<EmployeeEntity[]> => {
    const currentEmployee = await this.employeesRepository.findByUserId(tenantId, access.userId);
    const accessContext: EmployeeAccessContext = {
      ...access,
      currentEmployeeId: currentEmployee?.id
    };

    if (this.employeeVisibilityService.canReadAll(accessContext)) {
      return this.employeeVisibilityService.filterEmployees(
        await this.employeesRepository.list(tenantId, filters),
        accessContext
      );
    }

    if (this.employeeVisibilityService.canReadTeam(accessContext)) {
      const directReports = await this.employeesRepository.listDirectReportsByManagerUserId(
        tenantId,
        access.userId,
        filters
      );
      const ownEmployee = this.employeeVisibilityService.canReadSelf(accessContext) && currentEmployee
        ? [currentEmployee]
        : [];

      return this.employeeVisibilityService.filterEmployees(
        [...ownEmployee, ...directReports],
        accessContext
      );
    }

    if (this.employeeVisibilityService.canReadSelf(accessContext) && currentEmployee) {
      return this.employeeVisibilityService.filterEmployees([currentEmployee], accessContext);
    }

    throw new ForbiddenException("You cannot list employees.");
  };
}
