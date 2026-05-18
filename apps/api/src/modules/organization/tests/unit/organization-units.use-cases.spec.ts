import { BadRequestException, ConflictException } from "@nestjs/common";
import { ArchiveOrganizationUnitTypeUseCase } from "../../application/use-cases/archive-organization-unit-type.use-case";
import { ArchiveOrganizationUnitUseCase } from "../../application/use-cases/archive-organization-unit.use-case";
import { CreateOrganizationUnitTypeUseCase } from "../../application/use-cases/create-organization-unit-type.use-case";
import { CreateOrganizationUnitUseCase } from "../../application/use-cases/create-organization-unit.use-case";
import { UpdateOrganizationUnitUseCase } from "../../application/use-cases/update-organization-unit.use-case";
import { OrganizationUnitsPolicyService } from "../../application/services/organization-units-policy.service";
import type { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";
import type { OrganizationUnitEntity } from "../../domain/entities/organization-unit.entity";
import type { OrganizationUnitTypeEntity } from "../../domain/entities/organization-unit-type.entity";
import type { OrganizationUnitsRepository } from "../../domain/ports/organization-units.repository.port";

const now = new Date("2026-05-18T12:00:00.000Z");

const typeEntity = (overrides: Partial<OrganizationUnitTypeEntity> = {}): OrganizationUnitTypeEntity => ({
  id: "type-1",
  tenantId: "tenant-1",
  key: "branch",
  name: "Branch",
  sortOrder: 10,
  status: "ACTIVE",
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const unitEntity = (overrides: Partial<OrganizationUnitEntity> = {}): OrganizationUnitEntity => ({
  id: "unit-1",
  tenantId: "tenant-1",
  parentOrganizationUnitId: null,
  typeId: "type-1",
  primaryLocationId: null,
  key: "santa_cruz",
  name: "Santa Cruz",
  legalName: null,
  code: "SCZ",
  status: "ACTIVE",
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const createRepository = (): jest.Mocked<OrganizationUnitsRepository> => ({
  activeLocationExists: jest.fn(),
  countActiveChildren: jest.fn(),
  countActiveUnitsByType: jest.fn(),
  countCurrentJobAssignments: jest.fn(),
  createType: jest.fn(),
  createUnit: jest.fn(),
  findAncestorIds: jest.fn(),
  findTypeById: jest.fn(),
  findTypeByKey: jest.fn(),
  findTypeByName: jest.fn(),
  findUnitByCode: jest.fn(),
  findUnitById: jest.fn(),
  findUnitByKey: jest.fn(),
  findUnitByName: jest.fn(),
  listTypes: jest.fn(),
  listUnits: jest.fn(),
  setTypeStatus: jest.fn(),
  setUnitStatus: jest.fn(),
  updateType: jest.fn(),
  updateUnit: jest.fn()
});

const createAudit = (): jest.Mocked<CreateAuditEventUseCase> =>
  ({
    execute: jest.fn().mockResolvedValue({ id: "audit-1" })
  }) as unknown as jest.Mocked<CreateAuditEventUseCase>;

describe("OrganizationUnit use cases", () => {
  const policy = new OrganizationUnitsPolicyService();

  it("creates tenant-scoped organization unit types", async () => {
    const repository = createRepository();
    repository.findTypeByKey.mockResolvedValue(null);
    repository.findTypeByName.mockResolvedValue(null);
    repository.createType.mockResolvedValue(typeEntity());
    const audit = createAudit();

    const useCase = new CreateOrganizationUnitTypeUseCase(repository, policy, audit);
    const result = await useCase.execute({
      tenantId: "tenant-1",
      actorUserId: "user-1",
      key: "branch",
      name: "Branch",
      sortOrder: 10
    });

    expect(result.key).toBe("branch");
    expect(repository.createType).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      key: "branch",
      name: "Branch",
      sortOrder: 10
    });
    expect(audit.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "organization_unit_type.created",
        actorUserId: "user-1",
        resourceId: "type-1"
      })
    );
  });

  it("rejects duplicate organization unit type keys", async () => {
    const repository = createRepository();
    repository.findTypeByKey.mockResolvedValue(typeEntity());

    const useCase = new CreateOrganizationUnitTypeUseCase(repository, policy, createAudit());

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "user-1",
        key: "branch",
        name: "Branch"
      })
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.createType).not.toHaveBeenCalled();
  });

  it("blocks archiving organization unit types used by active units", async () => {
    const repository = createRepository();
    repository.findTypeById.mockResolvedValue(typeEntity());
    repository.countActiveUnitsByType.mockResolvedValue(1);

    const useCase = new ArchiveOrganizationUnitTypeUseCase(repository, policy, createAudit());

    await expect(useCase.execute("tenant-1", "type-1", "user-1")).rejects.toBeInstanceOf(ConflictException);
    expect(repository.setTypeStatus).not.toHaveBeenCalled();
  });

  it("creates organization units with active type, parent, and primary location", async () => {
    const repository = createRepository();
    repository.findTypeById.mockResolvedValue(typeEntity());
    repository.findUnitById.mockResolvedValue(unitEntity({ id: "parent-1" }));
    repository.activeLocationExists.mockResolvedValue(true);
    repository.findUnitByName.mockResolvedValue(null);
    repository.findUnitByKey.mockResolvedValue(null);
    repository.findUnitByCode.mockResolvedValue(null);
    repository.createUnit.mockResolvedValue(unitEntity({ parentOrganizationUnitId: "parent-1" }));
    const audit = createAudit();

    const useCase = new CreateOrganizationUnitUseCase(repository, policy, audit);
    const result = await useCase.execute({
      tenantId: "tenant-1",
      actorUserId: "user-1",
      typeId: "type-1",
      parentOrganizationUnitId: "parent-1",
      primaryLocationId: "location-1",
      key: "santa_cruz",
      name: "Santa Cruz",
      code: "SCZ"
    });

    expect(result.parentOrganizationUnitId).toBe("parent-1");
    expect(repository.createUnit).toHaveBeenCalled();
    expect(audit.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "organization_unit.created",
        actorUserId: "user-1",
        resourceId: "unit-1"
      })
    );
  });

  it("rejects organization units with a primary location outside the tenant", async () => {
    const repository = createRepository();
    repository.findTypeById.mockResolvedValue(typeEntity());
    repository.activeLocationExists.mockResolvedValue(false);

    const useCase = new CreateOrganizationUnitUseCase(repository, policy, createAudit());

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "user-1",
        typeId: "type-1",
        primaryLocationId: "location-other",
        name: "Santa Cruz"
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.createUnit).not.toHaveBeenCalled();
  });

  it("rejects hierarchy cycles when updating organization units", async () => {
    const repository = createRepository();
    repository.findUnitById
      .mockResolvedValueOnce(unitEntity({ id: "unit-1" }))
      .mockResolvedValueOnce(unitEntity({ id: "child-1" }));
    repository.findAncestorIds.mockResolvedValue(["unit-1"]);

    const useCase = new UpdateOrganizationUnitUseCase(repository, policy, createAudit());

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "user-1",
        unitId: "unit-1",
        parentOrganizationUnitId: "child-1"
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.updateUnit).not.toHaveBeenCalled();
  });

  it("blocks archiving organization units with active children", async () => {
    const repository = createRepository();
    repository.findUnitById.mockResolvedValue(unitEntity());
    repository.countActiveChildren.mockResolvedValue(1);

    const useCase = new ArchiveOrganizationUnitUseCase(repository, policy, createAudit());

    await expect(useCase.execute("tenant-1", "unit-1", "user-1")).rejects.toBeInstanceOf(ConflictException);
    expect(repository.setUnitStatus).not.toHaveBeenCalled();
  });

  it("blocks archiving organization units used by current job assignments", async () => {
    const repository = createRepository();
    repository.findUnitById.mockResolvedValue(unitEntity());
    repository.countActiveChildren.mockResolvedValue(0);
    repository.countCurrentJobAssignments.mockResolvedValue(1);

    const useCase = new ArchiveOrganizationUnitUseCase(repository, policy, createAudit());

    await expect(useCase.execute("tenant-1", "unit-1", "user-1")).rejects.toBeInstanceOf(ConflictException);
    expect(repository.setUnitStatus).not.toHaveBeenCalled();
  });
});
