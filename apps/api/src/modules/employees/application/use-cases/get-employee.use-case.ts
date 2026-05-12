import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { EmployeeEntity } from "../../domain/entities/employee.entity";
import {
  EMPLOYEES_REPOSITORY,
  type EmployeesRepository
} from "../../domain/ports/employees.repository.port";
import {
  EmployeeVisibilityService,
  type EmployeeAccessContext
} from "../services/employee-visibility.service";

@Injectable()
export class GetEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
    private readonly employeeVisibilityService: EmployeeVisibilityService
  ) {}

  execute = async (
    tenantId: string,
    employeeId: string,
    access: Omit<EmployeeAccessContext, "currentEmployeeId">
  ): Promise<EmployeeEntity> => {
    const employee = await this.employeesRepository.findById(tenantId, employeeId);

    if (!employee) {
      throw new NotFoundException("Employee was not found.");
    }

    const currentEmployee = await this.employeesRepository.findByUserId(tenantId, access.userId);
    return this.employeeVisibilityService.filterEmployee(employee, {
      ...access,
      currentEmployeeId: currentEmployee?.id
    });
  };
}
