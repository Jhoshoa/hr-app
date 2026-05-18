import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { EmployeeJobAssignmentEntity } from "../../domain/entities/employee.entity";
import {
  EMPLOYEES_REPOSITORY,
  type AddEmployeeJobAssignmentInput,
  type EmployeesRepository
} from "../../domain/ports/employees.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";
import {
  ORGANIZATION_UNITS_REPOSITORY,
  type OrganizationUnitsRepository
} from "../../../organization/domain/ports/organization-units.repository.port";

export interface AddEmployeeJobAssignmentCommand extends AddEmployeeJobAssignmentInput {
  readonly actorUserId: string;
}

@Injectable()
export class AddEmployeeJobAssignmentUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
    @Inject(ORGANIZATION_UNITS_REPOSITORY)
    private readonly organizationUnitsRepository: OrganizationUnitsRepository,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (
    input: AddEmployeeJobAssignmentCommand
  ): Promise<EmployeeJobAssignmentEntity> => {
    if (input.organizationUnitId) {
      const organizationUnit = await this.organizationUnitsRepository.findUnitById(
        input.tenantId,
        input.organizationUnitId
      );

      if (!organizationUnit || organizationUnit.status !== "ACTIVE") {
        throw new BadRequestException("Organization unit must be active and belong to the tenant.");
      }
    }

    const assignment = await this.employeesRepository.addJobAssignment(input);

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "employee.job_assignment.created",
      resourceType: "employee",
      resourceId: input.employeeId,
      metadata: {
        assignmentId: assignment.id,
        organizationUnitId: assignment.organizationUnitId ?? null
      }
    });

    return assignment;
  };
}
