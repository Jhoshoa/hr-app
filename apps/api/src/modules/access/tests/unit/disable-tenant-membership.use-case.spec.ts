import { ConflictException } from "@nestjs/common";
import { AccessPolicyService } from "../../application/services/access-policy.service";
import { DisableTenantMembershipUseCase } from "../../application/use-cases/disable-tenant-membership.use-case";
import type { TenantUserEntity } from "../../domain/entities/tenant-user.entity";
import type { TenantUsersRepository } from "../../domain/ports/tenant-users.repository.port";
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

describe("DisableTenantMembershipUseCase", () => {
  it("disables tenant membership and audits the action", async () => {
    const repository = createTenantUsersRepository();
    const current = createTenantUser();
    const disabled = createTenantUser({ membershipStatus: "DISABLED" });
    repository.findByMembershipId.mockResolvedValue(current);
    repository.setStatus.mockResolvedValue(disabled);
    const createAuditEventUseCase = {
      execute: jest.fn().mockResolvedValue({ id: "audit-1" })
    } as unknown as jest.Mocked<CreateAuditEventUseCase>;
    const useCase = new DisableTenantMembershipUseCase(
      repository,
      new AccessPolicyService(),
      createAuditEventUseCase
    );

    const result = await useCase.execute({
      tenantId: "tenant-1",
      actorUserId: "admin-user",
      membershipId: "membership-1"
    });

    expect(result).toBe(disabled);
    expect(repository.setStatus).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      membershipId: "membership-1",
      status: "DISABLED"
    });
    expect(createAuditEventUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "membership.disabled",
        resourceId: "membership-1"
      })
    );
  });

  it("blocks self-disable", async () => {
    const repository = createTenantUsersRepository();
    repository.findByMembershipId.mockResolvedValue(createTenantUser());
    const useCase = new DisableTenantMembershipUseCase(
      repository,
      new AccessPolicyService(),
      { execute: jest.fn() } as unknown as CreateAuditEventUseCase
    );

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "target-user",
        membershipId: "membership-1"
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

