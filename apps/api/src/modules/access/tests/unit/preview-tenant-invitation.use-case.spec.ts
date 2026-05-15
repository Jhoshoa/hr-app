import { NotFoundException } from "@nestjs/common";
import { AccessPolicyService } from "../../application/services/access-policy.service";
import { InvitationTokenService } from "../../application/services/invitation-token.service";
import { PreviewTenantInvitationUseCase } from "../../application/use-cases/preview-tenant-invitation.use-case";
import type { TenantInvitationsRepository } from "../../domain/ports/tenant-invitations.repository.port";

const createInvitationsRepository = (): jest.Mocked<TenantInvitationsRepository> => ({
  accept: jest.fn(),
  cancel: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByTokenHash: jest.fn(),
  findMembershipStatusByEmail: jest.fn(),
  findPendingByEmail: jest.fn(),
  findPreviewByTokenHash: jest.fn(),
  list: jest.fn(),
  markExpired: jest.fn(),
  resend: jest.fn()
});

describe("PreviewTenantInvitationUseCase", () => {
  it("returns a minimal preview for an invitation token", async () => {
    const repository = createInvitationsRepository();
    const tokenService = new InvitationTokenService();
    repository.findPreviewByTokenHash.mockResolvedValue({
      tenantName: "Andes People Ops",
      invitedEmail: "ana@example.com",
      status: "PENDING",
      expiresAt: new Date("2026-05-22T00:00:00.000Z"),
      roles: [{ name: "Employee" }]
    });
    const useCase = new PreviewTenantInvitationUseCase(
      repository,
      new AccessPolicyService(),
      tokenService
    );

    const result = await useCase.execute("plain-token");

    expect(result).toEqual(
      expect.objectContaining({
        tenantName: "Andes People Ops",
        invitedEmail: "ana@example.com",
        status: "PENDING"
      })
    );
    expect(repository.findPreviewByTokenHash).toHaveBeenCalledWith(
      tokenService.hashToken("plain-token")
    );
  });

  it("throws not found for invalid tokens", async () => {
    const repository = createInvitationsRepository();
    repository.findPreviewByTokenHash.mockResolvedValue(null);
    const useCase = new PreviewTenantInvitationUseCase(
      repository,
      new AccessPolicyService(),
      new InvitationTokenService()
    );

    await expect(useCase.execute("plain-token")).rejects.toBeInstanceOf(NotFoundException);
  });
});
