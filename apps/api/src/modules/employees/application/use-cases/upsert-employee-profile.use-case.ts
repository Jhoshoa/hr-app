import { Inject, Injectable } from "@nestjs/common";
import type { EmployeeEntity } from "../../domain/entities/employee.entity";
import {
  EMPLOYEES_REPOSITORY,
  type EmployeesRepository,
  type UpdateEmployeeProfileInput
} from "../../domain/ports/employees.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

export interface UpsertEmployeeProfileCommand extends UpdateEmployeeProfileInput {
  readonly actorUserId: string;
}

@Injectable()
export class UpsertEmployeeProfileUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: UpsertEmployeeProfileCommand): Promise<EmployeeEntity> => {
    const employee = await this.employeesRepository.upsertProfile(input);

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "employee.profile.updated",
      resourceType: "employee",
      resourceId: input.employeeId
    });

    return employee;
  };
}
