import { NotFoundException } from "@nestjs/common";
import { TimezonePolicyService } from "../../../../common/timezones/timezone-policy.service";
import { UpdateCurrentTenantUseCase } from "../../application/use-cases/update-current-tenant.use-case";
import type { TenantsRepository } from "../../domain/ports/tenants.repository.port";

const createRepository = (): jest.Mocked<TenantsRepository> => ({
  findById: jest.fn(),
  findBySlug: jest.fn(),
  updateSettings: jest.fn()
});

const createUseCase = (
  repository: jest.Mocked<TenantsRepository>,
  createAuditEventUseCase = { execute: jest.fn() }
) => new UpdateCurrentTenantUseCase(repository, new TimezonePolicyService(), createAuditEventUseCase as never);

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

    const createAuditEventUseCase = { execute: jest.fn() };
    const useCase = createUseCase(repository, createAuditEventUseCase);
    const result = await useCase.execute({
      tenantId: "tenant-1",
      actorUserId: "user-1",
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
    expect(createAuditEventUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "tenant.settings.updated",
        actorUserId: "user-1",
        resourceId: "tenant-1"
      })
    );
  });

  it("throws when the tenant does not exist", async () => {
    const repository = createRepository();
    repository.findById.mockResolvedValue(null);

    const createAuditEventUseCase = { execute: jest.fn() };
    const useCase = createUseCase(repository, createAuditEventUseCase);

    await expect(
      useCase.execute({ tenantId: "missing-tenant", actorUserId: "user-1", name: "Missing" })
    ).rejects.toThrow(NotFoundException);
    expect(repository.updateSettings).not.toHaveBeenCalled();
    expect(createAuditEventUseCase.execute).not.toHaveBeenCalled();
  });

  it("rejects valid IANA timezones that are outside the product catalog", async () => {
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

    const createAuditEventUseCase = { execute: jest.fn() };
    const useCase = createUseCase(repository, createAuditEventUseCase);

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "user-1",
        timezone: "Europe/Madrid"
      })
    ).rejects.toThrow("Timezone must be a supported IANA timezone.");
    expect(repository.updateSettings).not.toHaveBeenCalled();
    expect(createAuditEventUseCase.execute).not.toHaveBeenCalled();
  });
});
