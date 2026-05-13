import { NotFoundException } from "@nestjs/common";
import { UpdateCurrentTenantUseCase } from "../../application/use-cases/update-current-tenant.use-case";
import type { TenantsRepository } from "../../domain/ports/tenants.repository.port";

const createRepository = (): jest.Mocked<TenantsRepository> => ({
  findById: jest.fn(),
  findBySlug: jest.fn(),
  updateSettings: jest.fn()
});

describe("UpdateCurrentTenantUseCase", () => {
  it("updates tenant profile and localization settings", async () => {
    const repository = createRepository();

    repository.findById.mockResolvedValue({
      id: "tenant-1",
      name: "AssureSoft Demo",
      slug: "assuresoft-demo",
      status: "ACTIVE",
      defaultLanguage: "es",
      defaultCurrency: "BOB",
      timezone: "America/La_Paz"
    });
    repository.updateSettings.mockResolvedValue({
      id: "tenant-1",
      name: "AssureSoft Bolivia",
      slug: "assuresoft-demo",
      status: "ACTIVE",
      defaultLanguage: "en",
      defaultCurrency: "USD",
      timezone: "America/New_York"
    });

    const useCase = new UpdateCurrentTenantUseCase(repository);
    const result = await useCase.execute({
      tenantId: "tenant-1",
      name: "AssureSoft Bolivia",
      defaultLanguage: "en",
      defaultCurrency: "USD",
      timezone: "America/New_York"
    });

    expect(result.name).toBe("AssureSoft Bolivia");
    expect(repository.updateSettings).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      name: "AssureSoft Bolivia",
      defaultLanguage: "en",
      defaultCurrency: "USD",
      timezone: "America/New_York"
    });
  });

  it("throws when the tenant does not exist", async () => {
    const repository = createRepository();
    repository.findById.mockResolvedValue(null);

    const useCase = new UpdateCurrentTenantUseCase(repository);

    await expect(useCase.execute({ tenantId: "missing-tenant", name: "Missing" })).rejects.toThrow(
      NotFoundException
    );
    expect(repository.updateSettings).not.toHaveBeenCalled();
  });
});
