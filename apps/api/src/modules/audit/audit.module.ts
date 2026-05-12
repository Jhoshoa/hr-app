import { Module } from "@nestjs/common";
import { AUDIT_EVENTS_REPOSITORY } from "./domain/ports/audit-events.repository.port";
import { CreateAuditEventUseCase } from "./application/use-cases/create-audit-event.use-case";
import { ListAuditEventsUseCase } from "./application/use-cases/list-audit-events.use-case";
import { PrismaAuditEventsRepository } from "./infrastructure/persistence/prisma-audit-events.repository";
import { AuditEventsController } from "./presentation/controllers/audit-events.controller";

@Module({
  controllers: [AuditEventsController],
  providers: [
    CreateAuditEventUseCase,
    ListAuditEventsUseCase,
    {
      provide: AUDIT_EVENTS_REPOSITORY,
      useClass: PrismaAuditEventsRepository
    }
  ],
  exports: [AUDIT_EVENTS_REPOSITORY, CreateAuditEventUseCase, ListAuditEventsUseCase]
})
export class AuditModule {}
