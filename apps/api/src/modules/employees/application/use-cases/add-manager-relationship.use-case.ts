import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { ManagerRelationshipEntity } from "../../domain/entities/employee.entity";
import {
  EMPLOYEES_REPOSITORY,
  type AddManagerRelationshipInput,
  type EmployeesRepository
} from "../../domain/ports/employees.repository.port";

@Injectable()
export class AddManagerRelationshipUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository
  ) {}

  execute = async (input: AddManagerRelationshipInput): Promise<ManagerRelationshipEntity> => {
    if (input.employeeId === input.managerEmployeeId) {
      throw new BadRequestException("Employee cannot be their own manager.");
    }

    return this.employeesRepository.addManagerRelationship(input);
  };
}
