import { ConflictException } from "@nestjs/common";
import { AccessPolicyService } from "../../application/services/access-policy.service";
import { InvitationTokenService } from "../../application/services/invitation-token.service";
import { CreateTenantInvitationUseCase } from "../../application/use-cases/create-tenant-invitation.use-case";
import type { TenantInvitationEntity } from "../../domain/entities/tenant-invitation.entity";
import type { TenantInvitationsRepository } from "../../domain/ports/tenant-invitations.repository.port";
import type { RolesRepository } from "../../domain/ports/roles.repository.port";
import type { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";

const createdAt = new Date("2026-05-15T00:00:00.000Z");

const createInvitation = (
  overrides: Partial<TenantInvitationEntity> = {}
): TenantInvitationEntity => ({
  id: "invitation-1",
  tenantId: "tenant-1",
  email: "new@example.com",
  membershipId: "membership-1",
  status: "PENDING",
  invitedByUserId: "admin-user",
  acceptedByUserId: null,
  expiresAt: new Date("2026-05-22T00:00:00.000Z"),
  resendCount: 0,
  lastSentAt: createdAt,
  acceptedAt: null,
  cancelledAt: null,
  createdAt,
  updatedAt: createdAt,
  roles: [
    {
      id: "role-1",
      key: "employee",
      name: "Employee",
      isSystemRole: true,
      status: "ACTIVE"
    }
  ],
  ...overrides
});

const createInvitationsRepository = (): jest.Mocked<TenantInvitationsRepository> => ({
  accept: jest.fn(),
  cancel: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByTokenHash: jest.fn(),
  findMembershipStatusByEmail: jest.fn(),
  findPendingByEmail: jest.fn(),
  list: jest.fn(),
  markExpired: jest.fn(),
  resend: jest.fn()
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

describe("CreateTenantInvitationUseCase", () => {
  it("creates a pending invitation with a hashed token and audits the action", async () => {
    const invitationsRepository = createInvitationsRepository();
    const rolesRepository = createRolesRepository();
    const invitation = createInvitation();
    invitationsRepository.findMembershipStatusByEmail.mockResolvedValue(null);
    invitationsRepository.findPendingByEmail.mockResolvedValue(null);
    invitationsRepository.create.mockResolvedValue(invitation);
    rolesRepository.findActiveIdsByTenant.mockResolvedValue(["role-1"]);
    const tokenService = new InvitationTokenService();
    jest.spyOn(tokenService, "createToken").mockReturnValue("plain-token");
    const createAuditEventUseCase = {
      execute: jest.fn().mockResolvedValue({ id: "audit-1" })
    } as unknown as jest.Mocked<CreateAuditEventUseCase>;
    const useCase = new CreateTenantInvitationUseCase(
      invitationsRepository,
      rolesRepository,
      new AccessPolicyService(),
      tokenService,
      createAuditEventUseCase
    );

    const result = await useCase.execute({
      tenantId: "tenant-1",
      actorUserId: "admin-user",
      email: " New@Example.com ",
      roleIds: ["role-1", "role-1"]
    });

    expect(result.acceptanceToken).toBe("plain-token");
    expect(invitationsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        email: "new@example.com",
        roleIds: ["role-1"],
        tokenHash: tokenService.hashToken("plain-token")
      })
    );
    expect(createAuditEventUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "invitation.created",
        resourceId: "invitation-1"
      })
    );
  });

  it("rejects invitations for active tenant members", async () => {
    const invitationsRepository = createInvitationsRepository();
    const rolesRepository = createRolesRepository();
    invitationsRepository.findMembershipStatusByEmail.mockResolvedValue("ACTIVE");
    rolesRepository.findActiveIdsByTenant.mockResolvedValue(["role-1"]);
    const useCase = new CreateTenantInvitationUseCase(
      invitationsRepository,
      rolesRepository,
      new AccessPolicyService(),
      new InvitationTokenService(),
      { execute: jest.fn() } as unknown as CreateAuditEventUseCase
    );

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "admin-user",
        email: "active@example.com",
        roleIds: ["role-1"]
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
