import { ConflictException, Inject, Injectable } from "@nestjs/common";
import type { TenantInvitationEntity } from "../../domain/entities/tenant-invitation.entity";
import {
  TENANT_INVITATIONS_REPOSITORY,
  type TenantInvitationsRepository
} from "../../domain/ports/tenant-invitations.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";
import { AccessPolicyService } from "../services/access-policy.service";

interface CancelTenantInvitationUseCaseInput {
  readonly tenantId: string;
  readonly actorUserId: string;
  readonly invitationId: string;
}

@Injectable()
export class CancelTenantInvitationUseCase {
  constructor(
    @Inject(TENANT_INVITATIONS_REPOSITORY)
    private readonly tenantInvitationsRepository: TenantInvitationsRepository,
    private readonly accessPolicyService: AccessPolicyService,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (input: CancelTenantInvitationUseCaseInput): Promise<TenantInvitationEntity> => {
    const current = this.accessPolicyService.assertInvitationExists(
      await this.tenantInvitationsRepository.findById(input.tenantId, input.invitationId)
    );

    if (current.status !== "PENDING" && current.status !== "EXPIRED") {
      throw new ConflictException("Only pending or expired invitations can be cancelled.");
    }

    const invitation = await this.tenantInvitationsRepository.cancel(
      input.tenantId,
      input.invitationId
    );

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "invitation.cancelled",
      resourceType: "TenantInvitation",
      resourceId: invitation.id,
      metadata: {
        targetEmail: invitation.email
      }
    });

    return invitation;
  };
}

