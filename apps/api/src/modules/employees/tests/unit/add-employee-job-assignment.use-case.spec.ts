import { BadRequestException } from "@nestjs/common";
import { AddEmployeeJobAssignmentUseCase } from "../../application/use-cases/add-employee-job-assignment.use-case";
import type { EmployeesRepository } from "../../domain/ports/employees.repository.port";

const createEmployeesRepository = (): jest.Mocked<EmployeesRepository> => ({
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

describe("AddEmployeeJobAssignmentUseCase", () => {
  it("stores organizationUnitId when the unit is active in the tenant", async () => {
    const employeesRepository = createEmployeesRepository();
    const createAuditEventUseCase = { execute: jest.fn() };
    const effectiveFrom = new Date("2026-05-18T00:00:00.000Z");

    employeesRepository.findInvalidJobAssignmentReferences.mockResolvedValue([]);
    employeesRepository.addJobAssignment.mockResolvedValue({
      id: "assignment-1",
      organizationUnitId: "unit-1",
      effectiveFrom
    });

    const useCase = new AddEmployeeJobAssignmentUseCase(
      employeesRepository,
      createAuditEventUseCase as never
    );
    const result = await useCase.execute({
      tenantId: "tenant-1",
      actorUserId: "user-1",
      employeeId: "employee-1",
      organizationUnitId: "unit-1",
      effectiveFrom
    });

    expect(result.organizationUnitId).toBe("unit-1");
    expect(employeesRepository.addJobAssignment).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      actorUserId: "user-1",
      employeeId: "employee-1",
      organizationUnitId: "unit-1",
      effectiveFrom
    });
    expect(createAuditEventUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "employee.job_assignment.organization_unit_set",
        actorUserId: "user-1",
        resourceId: "employee-1",
        metadata: expect.objectContaining({
          assignmentId: "assignment-1",
          organizationUnitId: "unit-1"
        })
      })
    );
  });

  it("rejects inactive or cross-tenant organization units", async () => {
    const employeesRepository = createEmployeesRepository();
    const createAuditEventUseCase = { execute: jest.fn() };

    employeesRepository.findInvalidJobAssignmentReferences.mockResolvedValue(["organizationUnitId"]);

    const useCase = new AddEmployeeJobAssignmentUseCase(
      employeesRepository,
      createAuditEventUseCase as never
    );

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "user-1",
        employeeId: "employee-1",
        organizationUnitId: "unit-other",
        effectiveFrom: new Date("2026-05-18T00:00:00.000Z")
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(employeesRepository.addJobAssignment).not.toHaveBeenCalled();
  });
});
