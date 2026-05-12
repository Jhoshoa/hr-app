export interface AuditEventEntity {
  readonly id: string;
  readonly tenantId?: string | null;
  readonly actorUserId?: string | null;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId?: string | null;
  readonly metadata?: Record<string, unknown> | null;
  readonly ipAddress?: string | null;
  readonly userAgent?: string | null;
  readonly createdAt: Date;
}
