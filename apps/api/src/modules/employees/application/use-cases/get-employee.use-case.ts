import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { EmployeeEntity } from "../../domain/entities/employee.entity";
import {
  EMPLOYEES_REPOSITORY,
  type EmployeesRepository
} from "../../domain/ports/employees.repository.port";

@Injectable()
export class GetEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository
  ) {}

  execute = async (tenantId: string, employeeId: string): Promise<EmployeeEntity> => {
    const employee = await this.employeesRepository.findById(tenantId, employeeId);

    if (!employee) {
      throw new NotFoundException("Employee was not found.");
    }

    return employee;
  };
}
