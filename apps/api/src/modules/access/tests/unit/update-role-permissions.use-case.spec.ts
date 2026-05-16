import { ConflictException } from "@nestjs/common";
import { AccessPolicyService } from "../../application/services/access-policy.service";
import type { PermissionValidationService } from "../../application/services/permission-validation.service";
import { UpdateRolePermissionsUseCase } from "../../application/use-cases/update-role-permissions.use-case";
import type { RoleDetailEntity } from "../../domain/entities/role.entity";
import type { RolesRepository } from "../../domain/ports/roles.repository.port";
import type { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

const createRole = (overrides: Partial<RoleDetailEntity> = {}): RoleDetailEntity => ({
  id: "role-1",
  tenantId: "tenant-1",
  key: "hr_admin",
  name: "HR Admin",
  description: null,
  isSystemRole: false,
  status: "ACTIVE",
  memberCount: 0,
  permissionCount: 1,
  permissions: [
    {
      id: "permission-1",
      key: "tenant.read",
      description: "Read tenant",
      module: "Tenant",
      action: "Read",
      sortOrder: 10,
      isCritical: false,
      createdAt: new Date("2026-05-15T00:00:00.000Z")
    }
  ],
  createdAt: new Date("2026-05-15T00:00:00.000Z"),
  updatedAt: new Date("2026-05-15T00:00:00.000Z"),
  ...overrides
});

const createRolesRepository = (): jest.Mocked<RolesRepository> => ({
  countActiveMembershipAssignments: jest.fn(),
  countActiveOwnerMemberships: jest.fn().mockResolvedValue(1),
  create: jest.fn(),
  findActiveIdsByTenant: jest.fn(),
  findById: jest.fn(),
  findByKey: jest.fn(),
  list: jest.fn(),
  replacePermissions: jest.fn(),
  setStatus: jest.fn(),
  update: jest.fn()
});

describe("UpdateRolePermissionsUseCase", () => {
  it("replaces custom role permissions and audits the before and after permissions", async () => {
    const repository = createRolesRepository();
    const current = createRole();
    const updated = createRole({
      permissions: [
        {
          id: "permission-2",
          key: "users.read",
          description: "Read users",
          module: "Users",
          action: "Read",
          sortOrder: 20,
          isCritical: false,
          createdAt: new Date("2026-05-15T00:00:00.000Z")
        }
      ]
    });
    repository.findById.mockResolvedValue(current);
    repository.replacePermissions.mockResolvedValue(updated);
    const permissionValidationService = {
      assertPermissionIdsExist: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<PermissionValidationService>;
    const createAuditEventUseCase = {
      execute: jest.fn().mockResolvedValue({ id: "audit-1" })
    } as unknown as jest.Mocked<CreateAuditEventUseCase>;
    const useCase = new UpdateRolePermissionsUseCase(
      repository,
      new AccessPolicyService(),
      permissionValidationService,
      createAuditEventUseCase
    );

    const result = await useCase.execute({
      tenantId: "tenant-1",
      actorUserId: "user-1",
      roleId: "role-1",
      permissionIds: ["permission-2", "permission-2"]
    });

    expect(result).toBe(updated);
    expect(repository.replacePermissions).toHaveBeenCalledWith("tenant-1", "role-1", [
      "permission-2"
    ]);
    expect(createAuditEventUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "role.permissions_updated",
        metadata: expect.objectContaining({
          before: ["tenant.read"],
          after: ["users.read"],
          permissionIds: ["permission-2"]
        })
      })
    );
  });

  it("blocks system role permission changes", async () => {
    const repository = createRolesRepository();
    repository.findById.mockResolvedValue(createRole({ isSystemRole: true }));
    const permissionValidationService = {
      assertPermissionIdsExist: jest.fn()
    } as unknown as jest.Mocked<PermissionValidationService>;
    const useCase = new UpdateRolePermissionsUseCase(
      repository,
      new AccessPolicyService(),
      permissionValidationService,
      { execute: jest.fn() } as unknown as CreateAuditEventUseCase
    );

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "user-1",
        roleId: "role-1",
        permissionIds: []
      })
    ).rejects.toBeInstanceOf(ConflictException);
    expect(permissionValidationService.assertPermissionIdsExist).not.toHaveBeenCalled();
    expect(repository.replacePermissions).not.toHaveBeenCalled();
  });
});
