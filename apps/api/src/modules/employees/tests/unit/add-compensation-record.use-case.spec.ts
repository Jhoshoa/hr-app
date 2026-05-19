import { BadRequestException } from "@nestjs/common";
import { AddCompensationRecordUseCase } from "../../application/use-cases/add-compensation-record.use-case";
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

describe("AddCompensationRecordUseCase", () => {
  it("rejects compensation records for employees outside the tenant", async () => {
    const repository = createRepository();
    const createAuditEventUseCase = { execute: jest.fn() };
    repository.existsById.mockResolvedValue(false);

    const useCase = new AddCompensationRecordUseCase(repository, createAuditEventUseCase as never);

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "user-1",
        employeeId: "employee-other",
        amount: "1000.00",
        currency: "USD",
        frequency: "MONTHLY",
        visibility: "HR_ONLY",
        effectiveFrom: new Date("2026-05-18T00:00:00.000Z")
      })
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.addCompensationRecord).not.toHaveBeenCalled();
    expect(createAuditEventUseCase.execute).not.toHaveBeenCalled();
  });
});
