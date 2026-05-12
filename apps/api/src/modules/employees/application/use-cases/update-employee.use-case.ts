import { Inject, Injectable } from "@nestjs/common";
import type { EmployeeEntity } from "../../domain/entities/employee.entity";
import {
  EMPLOYEES_REPOSITORY,
  type EmployeesRepository,
  type UpdateEmployeeInput
} from "../../domain/ports/employees.repository.port";

@Injectable()
export class UpdateEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository
  ) {}

  execute = async (input: UpdateEmployeeInput): Promise<EmployeeEntity> =>
    this.employeesRepository.update(input);
}
