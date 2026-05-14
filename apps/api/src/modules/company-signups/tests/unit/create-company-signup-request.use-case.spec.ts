import { ConflictException } from "@nestjs/common";
import { CreateCompanySignupRequestUseCase } from "../../application/use-cases/create-company-signup-request.use-case";
import type { CompanySignupRequestsRepository } from "../../domain/ports/company-signup-requests.repository.port";
import type { EventBus } from "../../../../events/event-bus.port";

const createRepository = (): jest.Mocked<CompanySignupRequestsRepository> => ({
  create: jest.fn(),
  list: jest.fn(),
  findById: jest.fn(),
  tenantSlugExists: jest.fn(),
  pendingRequestExistsForSlug: jest.fn(),
  pendingRequestExistsForAdminEmail: jest.fn(),
  userExistsByEmail: jest.fn(),
  countPendingRequestsForCompanyWebsite: jest.fn()
});

const createEventBus = (): jest.Mocked<EventBus> => ({
  publish: jest.fn(),
  publishMany: jest.fn()
});

const validInput = {
  companyName: " Acme Corp ",
  desiredTenantSlug: "Acme-Corp",
  adminFirstName: " Ana ",
  adminLastName: " Owner ",
  adminEmail: "ANA@EXAMPLE.COM",
  companyWebsite: "https://www.acme.com/",
  companySize: "51-200",
  country: "BO",
  timezone: "America/La_Paz",
  preferredLanguage: "es",
  phone: "+591 70000000",
  message: "Interested in HR app"
};

describe("CreateCompanySignupRequestUseCase", () => {
  it("creates a pending signup request without creating tenant access", async () => {
    const repository = createRepository();
    const eventBus = createEventBus();
    repository.tenantSlugExists.mockResolvedValue(false);
    repository.pendingRequestExistsForSlug.mockResolvedValue(false);
    repository.pendingRequestExistsForAdminEmail.mockResolvedValue(false);
    repository.create.mockImplementation(async (input) => ({
      id: "request-1",
      ...input,
      companyWebsite: input.companyWebsite ?? null,
      companySize: input.companySize ?? null,
      country: input.country ?? null,
      timezone: input.timezone ?? null,
      phone: input.phone ?? null,
      message: input.message ?? null,
      status: "PENDING",
      approvedTenantId: null,
      reviewedByUserId: null,
      reviewedAt: null,
      rejectionReason: null,
      createdAt: new Date("2026-05-13T00:00:00.000Z"),
      updatedAt: new Date("2026-05-13T00:00:00.000Z")
    }));

    const useCase = new CreateCompanySignupRequestUseCase(repository, eventBus);
    const result = await useCase.execute(validInput);

    expect(repository.create).toHaveBeenCalledWith({
      companyName: "Acme Corp",
      desiredTenantSlug: "acme-corp",
      adminFirstName: "Ana",
      adminLastName: "Owner",
      adminEmail: "ana@example.com",
      companyWebsite: "acme.com",
      companySize: "51-200",
      country: "BO",
      timezone: "America/La_Paz",
      preferredLanguage: "es",
      phone: "+591 70000000",
      message: "Interested in HR app"
    });
    expect(result.status).toBe("PENDING");
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "CompanySignupRequestSubmitted",
        payload: {
          companySignupRequestId: "request-1",
          desiredTenantSlug: "acme-corp",
          adminEmail: "ana@example.com"
        }
      })
    );
  });

  it("rejects an existing tenant slug", async () => {
    const repository = createRepository();
    const eventBus = createEventBus();
    repository.tenantSlugExists.mockResolvedValue(true);

    const useCase = new CreateCompanySignupRequestUseCase(repository, eventBus);

    await expect(useCase.execute(validInput)).rejects.toBeInstanceOf(ConflictException);
    expect(repository.create).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it("rejects a pending request for the same admin email", async () => {
    const repository = createRepository();
    const eventBus = createEventBus();
    repository.tenantSlugExists.mockResolvedValue(false);
    repository.pendingRequestExistsForSlug.mockResolvedValue(false);
    repository.pendingRequestExistsForAdminEmail.mockResolvedValue(true);

    const useCase = new CreateCompanySignupRequestUseCase(repository, eventBus);

    await expect(useCase.execute(validInput)).rejects.toBeInstanceOf(ConflictException);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
