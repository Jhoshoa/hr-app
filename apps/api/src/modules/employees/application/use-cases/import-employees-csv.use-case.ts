import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import {
  EMPLOYEES_REPOSITORY,
  type EmployeesRepository
} from "../../domain/ports/employees.repository.port";
import type { EmployeeEntity } from "../../domain/entities/employee.entity";
import { EmployeeCsvService } from "../services/employee-csv.service";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

export interface ImportEmployeesCsvCommand {
  readonly tenantId: string;
  readonly actorUserId: string;
  readonly content: string;
}

@Injectable()
export class ImportEmployeesCsvUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
    private readonly employeeCsvService: EmployeeCsvService,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: ImportEmployeesCsvCommand): Promise<EmployeeEntity[]> => {
    const parsed = this.employeeCsvService.parse(input.tenantId, input.content);

    if (parsed.errors.length > 0) {
      throw new BadRequestException({ message: "CSV import failed.", errors: parsed.errors });
    }

    const employees: EmployeeEntity[] = [];

    for (const row of parsed.rows) {
      employees.push(await this.employeesRepository.create(row));
    }

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "employee.csv_imported",
      resourceType: "employee",
      metadata: { importedCount: employees.length }
    });

    return employees;
  };
}
