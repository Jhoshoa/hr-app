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
      subdivisionCode: "BO-C",
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
      country: "BO",
      subdivisionCode: "bo-c",
      city: "Cochabamba"
    });

    expect(result.name).toBe("Cochabamba HQ");
    expect(repository.update).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      kind: "location",
      id: "location-1",
      name: "Cochabamba HQ",
      country: "BO",
      subdivisionCode: "BO-C",
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

  it("clears subdivision when location country changes without a new subdivision", async () => {
    const repository = createRepository();
    const updatedAt = new Date("2026-05-13T10:00:00.000Z");

    repository.findById.mockResolvedValue({
      id: "location-1",
      tenantId: "tenant-1",
      name: "New York HQ",
      status: "ACTIVE",
      country: "US",
      subdivisionCode: "US-NY",
      city: "New York",
      timezone: "America/New_York",
      createdAt: updatedAt,
      updatedAt
    });
    repository.update.mockResolvedValue({
      id: "location-1",
      tenantId: "tenant-1",
      name: "New York HQ",
      status: "ACTIVE",
      country: "BO",
      subdivisionCode: null,
      city: "New York",
      timezone: "America/New_York",
      createdAt: updatedAt,
      updatedAt
    });

    const useCase = new UpdateOrganizationRecordUseCase(repository, { execute: jest.fn() } as never);

    await useCase.execute({
      tenantId: "tenant-1",
      actorUserId: "user-1",
      kind: "location",
      id: "location-1",
      country: "BO"
    });

    expect(repository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        country: "BO",
        subdivisionCode: null
      })
    );
  });

  it("rejects unsupported subdivision updates for the location country", async () => {
    const repository = createRepository();
    const updatedAt = new Date("2026-05-13T10:00:00.000Z");

    repository.findById.mockResolvedValue({
      id: "location-1",
      tenantId: "tenant-1",
      name: "Cochabamba HQ",
      status: "ACTIVE",
      country: "BO",
      subdivisionCode: "BO-C",
      city: "Cochabamba",
      timezone: "America/La_Paz",
      createdAt: updatedAt,
      updatedAt
    });

    const useCase = new UpdateOrganizationRecordUseCase(repository, { execute: jest.fn() } as never);

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "user-1",
        kind: "location",
        id: "location-1",
        subdivisionCode: "US-NY"
      })
    ).rejects.toThrow("Subdivision must be supported for the selected country.");
  });
});
