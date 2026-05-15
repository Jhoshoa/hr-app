import { Inject, Injectable } from "@nestjs/common";
import { AccessPolicyService } from "../services/access-policy.service";
import { InvitationTokenService } from "../services/invitation-token.service";
import type { TenantInvitationPreviewEntity } from "../../domain/entities/tenant-invitation.entity";
import {
  TENANT_INVITATIONS_REPOSITORY,
  type TenantInvitationsRepository
} from "../../domain/ports/tenant-invitations.repository.port";

@Injectable()
export class PreviewTenantInvitationUseCase {
  constructor(
    @Inject(TENANT_INVITATIONS_REPOSITORY)
    private readonly tenantInvitationsRepository: TenantInvitationsRepository,
    private readonly accessPolicyService: AccessPolicyService,
    private readonly invitationTokenService: InvitationTokenService
  ) {}

  execute = async (token: string): Promise<TenantInvitationPreviewEntity> => {
    const tokenHash = this.invitationTokenService.hashToken(token);

    return this.accessPolicyService.assertInvitationExists(
      await this.tenantInvitationsRepository.findPreviewByTokenHash(tokenHash)
    );
  };
}
