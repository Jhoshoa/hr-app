import { ArchiveOrganizationRecordUseCase } from "../../application/use-cases/archive-organization-record.use-case";
import type { OrganizationRepository } from "../../domain/ports/organization.repository.port";

const createRepository = (): jest.Mocked<OrganizationRepository> => ({
  archive: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  list: jest.fn(),
  reactivate: jest.fn(),
  update: jest.fn()
});

describe("ArchiveOrganizationRecordUseCase", () => {
  it("archives a record through the repository", async () => {
    const repository = createRepository();
    const archivedAt = new Date("2026-05-13T10:00:00.000Z");

    repository.archive.mockResolvedValue({
      id: "department-1",
      tenantId: "tenant-1",
      name: "Engineering",
      status: "ARCHIVED",
      createdAt: archivedAt,
      updatedAt: archivedAt
    });

    const useCase = new ArchiveOrganizationRecordUseCase(repository);
    const result = await useCase.execute("tenant-1", "department", "department-1");

    expect(result.status).toBe("ARCHIVED");
    expect(repository.archive).toHaveBeenCalledWith("tenant-1", "department", "department-1");
  });
});
