import { ReactivateOrganizationRecordUseCase } from "../../application/use-cases/reactivate-organization-record.use-case";
import type { OrganizationRepository } from "../../domain/ports/organization.repository.port";

const createRepository = (): jest.Mocked<OrganizationRepository> => ({
  archive: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  list: jest.fn(),
  reactivate: jest.fn(),
  update: jest.fn()
});

describe("ReactivateOrganizationRecordUseCase", () => {
  it("reactivates a record through the repository", async () => {
    const repository = createRepository();
    const reactivatedAt = new Date("2026-05-13T10:00:00.000Z");

    repository.reactivate.mockResolvedValue({
      id: "work-mode-1",
      tenantId: "tenant-1",
      name: "Hybrid",
      type: "hybrid",
      status: "ACTIVE",
      createdAt: reactivatedAt,
      updatedAt: reactivatedAt
    });

    const createAuditEventUseCase = { execute: jest.fn() };
    const useCase = new ReactivateOrganizationRecordUseCase(
      repository,
      createAuditEventUseCase as never
    );
    const result = await useCase.execute("tenant-1", "workMode", "work-mode-1", "user-1");

    expect(result.status).toBe("ACTIVE");
    expect(repository.reactivate).toHaveBeenCalledWith("tenant-1", "workMode", "work-mode-1");
    expect(createAuditEventUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "organization.workMode.reactivated",
        actorUserId: "user-1",
        resourceId: "work-mode-1"
      })
    );
  });
});
