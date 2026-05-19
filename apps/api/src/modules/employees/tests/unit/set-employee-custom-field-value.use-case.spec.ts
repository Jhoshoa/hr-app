import { BadRequestException } from "@nestjs/common";
import { SetEmployeeCustomFieldValueUseCase } from "../../application/use-cases/set-employee-custom-field-value.use-case";
import type { EmployeesRepository } from "../../domain/ports/employees.repository.port";

const createRepository = (): jest.Mocked<EmployeesRepository> => ({
  addCompensationRecord: jest.fn(),
  addJobAssignment: jest.fn(),
  addManagerRelationship: jest.fn(),
  create: jest.fn(),
  createCustomFieldDefinition: jest.fn(),
  customFieldDefinitionExists: jest.fn(),
  deleteProfile: jest.fn(),
  existsById: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  findInvalidJobAssignmentReferences: jest.fn(),
  list: jest.fn(),
  listDirectReportsByManagerUserId: jest.fn(),
  setCustomFieldValue: jest.fn(),
  update: jest.fn(),
  upsertProfile: jest.fn()
});

describe("SetEmployeeCustomFieldValueUseCase", () => {
  it("rejects custom field values when employee or field definition is outside the tenant", async () => {
    const repository = createRepository();
    const createAuditEventUseCase = { execute: jest.fn() };
    repository.existsById.mockResolvedValue(true);
    repository.customFieldDefinitionExists.mockResolvedValue(false);

    const useCase = new SetEmployeeCustomFieldValueUseCase(
      repository,
      createAuditEventUseCase as never
    );

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "user-1",
        employeeId: "employee-1",
        fieldDefinitionId: "field-other",
        value: "Senior"
      })
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.setCustomFieldValue).not.toHaveBeenCalled();
    expect(createAuditEventUseCase.execute).not.toHaveBeenCalled();
  });
});
