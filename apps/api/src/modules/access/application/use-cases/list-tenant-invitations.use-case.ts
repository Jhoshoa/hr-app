import { Inject, Injectable } from "@nestjs/common";
import type { TenantInvitationEntity } from "../../domain/entities/tenant-invitation.entity";
import {
  TENANT_INVITATIONS_REPOSITORY,
  type TenantInvitationsRepository
} from "../../domain/ports/tenant-invitations.repository.port";

@Injectable()
export class ListTenantInvitationsUseCase {
  constructor(
    @Inject(TENANT_INVITATIONS_REPOSITORY)
    private readonly tenantInvitationsRepository: TenantInvitationsRepository
  ) {}

  execute = async (tenantId: string): Promise<TenantInvitationEntity[]> =>
    this.tenantInvitationsRepository.list(tenantId);
}

