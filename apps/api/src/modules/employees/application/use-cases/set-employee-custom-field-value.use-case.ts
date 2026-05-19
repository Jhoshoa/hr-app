import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { EmployeeCustomFieldValueEntity } from "../../domain/entities/employee.entity";
import {
  EMPLOYEES_REPOSITORY,
  type EmployeesRepository,
  type SetEmployeeCustomFieldValueInput
} from "../../domain/ports/employees.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

export interface SetEmployeeCustomFieldValueCommand extends SetEmployeeCustomFieldValueInput {
  readonly actorUserId: string;
}

@Injectable()
export class SetEmployeeCustomFieldValueUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (
    input: SetEmployeeCustomFieldValueCommand
  ): Promise<EmployeeCustomFieldValueEntity> => {
    const [employeeExists, fieldDefinitionExists] = await Promise.all([
      this.employeesRepository.existsById(input.tenantId, input.employeeId),
      this.employeesRepository.customFieldDefinitionExists(input.tenantId, input.fieldDefinitionId)
    ]);

    if (!employeeExists || !fieldDefinitionExists) {
      throw new BadRequestException(
        "Employee and custom field definition must belong to the tenant."
      );
    }

    const value = await this.employeesRepository.setCustomFieldValue(input);

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "employee.custom_field_value.updated",
      resourceType: "employee",
      resourceId: input.employeeId,
      metadata: { fieldDefinitionId: input.fieldDefinitionId }
    });

    return value;
  };
}
