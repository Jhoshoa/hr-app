import { CheckCompanySignupAvailabilityUseCase } from "../../application/use-cases/check-company-signup-availability.use-case";
import type { CompanySignupRequestsRepository } from "../../domain/ports/company-signup-requests.repository.port";

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

describe("CheckCompanySignupAvailabilityUseCase", () => {
  it("marks reserved tenant slugs as unavailable", async () => {
    const repository = createRepository();
    const useCase = new CheckCompanySignupAvailabilityUseCase(repository);

    await expect(useCase.checkTenantSlug("platform")).resolves.toEqual({
      value: "platform",
      available: false,
      reason: "RESERVED"
    });
  });

  it("marks tenant slugs with pending requests as unavailable", async () => {
    const repository = createRepository();
    repository.tenantSlugExists.mockResolvedValue(false);
    repository.pendingRequestExistsForSlug.mockResolvedValue(true);
    const useCase = new CheckCompanySignupAvailabilityUseCase(repository);

    await expect(useCase.checkTenantSlug("Acme-Demo")).resolves.toEqual({
      value: "acme-demo",
      available: false,
      reason: "PENDING_REQUEST_EXISTS"
    });
  });

  it("returns admin email availability with existing user signal", async () => {
    const repository = createRepository();
    repository.pendingRequestExistsForAdminEmail.mockResolvedValue(false);
    repository.userExistsByEmail.mockResolvedValue(true);
    const useCase = new CheckCompanySignupAvailabilityUseCase(repository);

    await expect(useCase.checkAdminEmail("OWNER@EXAMPLE.COM")).resolves.toEqual({
      value: "owner@example.com",
      available: true,
      reason: undefined,
      existingUser: true,
      canReuseExistingUser: true
    });
  });

  it("returns website duplicate warnings without hard blocking", async () => {
    const repository = createRepository();
    repository.countPendingRequestsForCompanyWebsite.mockResolvedValue(2);
    const useCase = new CheckCompanySignupAvailabilityUseCase(repository);

    await expect(useCase.checkCompanyWebsite("https://www.acme.com/")).resolves.toEqual({
      value: "acme.com",
      duplicateWarning: true,
      matchingPendingRequestCount: 2
    });
  });
});
