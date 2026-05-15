import type {
  AcceptTenantInvitationInput,
  CreateTenantInvitationInput,
  ResendTenantInvitationInput,
  TenantInvitationEntity,
  TenantInvitationPreviewEntity
} from "../entities/tenant-invitation.entity";

export const TENANT_INVITATIONS_REPOSITORY = Symbol("TENANT_INVITATIONS_REPOSITORY");

export interface TenantInvitationsRepository {
  list: (tenantId: string) => Promise<TenantInvitationEntity[]>;
  findById: (tenantId: string, invitationId: string) => Promise<TenantInvitationEntity | null>;
  findPendingByEmail: (tenantId: string, email: string) => Promise<TenantInvitationEntity | null>;
  findByTokenHash: (tokenHash: string) => Promise<TenantInvitationEntity | null>;
  findPreviewByTokenHash: (tokenHash: string) => Promise<TenantInvitationPreviewEntity | null>;
  findMembershipStatusByEmail: (
    tenantId: string,
    email: string
  ) => Promise<"INVITED" | "ACTIVE" | "DISABLED" | null>;
  create: (input: CreateTenantInvitationInput) => Promise<TenantInvitationEntity>;
  resend: (input: ResendTenantInvitationInput) => Promise<TenantInvitationEntity>;
  cancel: (tenantId: string, invitationId: string) => Promise<TenantInvitationEntity>;
  accept: (input: AcceptTenantInvitationInput) => Promise<TenantInvitationEntity>;
  markExpired: (tokenHash: string) => Promise<TenantInvitationEntity>;
}
