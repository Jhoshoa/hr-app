import { UpdateOrganizationRecordUseCase } from "../../application/use-cases/update-organization-record.use-case";
import type { OrganizationRepository } from "../../domain/ports/organization.repository.port";

const createRepository = (): jest.Mocked<OrganizationRepository> => ({
  archive: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  list: jest.fn(),
  reactivate: jest.fn(),
  update: jest.fn()
});

describe("UpdateOrganizationRecordUseCase", () => {
  it("updates a tenant-scoped organization record through the repository", async () => {
    const repository = createRepository();
    const updatedAt = new Date("2026-05-13T10:00:00.000Z");

    repository.update.mockResolvedValue({
      id: "location-1",
      tenantId: "tenant-1",
      name: "Cochabamba HQ",
      status: "ACTIVE",
      country: "BO",
      city: "Cochabamba",
      timezone: "America/La_Paz",
      createdAt: updatedAt,
      updatedAt
    });

    const createAuditEventUseCase = { execute: jest.fn() };
    const useCase = new UpdateOrganizationRecordUseCase(repository, createAuditEventUseCase as never);
    const result = await useCase.execute({
      tenantId: "tenant-1",
      actorUserId: "user-1",
      kind: "location",
      id: "location-1",
      name: "Cochabamba HQ",
      city: "Cochabamba"
    });

    expect(result.name).toBe("Cochabamba HQ");
    expect(repository.update).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      kind: "location",
      id: "location-1",
      name: "Cochabamba HQ",
      city: "Cochabamba"
    });
    expect(createAuditEventUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "organization.location.updated",
        actorUserId: "user-1",
        resourceId: "location-1"
      })
    );
  });
});
