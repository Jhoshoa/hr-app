import { BadRequestException, NotFoundException } from "@nestjs/common";
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
      timezone: "America/La_Paz",
      profile: null
    });
    repository.updateSettings.mockResolvedValue({
      id: "tenant-1",
      name: "AssureSoft Bolivia",
      slug: "assuresoft-demo",
      status: "ACTIVE",
      defaultLanguage: "en",
      defaultCurrency: "USD",
      timezone: "America/New_York",
      profile: null
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
      timezone: "America/La_Paz",
      profile: null
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

  it("normalizes company profile fields before persisting them", async () => {
    const repository = createRepository();

    repository.findById.mockResolvedValue({
      id: "tenant-1",
      name: "AssureSoft Demo",
      slug: "assuresoft-demo",
      status: "ACTIVE",
      defaultLanguage: "es",
      defaultCurrency: "BOB",
      timezone: "America/La_Paz",
      profile: null
    });
    repository.updateSettings.mockResolvedValue({
      id: "tenant-1",
      name: "AssureSoft Demo",
      slug: "assuresoft-demo",
      status: "ACTIVE",
      defaultLanguage: "es",
      defaultCurrency: "BOB",
      timezone: "America/La_Paz",
      profile: {
        website: "example.com",
        companySize: "11-50",
        country: "BO",
        phone: "+59170000000",
        contactEmail: "admin@example.com"
      }
    });

    const createAuditEventUseCase = { execute: jest.fn() };
    const useCase = createUseCase(repository, createAuditEventUseCase);

    await useCase.execute({
      tenantId: "tenant-1",
      actorUserId: "user-1",
      profile: {
        website: " https://www.example.com ",
        companySize: " 11-50 ",
        country: "bo",
        phone: "70000000"
      }
    });

    expect(repository.updateSettings).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      profile: {
        website: "example.com",
        companySize: "11-50",
        country: "BO",
        phone: "+59170000000"
      }
    });
    expect(createAuditEventUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          updatedFields: [
            "profile.website",
            "profile.companySize",
            "profile.country",
            "profile.phone"
          ]
        }
      })
    );
  });

  it("rejects invalid company profile phones", async () => {
    const repository = createRepository();

    repository.findById.mockResolvedValue({
      id: "tenant-1",
      name: "AssureSoft Demo",
      slug: "assuresoft-demo",
      status: "ACTIVE",
      defaultLanguage: "es",
      defaultCurrency: "BOB",
      timezone: "America/La_Paz",
      profile: null
    });

    const useCase = createUseCase(repository);

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "user-1",
        profile: {
          country: "BO",
          phone: "abc"
        }
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.updateSettings).not.toHaveBeenCalled();
  });
});
