import { Module } from "@nestjs/common";
import { AddCompensationRecordUseCase } from "./application/use-cases/add-compensation-record.use-case";
import { AddEmployeeJobAssignmentUseCase } from "./application/use-cases/add-employee-job-assignment.use-case";
import { AddManagerRelationshipUseCase } from "./application/use-cases/add-manager-relationship.use-case";
import { CreateEmployeeCustomFieldDefinitionUseCase } from "./application/use-cases/create-employee-custom-field-definition.use-case";
import { CreateEmployeeUseCase } from "./application/use-cases/create-employee.use-case";
import { GetEmployeeUseCase } from "./application/use-cases/get-employee.use-case";
import { ListEmployeesUseCase } from "./application/use-cases/list-employees.use-case";
import { SetEmployeeCustomFieldValueUseCase } from "./application/use-cases/set-employee-custom-field-value.use-case";
import { UpdateEmployeeUseCase } from "./application/use-cases/update-employee.use-case";
import { EMPLOYEES_REPOSITORY } from "./domain/ports/employees.repository.port";
import { PrismaEmployeesRepository } from "./infrastructure/persistence/prisma-employees.repository";
import { EmployeesController } from "./presentation/controllers/employees.controller";

@Module({
  controllers: [EmployeesController],
  providers: [
    CreateEmployeeUseCase,
    ListEmployeesUseCase,
    GetEmployeeUseCase,
    UpdateEmployeeUseCase,
    AddEmployeeJobAssignmentUseCase,
    AddManagerRelationshipUseCase,
    AddCompensationRecordUseCase,
    CreateEmployeeCustomFieldDefinitionUseCase,
    SetEmployeeCustomFieldValueUseCase,
    {
      provide: EMPLOYEES_REPOSITORY,
      useClass: PrismaEmployeesRepository
    }
  ],
  exports: [EMPLOYEES_REPOSITORY]
})
export class EmployeesModule {}
