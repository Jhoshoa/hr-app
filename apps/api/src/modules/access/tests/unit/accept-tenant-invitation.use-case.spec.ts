import { ConflictException } from "@nestjs/common";
import { AccessPolicyService } from "../../application/services/access-policy.service";
import { InvitationTokenService } from "../../application/services/invitation-token.service";
import { AcceptTenantInvitationUseCase } from "../../application/use-cases/accept-tenant-invitation.use-case";
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
  findPreviewByTokenHash: jest.fn(),
  findByTokenHash: jest.fn(),
  findMembershipStatusByEmail: jest.fn(),
  findPendingByEmail: jest.fn(),
  list: jest.fn(),
  markExpired: jest.fn(),
  resend: jest.fn()
});

describe("AcceptTenantInvitationUseCase", () => {
  it("accepts pending invitations for the authenticated matching email", async () => {
    const repository = createInvitationsRepository();
    const tokenService = new InvitationTokenService();
    const invitation = createInvitation();
    repository.findByTokenHash.mockResolvedValue(invitation);
    repository.accept.mockResolvedValue({
      ...invitation,
      status: "ACCEPTED",
      acceptedByUserId: "user-1",
      acceptedAt: new Date()
    });
    const createAuditEventUseCase = {
      execute: jest.fn().mockResolvedValue({ id: "audit-1" })
    } as unknown as jest.Mocked<CreateAuditEventUseCase>;
    const useCase = new AcceptTenantInvitationUseCase(
      repository,
      new AccessPolicyService(),
      tokenService,
      createAuditEventUseCase
    );

    const result = await useCase.execute({
      token: "plain-token",
      userId: "user-1",
      userEmail: "New@Example.com"
    });

    expect(result.status).toBe("ACCEPTED");
    expect(repository.findByTokenHash).toHaveBeenCalledWith(tokenService.hashToken("plain-token"));
    expect(repository.accept).toHaveBeenCalledWith({
      tokenHash: tokenService.hashToken("plain-token"),
      acceptedByUserId: "user-1"
    });
    expect(createAuditEventUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "invitation.accepted",
        resourceId: "invitation-1"
      })
    );
  });

  it("rejects authenticated users with a different email", async () => {
    const repository = createInvitationsRepository();
    repository.findByTokenHash.mockResolvedValue(createInvitation());
    const useCase = new AcceptTenantInvitationUseCase(
      repository,
      new AccessPolicyService(),
      new InvitationTokenService(),
      { execute: jest.fn() } as unknown as CreateAuditEventUseCase
    );

    await expect(
      useCase.execute({
        token: "plain-token",
        userId: "user-1",
        userEmail: "other@example.com"
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("marks expired invitations as expired before rejecting", async () => {
    const repository = createInvitationsRepository();
    const tokenService = new InvitationTokenService();
    repository.findByTokenHash.mockResolvedValue(
      createInvitation({ expiresAt: new Date(Date.now() - 60_000) })
    );
    repository.markExpired.mockResolvedValue(createInvitation({ status: "EXPIRED" }));
    const useCase = new AcceptTenantInvitationUseCase(
      repository,
      new AccessPolicyService(),
      tokenService,
      { execute: jest.fn() } as unknown as CreateAuditEventUseCase
    );

    await expect(
      useCase.execute({
        token: "plain-token",
        userId: "user-1",
        userEmail: "new@example.com"
      })
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.markExpired).toHaveBeenCalledWith(tokenService.hashToken("plain-token"));
  });
});
