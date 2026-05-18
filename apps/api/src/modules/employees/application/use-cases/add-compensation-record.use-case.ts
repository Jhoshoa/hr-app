import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { CompensationRecordEntity } from "../../domain/entities/employee.entity";
import {
  EMPLOYEES_REPOSITORY,
  type AddCompensationRecordInput,
  type EmployeesRepository
} from "../../domain/ports/employees.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

export interface AddCompensationRecordCommand extends AddCompensationRecordInput {
  readonly actorUserId: string;
}

@Injectable()
export class AddCompensationRecordUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: AddCompensationRecordCommand): Promise<CompensationRecordEntity> => {
    if (!(await this.employeesRepository.existsById(input.tenantId, input.employeeId))) {
      throw new BadRequestException("Employee must belong to the tenant.");
    }

    const compensation = await this.employeesRepository.addCompensationRecord(input);

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "employee.compensation.created",
      resourceType: "employee",
      resourceId: input.employeeId,
      metadata: {
        compensationRecordId: compensation.id,
        currency: compensation.currency,
        frequency: compensation.frequency,
        visibility: compensation.visibility
      }
    });

    return compensation;
  };
}
