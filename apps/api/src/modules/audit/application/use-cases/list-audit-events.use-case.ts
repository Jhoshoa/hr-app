import { Inject, Injectable } from "@nestjs/common";
import type { AuditEventEntity } from "../../domain/entities/audit-event.entity";
import {
  AUDIT_EVENTS_REPOSITORY,
  AuditEventsRepository
} from "../../domain/ports/audit-events.repository.port";

@Injectable()
export class ListAuditEventsUseCase {
  constructor(
    @Inject(AUDIT_EVENTS_REPOSITORY) private readonly auditEventsRepository: AuditEventsRepository
  ) {}

  execute = async (tenantId: string, limit = 50): Promise<AuditEventEntity[]> => {
    return this.auditEventsRepository.findByTenantId(tenantId, limit);
  };
}
