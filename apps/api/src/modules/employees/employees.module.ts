import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AddCompensationRecordUseCase } from "./application/use-cases/add-compensation-record.use-case";
import { AddEmployeeJobAssignmentUseCase } from "./application/use-cases/add-employee-job-assignment.use-case";
import { AddManagerRelationshipUseCase } from "./application/use-cases/add-manager-relationship.use-case";
import { CreateEmployeeCustomFieldDefinitionUseCase } from "./application/use-cases/create-employee-custom-field-definition.use-case";
import { CreateEmployeeUseCase } from "./application/use-cases/create-employee.use-case";
import { DeleteEmployeeProfileUseCase } from "./application/use-cases/delete-employee-profile.use-case";
import { EmployeeCsvService } from "./application/services/employee-csv.service";
import { EmployeeVisibilityService } from "./application/services/employee-visibility.service";
import { ExportEmployeesCsvUseCase } from "./application/use-cases/export-employees-csv.use-case";
import { GetEmployeeUseCase } from "./application/use-cases/get-employee.use-case";
import { ImportEmployeesCsvUseCase } from "./application/use-cases/import-employees-csv.use-case";
import { ListEmployeesUseCase } from "./application/use-cases/list-employees.use-case";
import { SetEmployeeCustomFieldValueUseCase } from "./application/use-cases/set-employee-custom-field-value.use-case";
import { UpdateEmployeeUseCase } from "./application/use-cases/update-employee.use-case";
import { UpsertEmployeeProfileUseCase } from "./application/use-cases/upsert-employee-profile.use-case";
import { EMPLOYEES_REPOSITORY } from "./domain/ports/employees.repository.port";
import { PrismaEmployeesRepository } from "./infrastructure/persistence/prisma-employees.repository";
import { EmployeesController } from "./presentation/controllers/employees.controller";

@Module({
  imports: [AuditModule],
  controllers: [EmployeesController],
  providers: [
    EmployeeCsvService,
    EmployeeVisibilityService,
    CreateEmployeeUseCase,
    ListEmployeesUseCase,
    GetEmployeeUseCase,
    UpdateEmployeeUseCase,
    AddEmployeeJobAssignmentUseCase,
    AddManagerRelationshipUseCase,
    AddCompensationRecordUseCase,
    CreateEmployeeCustomFieldDefinitionUseCase,
    SetEmployeeCustomFieldValueUseCase,
    UpsertEmployeeProfileUseCase,
    DeleteEmployeeProfileUseCase,
    ExportEmployeesCsvUseCase,
    ImportEmployeesCsvUseCase,
    {
      provide: EMPLOYEES_REPOSITORY,
      useClass: PrismaEmployeesRepository
    }
  ],
  exports: [EMPLOYEES_REPOSITORY]
})
export class EmployeesModule {}
