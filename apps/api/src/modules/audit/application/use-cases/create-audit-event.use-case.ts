import { Inject, Injectable } from "@nestjs/common";
import { AUDIT_EVENTS_REPOSITORY } from "../../domain/ports/audit-events.repository.port";
import type {
  AuditEventsRepository,
  CreateAuditEventInput
} from "../../domain/ports/audit-events.repository.port";
import type { AuditEventEntity } from "../../domain/entities/audit-event.entity";

@Injectable()
export class CreateAuditEventUseCase {
  constructor(
    @Inject(AUDIT_EVENTS_REPOSITORY) private readonly auditEventsRepository: AuditEventsRepository
  ) {}

  execute = async (input: CreateAuditEventInput): Promise<AuditEventEntity> => {
    return this.auditEventsRepository.create(input);
  };
}
