import { Inject, Injectable } from "@nestjs/common";
import type { EmployeeCustomFieldValueEntity } from "../../domain/entities/employee.entity";
import {
  EMPLOYEES_REPOSITORY,
  type EmployeesRepository,
  type SetEmployeeCustomFieldValueInput
} from "../../domain/ports/employees.repository.port";

@Injectable()
export class SetEmployeeCustomFieldValueUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository
  ) {}

  execute = async (
    input: SetEmployeeCustomFieldValueInput
  ): Promise<EmployeeCustomFieldValueEntity> => this.employeesRepository.setCustomFieldValue(input);
}
