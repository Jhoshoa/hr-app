import { Inject, Injectable } from "@nestjs/common";
import type { EmployeeEntity } from "../../domain/entities/employee.entity";
import {
  EMPLOYEES_REPOSITORY,
  type EmployeeListFilters,
  type EmployeesRepository
} from "../../domain/ports/employees.repository.port";

@Injectable()
export class ListEmployeesUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository
  ) {}

  execute = async (tenantId: string, filters: EmployeeListFilters): Promise<EmployeeEntity[]> =>
    this.employeesRepository.list(tenantId, filters);
}
