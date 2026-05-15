import { BadRequestException, ConflictException } from "@nestjs/common";
import { CreateRoleUseCase } from "../../application/use-cases/create-role.use-case";
import type { RoleDetailEntity } from "../../domain/entities/role.entity";
import type { RolesRepository } from "../../domain/ports/roles.repository.port";
import type { PermissionValidationService } from "../../application/services/permission-validation.service";
import type { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

const createdAt = new Date("2026-05-15T00:00:00.000Z");

const createRole = (overrides: Partial<RoleDetailEntity> = {}): RoleDetailEntity => ({
  id: "role-1",
  tenantId: "tenant-1",
  key: "payroll_admin",
  name: "Payroll Admin",
  description: "Payroll access",
  isSystemRole: false,
  status: "ACTIVE",
  memberCount: 0,
  permissionCount: 1,
  permissions: [],
  createdAt,
  updatedAt: createdAt,
  ...overrides
});

const createRolesRepository = (): jest.Mocked<RolesRepository> => ({
  countActiveMembershipAssignments: jest.fn(),
  countActiveOwnerMemberships: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByKey: jest.fn(),
  list: jest.fn(),
  replacePermissions: jest.fn(),
  setStatus: jest.fn(),
  update: jest.fn()
});

describe("CreateRoleUseCase", () => {
  it("normalizes role keys, validates permissions, creates role, and audits", async () => {
    const repository = createRolesRepository();
    const role = createRole();
    repository.findByKey.mockResolvedValue(null);
    repository.create.mockResolvedValue(role);
    const permissionValidationService = {
      assertPermissionIdsExist: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<PermissionValidationService>;
    const createAuditEventUseCase = {
      execute: jest.fn().mockResolvedValue({ id: "audit-1" })
    } as unknown as jest.Mocked<CreateAuditEventUseCase>;
    const useCase = new CreateRoleUseCase(
      repository,
      permissionValidationService,
      createAuditEventUseCase
    );

    const result = await useCase.execute({
      tenantId: "tenant-1",
      actorUserId: "user-1",
      key: "Payroll Admin",
      name: "Payroll Admin",
      description: " Payroll access ",
      permissionIds: ["permission-1", "permission-1"]
    });

    expect(result).toBe(role);
    expect(permissionValidationService.assertPermissionIdsExist).toHaveBeenCalledWith([
      "permission-1"
    ]);
    expect(repository.create).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      key: "payroll_admin",
      name: "Payroll Admin",
      description: "Payroll access",
      permissionIds: ["permission-1"]
    });
    expect(createAuditEventUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "role.created",
        tenantId: "tenant-1",
        actorUserId: "user-1",
        resourceId: "role-1"
      })
    );
  });

  it("rejects invalid role keys", async () => {
    const useCase = new CreateRoleUseCase(
      createRolesRepository(),
      { assertPermissionIdsExist: jest.fn() } as unknown as PermissionValidationService,
      { execute: jest.fn() } as unknown as CreateAuditEventUseCase
    );

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "user-1",
        key: "1 invalid",
        name: "Invalid"
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects duplicate role keys", async () => {
    const repository = createRolesRepository();
    repository.findByKey.mockResolvedValue(createRole());
    const useCase = new CreateRoleUseCase(
      repository,
      { assertPermissionIdsExist: jest.fn() } as unknown as PermissionValidationService,
      { execute: jest.fn() } as unknown as CreateAuditEventUseCase
    );

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "user-1",
        key: "payroll_admin",
        name: "Payroll Admin"
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

