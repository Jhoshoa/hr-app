import { Inject, Injectable } from "@nestjs/common";
import type { CompensationRecordEntity } from "../../domain/entities/employee.entity";
import {
  EMPLOYEES_REPOSITORY,
  type AddCompensationRecordInput,
  type EmployeesRepository
} from "../../domain/ports/employees.repository.port";

@Injectable()
export class AddCompensationRecordUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository
  ) {}

  execute = async (input: AddCompensationRecordInput): Promise<CompensationRecordEntity> =>
    this.employeesRepository.addCompensationRecord(input);
}
