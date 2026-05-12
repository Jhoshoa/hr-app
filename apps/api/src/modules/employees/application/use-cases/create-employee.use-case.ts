import { Inject, Injectable } from "@nestjs/common";
import {
  EMPLOYEES_REPOSITORY,
  type CreateEmployeeInput,
  type EmployeesRepository
} from "../../domain/ports/employees.repository.port";
import type { EmployeeEntity } from "../../domain/entities/employee.entity";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

export interface CreateEmployeeCommand extends CreateEmployeeInput {
  readonly actorUserId: string;
}

@Injectable()
export class CreateEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: CreateEmployeeCommand): Promise<EmployeeEntity> => {
    const employee = await this.employeesRepository.create(input);

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "employee.created",
      resourceType: "employee",
      resourceId: employee.id,
      metadata: { employeeNumber: employee.employeeNumber }
    });

    return employee;
  };
}
