import { Inject, Injectable } from "@nestjs/common";
import type { EmployeeCustomFieldDefinitionEntity } from "../../domain/entities/employee.entity";
import {
  EMPLOYEES_REPOSITORY,
  type CreateEmployeeCustomFieldDefinitionInput,
  type EmployeesRepository
} from "../../domain/ports/employees.repository.port";

@Injectable()
export class CreateEmployeeCustomFieldDefinitionUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository
  ) {}

  execute = async (
    input: CreateEmployeeCustomFieldDefinitionInput
  ): Promise<EmployeeCustomFieldDefinitionEntity> =>
    this.employeesRepository.createCustomFieldDefinition(input);
}
