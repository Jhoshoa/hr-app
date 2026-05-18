import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { ManagerRelationshipEntity } from "../../domain/entities/employee.entity";
import {
  EMPLOYEES_REPOSITORY,
  type AddManagerRelationshipInput,
  type EmployeesRepository
} from "../../domain/ports/employees.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

export interface AddManagerRelationshipCommand extends AddManagerRelationshipInput {
  readonly actorUserId: string;
}

@Injectable()
export class AddManagerRelationshipUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: AddManagerRelationshipCommand): Promise<ManagerRelationshipEntity> => {
    if (input.employeeId === input.managerEmployeeId) {
      throw new BadRequestException("Employee cannot be their own manager.");
    }

    const [employeeExists, managerExists] = await Promise.all([
      this.employeesRepository.existsById(input.tenantId, input.employeeId),
      this.employeesRepository.existsById(input.tenantId, input.managerEmployeeId)
    ]);

    if (!employeeExists || !managerExists) {
      throw new BadRequestException("Employee and manager must belong to the tenant.");
    }

    const relationship = await this.employeesRepository.addManagerRelationship(input);

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "employee.manager_relationship.created",
      resourceType: "employee",
      resourceId: input.employeeId,
      metadata: {
        relationshipId: relationship.id,
        managerEmployeeId: input.managerEmployeeId
      }
    });

    return relationship;
  };
}
