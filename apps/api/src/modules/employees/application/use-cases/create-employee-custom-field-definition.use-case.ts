import { Inject, Injectable } from "@nestjs/common";
import type { EmployeeCustomFieldDefinitionEntity } from "../../domain/entities/employee.entity";
import {
  EMPLOYEES_REPOSITORY,
  type CreateEmployeeCustomFieldDefinitionInput,
  type EmployeesRepository
} from "../../domain/ports/employees.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

export interface CreateEmployeeCustomFieldDefinitionCommand
  extends CreateEmployeeCustomFieldDefinitionInput {
  readonly actorUserId: string;
}

@Injectable()
export class CreateEmployeeCustomFieldDefinitionUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (
    input: CreateEmployeeCustomFieldDefinitionCommand
  ): Promise<EmployeeCustomFieldDefinitionEntity> => {
    const definition = await this.employeesRepository.createCustomFieldDefinition(input);

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "employee.custom_field_definition.created",
      resourceType: "employeeCustomFieldDefinition",
      resourceId: definition.id,
      metadata: { key: definition.key, type: definition.type }
    });

    return definition;
  };
}
