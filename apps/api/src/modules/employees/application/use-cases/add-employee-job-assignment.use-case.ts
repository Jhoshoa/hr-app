import { Inject, Injectable } from "@nestjs/common";
import type { EmployeeJobAssignmentEntity } from "../../domain/entities/employee.entity";
import {
  EMPLOYEES_REPOSITORY,
  type AddEmployeeJobAssignmentInput,
  type EmployeesRepository
} from "../../domain/ports/employees.repository.port";

@Injectable()
export class AddEmployeeJobAssignmentUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository
  ) {}

  execute = async (
    input: AddEmployeeJobAssignmentInput
  ): Promise<EmployeeJobAssignmentEntity> => this.employeesRepository.addJobAssignment(input);
}
