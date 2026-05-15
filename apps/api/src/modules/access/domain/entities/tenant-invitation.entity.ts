export type TenantInvitationStatus = "PENDING" | "ACCEPTED" | "CANCELLED" | "EXPIRED";

export interface TenantInvitationRoleEntity {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly isSystemRole: boolean;
  readonly status: string;
}

export interface TenantInvitationEntity {
  readonly id: string;
  readonly tenantId: string;
  readonly email: string;
  readonly membershipId?: string | null;
  readonly status: TenantInvitationStatus;
  readonly invitedByUserId?: string | null;
  readonly acceptedByUserId?: string | null;
  readonly expiresAt: Date;
  readonly resendCount: number;
  readonly lastSentAt?: Date | null;
  readonly acceptedAt?: Date | null;
  readonly cancelledAt?: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly roles: TenantInvitationRoleEntity[];
}

export interface TenantInvitationWithToken extends TenantInvitationEntity {
  readonly acceptanceToken: string;
}

export interface CreateTenantInvitationInput {
  readonly tenantId: string;
  readonly email: string;
  readonly roleIds: readonly string[];
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly invitedByUserId: string;
}

export interface ResendTenantInvitationInput {
  readonly tenantId: string;
  readonly invitationId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
}

export interface AcceptTenantInvitationInput {
  readonly tokenHash: string;
  readonly acceptedByUserId: string;
}
