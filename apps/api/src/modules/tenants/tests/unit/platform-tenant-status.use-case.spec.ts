import { ConflictException, NotFoundException } from "@nestjs/common";
import { ArchivePlatformTenantUseCase } from "../../application/use-cases/archive-platform-tenant.use-case";
import { ReactivatePlatformTenantUseCase } from "../../application/use-cases/reactivate-platform-tenant.use-case";
import type { PrismaService } from "../../../../database/prisma/prisma.service";
import type { EventBus } from "../../../../events/event-bus.port";

const activeTenant = {
  id: "tenant-1",
  name: "Acme Corp",
  slug: "acme",
  status: "ACTIVE" as const,
  defaultLanguage: "es",
  defaultCurrency: "BOB",
  timezone: "America/La_Paz",
  createdAt: new Date("2026-05-14T00:00:00.000Z"),
  updatedAt: new Date("2026-05-14T00:00:00.000Z")
};

const createEventBus = (): jest.Mocked<EventBus> => ({
  publish: jest.fn(),
  publishMany: jest.fn()
});

describe("ArchivePlatformTenantUseCase", () => {
  it("archives an active tenant and writes audit metadata", async () => {
    const tx = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue(activeTenant),
        update: jest.fn().mockResolvedValue({ ...activeTenant, status: "ARCHIVED" })
      },
      auditEvent: {
        create: jest.fn().mockResolvedValue({ id: "audit-1" })
      }
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx))
    } as unknown as PrismaService;
    const eventBus = createEventBus();
    const useCase = new ArchivePlatformTenantUseCase(prisma, eventBus);

    const result = await useCase.execute({
      actorUserId: "platform-user-1",
      reason: "  customer offboarded  ",
      tenantId: "tenant-1"
    });

    expect(result.status).toBe("ARCHIVED");
    expect(tx.tenant.update).toHaveBeenCalledWith({
      where: { id: "tenant-1" },
      data: { status: "ARCHIVED" }
    });
    expect(tx.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "tenant.archived",
          actorUserId: "platform-user-1",
          tenantId: "tenant-1",
          metadata: {
            previousStatus: "ACTIVE",
            reason: "customer offboarded"
          }
        })
      })
    );
    expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({ name: "TenantArchived" }));
  });

  it("rejects archiving a missing tenant", async () => {
    const tx = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue(null)
      }
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx))
    } as unknown as PrismaService;
    const useCase = new ArchivePlatformTenantUseCase(prisma, createEventBus());

    await expect(
      useCase.execute({ actorUserId: "platform-user-1", tenantId: "missing" })
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe("ReactivatePlatformTenantUseCase", () => {
  it("reactivates an archived tenant", async () => {
    const archivedTenant = { ...activeTenant, status: "ARCHIVED" as const };
    const tx = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue(archivedTenant),
        update: jest.fn().mockResolvedValue(activeTenant)
      },
      auditEvent: {
        create: jest.fn().mockResolvedValue({ id: "audit-1" })
      }
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx))
    } as unknown as PrismaService;
    const eventBus = createEventBus();
    const useCase = new ReactivatePlatformTenantUseCase(prisma, eventBus);

    const result = await useCase.execute({
      actorUserId: "platform-user-1",
      tenantId: "tenant-1"
    });

    expect(result.status).toBe("ACTIVE");
    expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({ name: "TenantReactivated" }));
  });

  it("rejects reactivating an already active tenant", async () => {
    const tx = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue(activeTenant)
      }
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx))
    } as unknown as PrismaService;
    const useCase = new ReactivatePlatformTenantUseCase(prisma, createEventBus());

    await expect(
      useCase.execute({ actorUserId: "platform-user-1", tenantId: "tenant-1" })
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
