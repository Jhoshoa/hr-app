import { ConflictException } from "@nestjs/common";
import { AccessPolicyService } from "../../application/services/access-policy.service";
import { InvitationTokenService } from "../../application/services/invitation-token.service";
import { ResendTenantInvitationUseCase } from "../../application/use-cases/resend-tenant-invitation.use-case";
import type { TenantInvitationEntity } from "../../domain/entities/tenant-invitation.entity";
import type { TenantInvitationsRepository } from "../../domain/ports/tenant-invitations.repository.port";
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
  expiresAt: new Date(Date.now() + 60_000),
  resendCount: 0,
  lastSentAt: createdAt,
  acceptedAt: null,
  cancelledAt: null,
  createdAt,
  updatedAt: createdAt,
  roles: [],
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

describe("ResendTenantInvitationUseCase", () => {
  it("rotates invitation token and audits resend", async () => {
    const repository = createInvitationsRepository();
    const tokenService = new InvitationTokenService();
    const current = createInvitation();
    const resent = createInvitation({ resendCount: 1, lastSentAt: new Date() });
    repository.findById.mockResolvedValue(current);
    repository.resend.mockResolvedValue(resent);
    jest.spyOn(tokenService, "createToken").mockReturnValue("new-token");
    const createAuditEventUseCase = {
      execute: jest.fn().mockResolvedValue({ id: "audit-1" })
    } as unknown as jest.Mocked<CreateAuditEventUseCase>;
    const useCase = new ResendTenantInvitationUseCase(
      repository,
      new AccessPolicyService(),
      tokenService,
      createAuditEventUseCase
    );

    const result = await useCase.execute({
      tenantId: "tenant-1",
      actorUserId: "admin-user",
      invitationId: "invitation-1"
    });

    expect(result.acceptanceToken).toBe("new-token");
    expect(repository.resend).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        invitationId: "invitation-1",
        tokenHash: tokenService.hashToken("new-token")
      })
    );
    expect(createAuditEventUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "invitation.resent",
        resourceId: "invitation-1"
      })
    );
  });

  it("rejects resends after the limit is reached", async () => {
    const repository = createInvitationsRepository();
    repository.findById.mockResolvedValue(createInvitation({ resendCount: 3 }));
    const useCase = new ResendTenantInvitationUseCase(
      repository,
      new AccessPolicyService(),
      new InvitationTokenService(),
      { execute: jest.fn() } as unknown as CreateAuditEventUseCase
    );

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "admin-user",
        invitationId: "invitation-1"
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

