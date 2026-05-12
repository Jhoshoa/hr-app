import { Inject, Injectable } from "@nestjs/common";
import {
  EMPLOYEES_REPOSITORY,
  type EmployeesRepository
} from "../../domain/ports/employees.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

export interface DeleteEmployeeProfileCommand {
  readonly tenantId: string;
  readonly employeeId: string;
  readonly actorUserId: string;
}

@Injectable()
export class DeleteEmployeeProfileUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: DeleteEmployeeProfileCommand): Promise<void> => {
    await this.employeesRepository.deleteProfile(input.tenantId, input.employeeId);
    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "employee.profile.deleted",
      resourceType: "employee",
      resourceId: input.employeeId
    });
  };
}
