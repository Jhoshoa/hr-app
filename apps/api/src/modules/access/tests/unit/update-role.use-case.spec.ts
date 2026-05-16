import { ConflictException } from "@nestjs/common";
import { AccessPolicyService } from "../../application/services/access-policy.service";
import { UpdateRoleUseCase } from "../../application/use-cases/update-role.use-case";
import type { RoleDetailEntity } from "../../domain/entities/role.entity";
import type { RolesRepository } from "../../domain/ports/roles.repository.port";
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

describe("UpdateRoleUseCase", () => {
  it("updates custom role metadata and audits the change", async () => {
    const repository = createRolesRepository();
    const current = createRole();
    const updated = createRole({
      name: "Payroll Lead",
      description: "Leads payroll review"
    });
    repository.findById.mockResolvedValue(current);
    repository.update.mockResolvedValue(updated);
    const createAuditEventUseCase = {
      execute: jest.fn().mockResolvedValue({ id: "audit-1" })
    } as unknown as jest.Mocked<CreateAuditEventUseCase>;
    const useCase = new UpdateRoleUseCase(
      repository,
      new AccessPolicyService(),
      createAuditEventUseCase
    );

    const result = await useCase.execute({
      tenantId: "tenant-1",
      actorUserId: "user-1",
      roleId: "role-1",
      name: " Payroll Lead ",
      description: " Leads payroll review "
    });

    expect(result).toBe(updated);
    expect(repository.update).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      roleId: "role-1",
      name: "Payroll Lead",
      description: "Leads payroll review"
    });
    expect(createAuditEventUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "role.updated",
        resourceId: "role-1"
      })
    );
  });

  it("blocks system role metadata changes", async () => {
    const repository = createRolesRepository();
    repository.findById.mockResolvedValue(createRole({ isSystemRole: true }));
    const createAuditEventUseCase = {
      execute: jest.fn()
    } as unknown as jest.Mocked<CreateAuditEventUseCase>;
    const useCase = new UpdateRoleUseCase(
      repository,
      new AccessPolicyService(),
      createAuditEventUseCase
    );

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "user-1",
        roleId: "role-1",
        name: "Edited"
      })
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.update).not.toHaveBeenCalled();
    expect(createAuditEventUseCase.execute).not.toHaveBeenCalled();
  });
});
