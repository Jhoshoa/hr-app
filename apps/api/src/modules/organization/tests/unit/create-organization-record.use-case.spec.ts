import { CreateOrganizationRecordUseCase } from "../../application/use-cases/create-organization-record.use-case";
import type { OrganizationRepository } from "../../domain/ports/organization.repository.port";

const createRepository = (): jest.Mocked<OrganizationRepository> => ({
  archive: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  list: jest.fn(),
  reactivate: jest.fn(),
  update: jest.fn()
});

describe("CreateOrganizationRecordUseCase", () => {
  it("creates tenant-scoped organization records through the repository", async () => {
    const repository = createRepository();
    const createdAt = new Date("2026-05-12T10:00:00.000Z");

    repository.create.mockResolvedValue({
      id: "department-1",
      tenantId: "tenant-1",
      name: "Engineering",
      status: "ACTIVE",
      createdAt,
      updatedAt: createdAt
    });

    const useCase = new CreateOrganizationRecordUseCase(repository);
    const result = await useCase.execute({
      tenantId: "tenant-1",
      kind: "department",
      name: "Engineering"
    });

    expect(result.id).toBe("department-1");
    expect(repository.create).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      kind: "department",
      name: "Engineering"
    });
  });
});
