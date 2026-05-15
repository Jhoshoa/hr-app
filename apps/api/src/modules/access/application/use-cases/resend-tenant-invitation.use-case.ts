import { ConflictException, Inject, Injectable } from "@nestjs/common";
import type { TenantInvitationWithToken } from "../../domain/entities/tenant-invitation.entity";
import {
  TENANT_INVITATIONS_REPOSITORY,
  type TenantInvitationsRepository
} from "../../domain/ports/tenant-invitations.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";
import { AccessPolicyService } from "../services/access-policy.service";
import { InvitationTokenService } from "../services/invitation-token.service";

interface ResendTenantInvitationUseCaseInput {
  readonly tenantId: string;
  readonly actorUserId: string;
  readonly invitationId: string;
}

const invitationTtlMs = 7 * 24 * 60 * 60 * 1000;
const maxInvitationResends = 3;

@Injectable()
export class ResendTenantInvitationUseCase {
  constructor(
    @Inject(TENANT_INVITATIONS_REPOSITORY)
    private readonly tenantInvitationsRepository: TenantInvitationsRepository,
    private readonly accessPolicyService: AccessPolicyService,
    private readonly invitationTokenService: InvitationTokenService,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (
    input: ResendTenantInvitationUseCaseInput
  ): Promise<TenantInvitationWithToken> => {
    const current = this.accessPolicyService.assertInvitationExists(
      await this.tenantInvitationsRepository.findById(input.tenantId, input.invitationId)
    );

    if (current.status !== "PENDING" && current.status !== "EXPIRED") {
      throw new ConflictException("Only pending or expired invitations can be resent.");
    }

    if (current.resendCount >= maxInvitationResends) {
      throw new ConflictException("Invitation resend limit has been reached.");
    }

    const token = this.invitationTokenService.createToken();
    const invitation = await this.tenantInvitationsRepository.resend({
      tenantId: input.tenantId,
      invitationId: input.invitationId,
      tokenHash: this.invitationTokenService.hashToken(token),
      expiresAt: new Date(Date.now() + invitationTtlMs)
    });

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "invitation.resent",
      resourceType: "TenantInvitation",
      resourceId: invitation.id,
      metadata: {
        targetEmail: invitation.email
      }
    });

    return { ...invitation, acceptanceToken: token };
  };
}
