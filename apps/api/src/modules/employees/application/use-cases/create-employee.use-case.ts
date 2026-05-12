import { Inject, Injectable } from "@nestjs/common";
import {
  EMPLOYEES_REPOSITORY,
  type CreateEmployeeInput,
  type EmployeesRepository
} from "../../domain/ports/employees.repository.port";
import type { EmployeeEntity } from "../../domain/entities/employee.entity";

@Injectable()
export class CreateEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository
  ) {}

  execute = async (input: CreateEmployeeInput): Promise<EmployeeEntity> =>
    this.employeesRepository.create(input);
}
