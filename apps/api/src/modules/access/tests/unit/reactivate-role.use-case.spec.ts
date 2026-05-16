import { ConflictException } from "@nestjs/common";
import { AccessPolicyService } from "../../application/services/access-policy.service";
import { ReactivateRoleUseCase } from "../../application/use-cases/reactivate-role.use-case";
import type { RoleDetailEntity } from "../../domain/entities/role.entity";
import type { RolesRepository } from "../../domain/ports/roles.repository.port";
import type { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

const createdAt = new Date("2026-05-15T00:00:00.000Z");

const createRole = (overrides: Partial<RoleDetailEntity> = {}): RoleDetailEntity => ({
  id: "role-1",
  tenantId: "tenant-1",
  key: "payroll_admin",
  name: "Payroll Admin",
  description: null,
  isSystemRole: false,
  status: "ARCHIVED",
  memberCount: 0,
  permissionCount: 0,
  permissions: [],
  createdAt,
  updatedAt: createdAt,
  ...overrides
});

const createRolesRepository = (): jest.Mocked<RolesRepository> => ({
  countActiveMembershipAssignments: jest.fn(),
  countActiveOwnerMemberships: jest.fn(),
  create: jest.fn(),
  findActiveIdsByTenant: jest.fn(),
  findById: jest.fn(),
  findByKey: jest.fn(),
  list: jest.fn(),
  replacePermissions: jest.fn(),
  setStatus: jest.fn(),
  update: jest.fn()
});

describe("ReactivateRoleUseCase", () => {
  it("reactivates custom roles and audits the change", async () => {
    const repository = createRolesRepository();
    const current = createRole();
    const active = createRole({ status: "ACTIVE" });
    repository.findById.mockResolvedValue(current);
    repository.setStatus.mockResolvedValue(active);
    const createAuditEventUseCase = {
      execute: jest.fn().mockResolvedValue({ id: "audit-1" })
    } as unknown as jest.Mocked<CreateAuditEventUseCase>;
    const useCase = new ReactivateRoleUseCase(
      repository,
      new AccessPolicyService(),
      createAuditEventUseCase
    );

    const result = await useCase.execute({
      tenantId: "tenant-1",
      actorUserId: "user-1",
      roleId: "role-1"
    });

    expect(result).toBe(active);
    expect(repository.setStatus).toHaveBeenCalledWith("tenant-1", "role-1", "ACTIVE");
    expect(createAuditEventUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "role.reactivated",
        resourceId: "role-1"
      })
    );
  });

  it("blocks system role reactivate attempts", async () => {
    const repository = createRolesRepository();
    repository.findById.mockResolvedValue(createRole({ isSystemRole: true }));
    const createAuditEventUseCase = {
      execute: jest.fn()
    } as unknown as jest.Mocked<CreateAuditEventUseCase>;
    const useCase = new ReactivateRoleUseCase(
      repository,
      new AccessPolicyService(),
      createAuditEventUseCase
    );

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "user-1",
        roleId: "role-1"
      })
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.setStatus).not.toHaveBeenCalled();
    expect(createAuditEventUseCase.execute).not.toHaveBeenCalled();
  });
});
