import { CreateOrganizationRecordUseCase } from "../../application/use-cases/create-organization-record.use-case";
import { TimezoneResolutionService } from "../../../../common/timezones/timezone-resolution.service";
import type { OrganizationRepository } from "../../domain/ports/organization.repository.port";
import type { TenantsRepository } from "../../../tenants/domain/ports/tenants.repository.port";

const createRepository = (): jest.Mocked<OrganizationRepository> => ({
  archive: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  list: jest.fn(),
  reactivate: jest.fn(),
  update: jest.fn()
});

const createTenantsRepository = (): jest.Mocked<TenantsRepository> => ({
  findById: jest.fn(),
  findBySlug: jest.fn(),
  updateSettings: jest.fn()
});

const createTenant = (timezone = "America/La_Paz") => ({
  id: "tenant-1",
  name: "Demo Tenant",
  slug: "demo-tenant",
  status: "ACTIVE",
  defaultLanguage: "en",
  defaultCurrency: "USD",
  timezone,
  profile: null
});

const createUseCase = (
  repository = createRepository(),
  tenantsRepository = createTenantsRepository(),
  createAuditEventUseCase = { execute: jest.fn() }
) =>
  new CreateOrganizationRecordUseCase(
    repository,
    tenantsRepository,
    new TimezoneResolutionService(),
    createAuditEventUseCase as never
  );

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

    const createAuditEventUseCase = { execute: jest.fn() };
    const useCase = createUseCase(repository, createTenantsRepository(), createAuditEventUseCase);
    const result = await useCase.execute({
      tenantId: "tenant-1",
      actorUserId: "user-1",
      kind: "department",
      name: "Engineering"
    });

    expect(result.id).toBe("department-1");
    expect(repository.create).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      kind: "department",
      name: "Engineering"
    });
    expect(createAuditEventUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "organization.department.created",
        actorUserId: "user-1",
        resourceId: "department-1"
      })
    );
  });

  it("normalizes location country and timezone before creating records", async () => {
    const repository = createRepository();
    const createdAt = new Date("2026-05-12T10:00:00.000Z");

    repository.create.mockResolvedValue({
      id: "location-1",
      tenantId: "tenant-1",
      name: "Cochabamba HQ",
      country: "BO",
      subdivisionCode: "BO-C",
      city: "Cochabamba",
      timezone: "America/La_Paz",
      status: "ACTIVE",
      createdAt,
      updatedAt: createdAt
    });

    const createAuditEventUseCase = { execute: jest.fn() };
    const tenantsRepository = createTenantsRepository();
    tenantsRepository.findById.mockResolvedValue(createTenant());
    const useCase = createUseCase(repository, tenantsRepository, createAuditEventUseCase);

    await useCase.execute({
      tenantId: "tenant-1",
      actorUserId: "user-1",
      kind: "location",
      name: "Cochabamba HQ",
      country: "bolivia",
      subdivisionCode: "bo-c",
      city: "Cochabamba",
      timezone: "America/La_Paz"
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        country: "BO",
        subdivisionCode: "BO-C",
        timezone: "America/La_Paz"
      })
    );
  });

  it("rejects unsupported location subdivision values", async () => {
    const tenantsRepository = createTenantsRepository();
    tenantsRepository.findById.mockResolvedValue(createTenant());
    const useCase = createUseCase(createRepository(), tenantsRepository);

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "user-1",
        kind: "location",
        name: "Invalid HQ",
        country: "BO",
        subdivisionCode: "US-NY"
      })
    ).rejects.toThrow("Subdivision must be supported for the selected country.");
  });

  it("defaults location country and timezone from tenant timezone when omitted", async () => {
    const repository = createRepository();
    const tenantsRepository = createTenantsRepository();
    const createdAt = new Date("2026-05-12T10:00:00.000Z");

    tenantsRepository.findById.mockResolvedValue(createTenant("America/New_York"));
    repository.create.mockResolvedValue({
      id: "location-1",
      tenantId: "tenant-1",
      name: "Default HQ",
      country: "US",
      timezone: "America/New_York",
      status: "ACTIVE",
      createdAt,
      updatedAt: createdAt
    });

    const useCase = createUseCase(repository, tenantsRepository);

    await useCase.execute({
      tenantId: "tenant-1",
      actorUserId: "user-1",
      kind: "location",
      name: "Default HQ"
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        country: "US",
        timezone: "America/New_York"
      })
    );
  });

  it("falls back to USA-first global location defaults when tenant timezone is unsupported", async () => {
    const repository = createRepository();
    const tenantsRepository = createTenantsRepository();
    const createdAt = new Date("2026-05-12T10:00:00.000Z");

    tenantsRepository.findById.mockResolvedValue(createTenant("Europe/Madrid"));
    repository.create.mockResolvedValue({
      id: "location-1",
      tenantId: "tenant-1",
      name: "Default HQ",
      country: "US",
      timezone: "America/New_York",
      status: "ACTIVE",
      createdAt,
      updatedAt: createdAt
    });

    const useCase = createUseCase(repository, tenantsRepository);

    await useCase.execute({
      tenantId: "tenant-1",
      actorUserId: "user-1",
      kind: "location",
      name: "Default HQ"
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        country: "US",
        timezone: "America/New_York"
      })
    );
  });

  it("rejects unsupported location country and timezone values", async () => {
    const tenantsRepository = createTenantsRepository();
    tenantsRepository.findById.mockResolvedValue(createTenant());
    const useCase = createUseCase(createRepository(), tenantsRepository);

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "user-1",
        kind: "location",
        name: "Invalid HQ",
        country: "ZZ"
      })
    ).rejects.toThrow("Country must be a supported ISO country code.");

    await expect(
      useCase.execute({
        tenantId: "tenant-1",
        actorUserId: "user-1",
        kind: "location",
        name: "Invalid HQ",
        timezone: "not-a-timezone"
      })
    ).rejects.toThrow("Timezone must be a supported IANA timezone.");
  });
});
