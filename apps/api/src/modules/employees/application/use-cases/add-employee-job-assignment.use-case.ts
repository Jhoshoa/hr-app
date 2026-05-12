import { Inject, Injectable } from "@nestjs/common";
import type { EmployeeJobAssignmentEntity } from "../../domain/entities/employee.entity";
import {
  EMPLOYEES_REPOSITORY,
  type AddEmployeeJobAssignmentInput,
  type EmployeesRepository
} from "../../domain/ports/employees.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

export interface AddEmployeeJobAssignmentCommand extends AddEmployeeJobAssignmentInput {
  readonly actorUserId: string;
}

@Injectable()
export class AddEmployeeJobAssignmentUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (
    input: AddEmployeeJobAssignmentCommand
  ): Promise<EmployeeJobAssignmentEntity> => {
    const assignment = await this.employeesRepository.addJobAssignment(input);

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "employee.job_assignment.created",
      resourceType: "employee",
      resourceId: input.employeeId,
      metadata: { assignmentId: assignment.id }
    });

    return assignment;
  };
}
