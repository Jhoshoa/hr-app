import { Inject, Injectable } from "@nestjs/common";
import {
  EMPLOYEES_REPOSITORY,
  type EmployeeListFilters,
  type EmployeesRepository
} from "../../domain/ports/employees.repository.port";
import { EmployeeCsvService } from "../services/employee-csv.service";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

interface ExportEmployeesCsvCommand {
  readonly tenantId: string;
  readonly actorUserId: string;
  readonly filters: EmployeeListFilters;
}

@Injectable()
export class ExportEmployeesCsvUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
    private readonly employeeCsvService: EmployeeCsvService,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: ExportEmployeesCsvCommand): Promise<string> => {
    const employees = await this.employeesRepository.list(input.tenantId, input.filters);

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "employee.exported",
      resourceType: "employee",
      resourceId: null,
      metadata: {
        rowCount: employees.length,
        filters: input.filters
      }
    });

    return this.employeeCsvService.toCsv(employees);
  };
}
