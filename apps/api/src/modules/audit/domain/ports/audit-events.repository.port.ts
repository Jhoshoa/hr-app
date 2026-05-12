import type { AuditEventEntity } from "../entities/audit-event.entity";

export const AUDIT_EVENTS_REPOSITORY = Symbol("AUDIT_EVENTS_REPOSITORY");

export interface CreateAuditEventInput {
  readonly tenantId?: string | null;
  readonly actorUserId?: string | null;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId?: string | null;
  readonly metadata?: Record<string, unknown> | null;
  readonly ipAddress?: string | null;
  readonly userAgent?: string | null;
}

export interface AuditEventsRepository {
  create: (input: CreateAuditEventInput) => Promise<AuditEventEntity>;
  findByTenantId: (tenantId: string, limit: number) => Promise<AuditEventEntity[]>;
}
