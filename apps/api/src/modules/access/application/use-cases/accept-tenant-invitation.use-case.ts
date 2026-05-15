import { ConflictException, Inject, Injectable } from "@nestjs/common";
import type { TenantInvitationEntity } from "../../domain/entities/tenant-invitation.entity";
import {
  TENANT_INVITATIONS_REPOSITORY,
  type TenantInvitationsRepository
} from "../../domain/ports/tenant-invitations.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";
import { AccessPolicyService } from "../services/access-policy.service";
import { InvitationTokenService } from "../services/invitation-token.service";

interface AcceptTenantInvitationUseCaseInput {
  readonly token: string;
  readonly userId: string;
  readonly userEmail: string;
}

@Injectable()
export class AcceptTenantInvitationUseCase {
  constructor(
    @Inject(TENANT_INVITATIONS_REPOSITORY)
    private readonly tenantInvitationsRepository: TenantInvitationsRepository,
    private readonly accessPolicyService: AccessPolicyService,
    private readonly invitationTokenService: InvitationTokenService,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: AcceptTenantInvitationUseCaseInput): Promise<TenantInvitationEntity> => {
    const tokenHash = this.invitationTokenService.hashToken(input.token);
    const current = this.accessPolicyService.assertInvitationExists(
      await this.tenantInvitationsRepository.findByTokenHash(tokenHash)
    );

    if (current.status !== "PENDING") {
      throw new ConflictException("Invitation is no longer pending.");
    }

    if (current.expiresAt.getTime() <= Date.now()) {
      await this.tenantInvitationsRepository.markExpired(tokenHash);
      throw new ConflictException("Invitation has expired.");
    }

    if (current.email !== input.userEmail.trim().toLowerCase()) {
      throw new ConflictException("Invitation email does not match authenticated user.");
    }

    const invitation = await this.tenantInvitationsRepository.accept({
      tokenHash,
      acceptedByUserId: input.userId
    });

    await this.createAuditEventUseCase.execute({
      tenantId: invitation.tenantId,
      actorUserId: input.userId,
      action: "invitation.accepted",
      resourceType: "TenantInvitation",
      resourceId: invitation.id,
      metadata: {
        targetEmail: invitation.email,
        membershipId: invitation.membershipId
      }
    });

    return invitation;
  };
}
