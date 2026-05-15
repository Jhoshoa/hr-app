import { BadRequestException, ConflictException } from "@nestjs/common";
import { AccessPolicyService } from "../../application/services/access-policy.service";
import { UpdateTenantUserRolesUseCase } from "../../application/use-cases/update-tenant-user-roles.use-case";
import type { RolesRepository } from "../../domain/ports/roles.repository.port";
import type { TenantUsersRepository } from "../../domain/ports/tenant-users.repository.port";
import type { TenantUserEntity } from "../../domain/entities/tenant-user.entity";
import type { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

const createdAt = new Date("2026-05-15T00:00:00.000Z");

const createTenantUser = (overrides: Partial<TenantUserEntity> = {}): TenantUserEntity => ({
  membershipId: "membership-1",
  userId: "target-user",
  email: "target@example.com",
  name: "Target User",
  userStatus: "ACTIVE",
  membershipStatus: "ACTIVE",
  roles: [
    {
      id: "role-1",
      key: "employee",
      name: "Employee",
      isSystemRole: true,
      status: "ACTIVE"
    }
  ],
  effectivePermissions: ["tenant.read"],
  invitedAt: createdAt,
  joinedAt: createdAt,
  createdAt,
  updatedAt: createdAt,
  ...overrides
});

const createTenantUsersRepository = (): jest.Mocked<TenantUsersRepository> => ({
  findByMembershipId: jest.fn(),
  findMembershipWithPermissions: jest.fn(),
  list: jest.fn(),
  replaceRoles: jest.fn(),
  setStatus: jest.fn()
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

describe("UpdateTenantUserRolesUseCase", () => {
  it("replaces membership roles and audits before and after roles", async () => {
    const tenantUsersRepository = createTenantUsersRepository();
    const rolesRepository = createRolesRepository();
    const current = createTenantUser();
    const updated = createTenantUser({
      roles: [
        {
          id: "role-2",
          key: "manager",
          name: "Manager",
          isSystemRole: true,
          status: "ACTIVE"
        }
      ]
    });
    tenantUsersRepository.findByMembershipId.mockResolvedValue(current);
    tenantUsersRepository.replaceRoles.mockResolvedValue(updated);
    rolesRepository.findActiveIdsByTenant.mockResolvedValue(["role-2"]);
    const createAuditEventUseCase = {
      execute: jest.fn().mockResolvedValue({ id: "audit-1" })
    } as unknown as jest.Mocked<CreateAuditEventUseCase>;
    const useCase = new UpdateTenantUserRolesUseCase(
      tenantUsersRepository,
      rolesRepository,
      new AccessPolicyService(),
      createAuditEventUseCase
    );

    const result = await useCase.execute({
      tenantId: "tenant-1",
      actorUserId: "admin-user",
      membershipId: "membership-1",
      roleIds: ["role-2", "role-2"]
    });

    expect(result).toBe(updated);
    expect(tenantUsersRepository.replaceRoles).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      membershipId: "membership-1",
      roleIds: ["role-2"]
    });
    expect(createAuditEventUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "membership.roles_updated",
        resourceId: "membership-1",
        metadata: expect.objectContaining({
          before: ["employee"],
          after: ["manager"],
          targetUserId: "target-user"
        })
      })
    );
  });

  it("rejects invalid role ids", async () => {
    const tenantUsersRepository = createTenantUsersRepository();
    const rolesRepository = createRolesRepository();
    tenantUsersRepository.findByMembershipId.mockResolvedValue(createTenantUser());
    rolesRepository.findActiveIdsByTenant.mockResolvedValue([]);
    const useCase = new UpdateTenantUserRolesUseCase(
      tenantUsersRepository,
      rolesRepository,
      new AccessPolicyService(),
      { execute: jest.fn() } as unknown as CreateAuditEventUseCase
    );

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "admin-user",
        membershipId: "membership-1",
        roleIds: ["missing-role"]
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("blocks self access changes without a stronger confirmation flow", async () => {
    const tenantUsersRepository = createTenantUsersRepository();
    tenantUsersRepository.findByMembershipId.mockResolvedValue(createTenantUser());
    const useCase = new UpdateTenantUserRolesUseCase(
      tenantUsersRepository,
      createRolesRepository(),
      new AccessPolicyService(),
      { execute: jest.fn() } as unknown as CreateAuditEventUseCase
    );

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "target-user",
        membershipId: "membership-1",
        roleIds: ["role-2"]
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

