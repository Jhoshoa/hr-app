import { Inject, Injectable } from "@nestjs/common";
import {
  EMPLOYEES_REPOSITORY,
  type EmployeeListFilters,
  type EmployeesRepository
} from "../../domain/ports/employees.repository.port";
import { EmployeeCsvService } from "../services/employee-csv.service";

@Injectable()
export class ExportEmployeesCsvUseCase {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
    private readonly employeeCsvService: EmployeeCsvService
  ) {}

  execute = async (tenantId: string, filters: EmployeeListFilters): Promise<string> => {
    const employees = await this.employeesRepository.list(tenantId, filters);
    return this.employeeCsvService.toCsv(employees);
  };
}
