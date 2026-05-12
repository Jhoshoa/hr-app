import { CreateAuditEventUseCase } from "../../application/use-cases/create-audit-event.use-case";
import type { AuditEventsRepository } from "../../domain/ports/audit-events.repository.port";

const createRepository = (): jest.Mocked<AuditEventsRepository> => ({
  create: jest.fn(),
  findByTenantId: jest.fn()
});

describe("CreateAuditEventUseCase", () => {
  it("delegates append-only audit event creation to the repository", async () => {
    const repository = createRepository();
    const createdAt = new Date("2026-05-12T10:00:00.000Z");

    repository.create.mockResolvedValue({
      id: "audit-1",
      tenantId: "tenant-1",
      actorUserId: "user-1",
      action: "tenant.read",
      resourceType: "tenant",
      resourceId: "tenant-1",
      metadata: null,
      ipAddress: null,
      userAgent: null,
      createdAt
    });

    const useCase = new CreateAuditEventUseCase(repository);
    const result = await useCase.execute({
      tenantId: "tenant-1",
      actorUserId: "user-1",
      action: "tenant.read",
      resourceType: "tenant",
      resourceId: "tenant-1"
    });

    expect(result.id).toBe("audit-1");
    expect(repository.create).toHaveBeenCalledTimes(1);
  });
});
