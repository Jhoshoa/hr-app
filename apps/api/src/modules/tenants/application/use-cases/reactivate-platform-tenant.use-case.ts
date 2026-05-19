import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Tenant } from "@prisma/client";
import { PrismaService } from "../../../../database/prisma/prisma.service";
import { EVENT_BUS, type EventBus } from "../../../../events/event-bus.port";
import type { TenantEntity } from "../../domain/entities/tenant.entity";

interface ReactivatePlatformTenantInput {
  readonly tenantId: string;
  readonly actorUserId: string;
}

@Injectable()
export class ReactivatePlatformTenantUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus
  ) {}

  execute = async (input: ReactivatePlatformTenantInput): Promise<TenantEntity> => {
    const reactivatedTenant = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({
        where: { id: input.tenantId }
      });

      if (!tenant) {
        throw new NotFoundException("Tenant was not found.");
      }

      if (tenant.status === "ACTIVE") {
        throw new ConflictException("Tenant is already active.");
      }

      const updatedTenant = await tx.tenant.update({
        where: { id: tenant.id },
        data: { status: "ACTIVE" }
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: input.actorUserId,
          action: "tenant.reactivated",
          resourceType: "Tenant",
          resourceId: tenant.id,
          tenantId: tenant.id,
          metadata: {
            previousStatus: tenant.status
          }
        }
      });

      return updatedTenant;
    });

    await this.eventBus.publish({
      name: "TenantReactivated",
      occurredAt: new Date(),
      payload: {
        tenantId: reactivatedTenant.id
      }
    });

    return this.toEntity(reactivatedTenant);
  };

  private toEntity = (tenant: Tenant): TenantEntity => ({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    defaultLanguage: tenant.defaultLanguage,
    defaultCurrency: tenant.defaultCurrency,
    timezone: tenant.timezone,
    profile: null
  });
}
