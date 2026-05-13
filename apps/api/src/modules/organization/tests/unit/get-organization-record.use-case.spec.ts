import { GetOrganizationRecordUseCase } from "../../application/use-cases/get-organization-record.use-case";
import type { OrganizationRepository } from "../../domain/ports/organization.repository.port";

const createRepository = (): jest.Mocked<OrganizationRepository> => ({
  archive: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  list: jest.fn(),
  reactivate: jest.fn(),
  update: jest.fn()
});

describe("GetOrganizationRecordUseCase", () => {
  it("loads a tenant-scoped organization record through the repository", async () => {
    const repository = createRepository();
    const createdAt = new Date("2026-05-13T10:00:00.000Z");

    repository.findById.mockResolvedValue({
      id: "job-title-1",
      tenantId: "tenant-1",
      name: "Software Engineer",
      status: "ACTIVE",
      createdAt,
      updatedAt: createdAt
    });

    const useCase = new GetOrganizationRecordUseCase(repository);
    const result = await useCase.execute("tenant-1", "jobTitle", "job-title-1");

    expect(result.id).toBe("job-title-1");
    expect(repository.findById).toHaveBeenCalledWith("tenant-1", "jobTitle", "job-title-1");
  });
});
