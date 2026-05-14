import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Tenant } from "@prisma/client";
import { PrismaService } from "../../../../database/prisma/prisma.service";
import { EVENT_BUS, type EventBus } from "../../../../events/event-bus.port";
import type { TenantEntity } from "../../domain/entities/tenant.entity";

interface ArchivePlatformTenantInput {
  readonly tenantId: string;
  readonly actorUserId: string;
  readonly reason?: string;
}

@Injectable()
export class ArchivePlatformTenantUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus
  ) {}

  execute = async (input: ArchivePlatformTenantInput): Promise<TenantEntity> => {
    const archivedTenant = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({
        where: { id: input.tenantId }
      });

      if (!tenant) {
        throw new NotFoundException("Tenant was not found.");
      }

      if (tenant.status === "ARCHIVED") {
        throw new ConflictException("Tenant is already archived.");
      }

      const updatedTenant = await tx.tenant.update({
        where: { id: tenant.id },
        data: { status: "ARCHIVED" }
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: input.actorUserId,
          action: "tenant.archived",
          resourceType: "Tenant",
          resourceId: tenant.id,
          tenantId: tenant.id,
          metadata: {
            previousStatus: tenant.status,
            reason: input.reason?.trim() || null
          }
        }
      });

      return updatedTenant;
    });

    await this.eventBus.publish({
      name: "TenantArchived",
      occurredAt: new Date(),
      payload: {
        tenantId: archivedTenant.id
      }
    });

    return this.toEntity(archivedTenant);
  };

  private toEntity = (tenant: Tenant): TenantEntity => ({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    defaultLanguage: tenant.defaultLanguage,
    defaultCurrency: tenant.defaultCurrency,
    timezone: tenant.timezone
  });
}
