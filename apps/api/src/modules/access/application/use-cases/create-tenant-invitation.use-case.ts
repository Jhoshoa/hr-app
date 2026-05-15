import { BadRequestException, ConflictException, Inject, Injectable } from "@nestjs/common";
import type { TenantInvitationWithToken } from "../../domain/entities/tenant-invitation.entity";
import {
  TENANT_INVITATIONS_REPOSITORY,
  type TenantInvitationsRepository
} from "../../domain/ports/tenant-invitations.repository.port";
import { ROLES_REPOSITORY, type RolesRepository } from "../../domain/ports/roles.repository.port";
import { CreateAuditEventUseCase } from "../../../audit/application/use-cases/create-audit-event.use-case";
import { AccessPolicyService } from "../services/access-policy.service";
import { InvitationTokenService } from "../services/invitation-token.service";

interface CreateTenantInvitationUseCaseInput {
  readonly tenantId: string;
  readonly actorUserId: string;
  readonly email: string;
  readonly roleIds: readonly string[];
}

const invitationTtlMs = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class CreateTenantInvitationUseCase {
  constructor(
    @Inject(TENANT_INVITATIONS_REPOSITORY)
    private readonly tenantInvitationsRepository: TenantInvitationsRepository,
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: RolesRepository,
    private readonly accessPolicyService: AccessPolicyService,
    private readonly invitationTokenService: InvitationTokenService,
    private readonly createAuditEventUseCase: CreateAuditEventUseCase
  ) {}

  execute = async (
    input: CreateTenantInvitationUseCaseInput
  ): Promise<TenantInvitationWithToken> => {
    const email = this.normalizeEmail(input.email);
    const roleIds = await this.accessPolicyService.assertRoleIdsAreValid(
      this.rolesRepository,
      input.tenantId,
      input.roleIds
    );
    const membershipStatus = await this.tenantInvitationsRepository.findMembershipStatusByEmail(
      input.tenantId,
      email
    );

    if (membershipStatus === "ACTIVE") {
      throw new ConflictException("User already has active access to this tenant.");
    }

    if (membershipStatus === "DISABLED") {
      throw new ConflictException("Disabled users must be reactivated instead of invited.");
    }

    const pendingInvitation = await this.tenantInvitationsRepository.findPendingByEmail(
      input.tenantId,
      email
    );

    if (pendingInvitation) {
      throw new ConflictException("A pending invitation already exists for this email.");
    }

    const token = this.invitationTokenService.createToken();
    const invitation = await this.tenantInvitationsRepository.create({
      tenantId: input.tenantId,
      email,
      roleIds,
      tokenHash: this.invitationTokenService.hashToken(token),
      expiresAt: new Date(Date.now() + invitationTtlMs),
      invitedByUserId: input.actorUserId
    });

    await this.createAuditEventUseCase.execute({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "invitation.created",
      resourceType: "TenantInvitation",
      resourceId: invitation.id,
      metadata: {
        targetEmail: invitation.email,
        roleIds
      }
    });

    return { ...invitation, acceptanceToken: token };
  };

  private normalizeEmail = (email: string): string => {
    const normalized = email.trim().toLowerCase();

    if (!normalized || !normalized.includes("@")) {
      throw new BadRequestException("A valid email is required.");
    }

    return normalized;
  };
}

