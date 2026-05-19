import { BadRequestException } from "@nestjs/common";
import { AddManagerRelationshipUseCase } from "../../application/use-cases/add-manager-relationship.use-case";
import type { EmployeesRepository } from "../../domain/ports/employees.repository.port";

const createRepository = (): jest.Mocked<EmployeesRepository> => ({
  create: jest.fn(),
  update: jest.fn(),
  upsertProfile: jest.fn(),
  deleteProfile: jest.fn(),
  list: jest.fn(),
  listDirectReportsByManagerUserId: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  addJobAssignment: jest.fn(),
  addManagerRelationship: jest.fn(),
  addCompensationRecord: jest.fn(),
  createCustomFieldDefinition: jest.fn(),
  customFieldDefinitionExists: jest.fn(),
  existsById: jest.fn(),
  findInvalidJobAssignmentReferences: jest.fn(),
  setCustomFieldValue: jest.fn()
});

describe("AddManagerRelationshipUseCase", () => {
  it("rejects self-manager relationships", async () => {
    const repository = createRepository();
    const createAuditEventUseCase = { execute: jest.fn() };
    const useCase = new AddManagerRelationshipUseCase(repository, createAuditEventUseCase as never);

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "user-1",
        employeeId: "employee-1",
        managerEmployeeId: "employee-1",
        effectiveFrom: new Date("2026-05-12T00:00:00.000Z")
      })
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.addManagerRelationship).not.toHaveBeenCalled();
  });

  it("rejects manager relationships outside the tenant", async () => {
    const repository = createRepository();
    const createAuditEventUseCase = { execute: jest.fn() };
    repository.existsById.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const useCase = new AddManagerRelationshipUseCase(repository, createAuditEventUseCase as never);

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "user-1",
        employeeId: "employee-1",
        managerEmployeeId: "employee-other",
        effectiveFrom: new Date("2026-05-12T00:00:00.000Z")
      })
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.addManagerRelationship).not.toHaveBeenCalled();
  });
});
