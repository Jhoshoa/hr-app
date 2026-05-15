import { ConflictException, NotFoundException } from "@nestjs/common";
import { AccessPolicyService } from "../../application/services/access-policy.service";
import type { RoleDetailEntity } from "../../domain/entities/role.entity";
import type { RolesRepository } from "../../domain/ports/roles.repository.port";

const createRole = (overrides: Partial<RoleDetailEntity> = {}): RoleDetailEntity => ({
  id: "role-1",
  tenantId: "tenant-1",
  key: "hr_admin",
  name: "HR Admin",
  description: null,
  isSystemRole: false,
  status: "ACTIVE",
  memberCount: 0,
  permissionCount: 0,
  permissions: [],
  createdAt: new Date("2026-05-15T00:00:00.000Z"),
  updatedAt: new Date("2026-05-15T00:00:00.000Z"),
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

describe("AccessPolicyService", () => {
  it("throws not found for missing roles", () => {
    const service = new AccessPolicyService();

    expect(() => service.assertRoleExists(null)).toThrow(NotFoundException);
  });

  it("blocks owner role modifications", () => {
    const service = new AccessPolicyService();

    expect(() => service.assertRoleIsEditable(createRole({ key: "owner" }))).toThrow(
      ConflictException
    );
  });

  it("blocks archiving roles assigned to active users", async () => {
    const repository = createRolesRepository();
    repository.countActiveMembershipAssignments.mockResolvedValue(1);
    const service = new AccessPolicyService();

    await expect(service.assertRoleCanBeArchived(repository, createRole())).rejects.toThrow(
      ConflictException
    );
  });

  it("requires at least one active owner membership", async () => {
    const repository = createRolesRepository();
    repository.countActiveOwnerMemberships.mockResolvedValue(0);
    const service = new AccessPolicyService();

    await expect(service.assertTenantKeepsOwner(repository, "tenant-1")).rejects.toThrow(
      ConflictException
    );
  });
});

