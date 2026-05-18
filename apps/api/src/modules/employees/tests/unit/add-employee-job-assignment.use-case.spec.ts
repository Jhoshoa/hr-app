import { BadRequestException } from "@nestjs/common";
import { AddEmployeeJobAssignmentUseCase } from "../../application/use-cases/add-employee-job-assignment.use-case";
import type { EmployeesRepository } from "../../domain/ports/employees.repository.port";
import type { OrganizationUnitsRepository } from "../../../organization/domain/ports/organization-units.repository.port";

const createEmployeesRepository = (): jest.Mocked<EmployeesRepository> => ({
  addCompensationRecord: jest.fn(),
  addJobAssignment: jest.fn(),
  addManagerRelationship: jest.fn(),
  create: jest.fn(),
  createCustomFieldDefinition: jest.fn(),
  deleteProfile: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  list: jest.fn(),
  listDirectReportsByManagerUserId: jest.fn(),
  setCustomFieldValue: jest.fn(),
  update: jest.fn(),
  upsertProfile: jest.fn()
});

const createOrganizationUnitsRepository = (): jest.Mocked<OrganizationUnitsRepository> => ({
  activeLocationExists: jest.fn(),
  countActiveChildren: jest.fn(),
  countActiveUnitsByType: jest.fn(),
  countBlockingAuditEvents: jest.fn(),
  countChildren: jest.fn(),
  countCurrentJobAssignments: jest.fn(),
  countJobAssignmentsByUnit: jest.fn(),
  countUnitsByType: jest.fn(),
  createType: jest.fn(),
  createUnit: jest.fn(),
  deleteType: jest.fn(),
  deleteUnit: jest.fn(),
  findAncestorIds: jest.fn(),
  findTypeById: jest.fn(),
  findTypeByKey: jest.fn(),
  findTypeByName: jest.fn(),
  findUnitByCode: jest.fn(),
  findUnitById: jest.fn(),
  findUnitByKey: jest.fn(),
  findUnitByName: jest.fn(),
  getMaxTypeSortOrder: jest.fn(),
  listTypes: jest.fn(),
  listUnits: jest.fn(),
  reorderTypes: jest.fn(),
  setTypeStatus: jest.fn(),
  setUnitStatus: jest.fn(),
  updateType: jest.fn(),
  updateUnit: jest.fn()
});

describe("AddEmployeeJobAssignmentUseCase", () => {
  it("stores organizationUnitId when the unit is active in the tenant", async () => {
    const employeesRepository = createEmployeesRepository();
    const organizationUnitsRepository = createOrganizationUnitsRepository();
    const createAuditEventUseCase = { execute: jest.fn() };
    const effectiveFrom = new Date("2026-05-18T00:00:00.000Z");

    organizationUnitsRepository.findUnitById.mockResolvedValue({
      id: "unit-1",
      tenantId: "tenant-1",
      typeId: "type-1",
      primaryLocationId: null,
      parentOrganizationUnitId: null,
      key: "santa_cruz",
      name: "Santa Cruz",
      legalName: null,
      code: "SCZ",
      status: "ACTIVE",
      createdAt: effectiveFrom,
      updatedAt: effectiveFrom
    });
    employeesRepository.addJobAssignment.mockResolvedValue({
      id: "assignment-1",
      organizationUnitId: "unit-1",
      effectiveFrom
    });

    const useCase = new AddEmployeeJobAssignmentUseCase(
      employeesRepository,
      organizationUnitsRepository,
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
    const organizationUnitsRepository = createOrganizationUnitsRepository();
    const createAuditEventUseCase = { execute: jest.fn() };

    organizationUnitsRepository.findUnitById.mockResolvedValue(null);

    const useCase = new AddEmployeeJobAssignmentUseCase(
      employeesRepository,
      organizationUnitsRepository,
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
