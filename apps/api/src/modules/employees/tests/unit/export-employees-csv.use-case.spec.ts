import { ExportEmployeesCsvUseCase } from "../../application/use-cases/export-employees-csv.use-case";
import { EmployeeCsvService } from "../../application/services/employee-csv.service";
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

describe("ExportEmployeesCsvUseCase", () => {
  it("audits employee exports with the acting user", async () => {
    const repository = createRepository();
    const createAuditEventUseCase = { execute: jest.fn() };
    const createdAt = new Date("2026-05-18T00:00:00.000Z");

    repository.list.mockResolvedValue([
      {
        id: "employee-1",
        tenantId: "tenant-1",
        userId: null,
        employeeNumber: "E-001",
        status: "ACTIVE",
        firstName: "Ada",
        lastName: "Lovelace",
        workEmail: "ada@example.com",
        personalEmail: null,
        startDate: createdAt,
        terminationDate: null,
        createdAt,
        updatedAt: createdAt,
        profile: null,
        jobAssignments: [],
        managerRelationships: [],
        compensation: [],
        customFieldValues: []
      }
    ]);

    const useCase = new ExportEmployeesCsvUseCase(
      repository,
      new EmployeeCsvService(),
      createAuditEventUseCase as never
    );

    const csv = await useCase.execute({
      tenantId: "tenant-1",
      actorUserId: "user-1",
      filters: { status: "ACTIVE" }
    });

    expect(csv).toContain("E-001");
    expect(createAuditEventUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "employee.exported",
        actorUserId: "user-1",
        metadata: expect.objectContaining({ rowCount: 1 })
      })
    );
  });
});
