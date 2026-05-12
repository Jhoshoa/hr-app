import { BadRequestException } from "@nestjs/common";
import { AddManagerRelationshipUseCase } from "../../application/use-cases/add-manager-relationship.use-case";
import type { EmployeesRepository } from "../../domain/ports/employees.repository.port";

const createRepository = (): jest.Mocked<EmployeesRepository> => ({
  create: jest.fn(),
  update: jest.fn(),
  list: jest.fn(),
  findById: jest.fn(),
  addJobAssignment: jest.fn(),
  addManagerRelationship: jest.fn(),
  addCompensationRecord: jest.fn(),
  createCustomFieldDefinition: jest.fn(),
  setCustomFieldValue: jest.fn()
});

describe("AddManagerRelationshipUseCase", () => {
  it("rejects self-manager relationships", async () => {
    const repository = createRepository();
    const useCase = new AddManagerRelationshipUseCase(repository);

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        employeeId: "employee-1",
        managerEmployeeId: "employee-1",
        effectiveFrom: new Date("2026-05-12T00:00:00.000Z")
      })
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.addManagerRelationship).not.toHaveBeenCalled();
  });
});
