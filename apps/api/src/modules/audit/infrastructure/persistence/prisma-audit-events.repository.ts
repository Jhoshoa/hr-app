import { Injectable } from "@nestjs/common";
import type { AuditEvent, Prisma } from "@prisma/client";
import { PrismaService } from "../../../../database/prisma/prisma.service";
import type { AuditEventEntity } from "../../domain/entities/audit-event.entity";
import type {
  AuditEventsRepository,
  CreateAuditEventInput
} from "../../domain/ports/audit-events.repository.port";

@Injectable()
export class PrismaAuditEventsRepository implements AuditEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create = async (input: CreateAuditEventInput): Promise<AuditEventEntity> => {
    const auditEvent = await this.prisma.auditEvent.create({
      data: {
        tenantId: input.tenantId,
        actorUserId: input.actorUserId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        metadata: input.metadata === undefined
          ? undefined
          : input.metadata as Prisma.InputJsonValue,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent
      }
    });

    return this.toEntity(auditEvent);
  };

  findByTenantId = async (tenantId: string, limit: number): Promise<AuditEventEntity[]> => {
    const auditEvents = await this.prisma.auditEvent.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: limit
    });

    return auditEvents.map(this.toEntity);
  };

  private toEntity = (auditEvent: AuditEvent): AuditEventEntity => ({
    id: auditEvent.id,
    tenantId: auditEvent.tenantId,
    actorUserId: auditEvent.actorUserId,
    action: auditEvent.action,
    resourceType: auditEvent.resourceType,
    resourceId: auditEvent.resourceId,
    metadata: this.isMetadataRecord(auditEvent.metadata)
      ? auditEvent.metadata as Record<string, unknown>
      : null,
    ipAddress: auditEvent.ipAddress,
    userAgent: auditEvent.userAgent,
    createdAt: auditEvent.createdAt
  });

  private isMetadataRecord = (metadata: Prisma.JsonValue): boolean => {
    return typeof metadata === "object" && metadata !== null && !Array.isArray(metadata);
  };
}
