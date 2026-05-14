import { NotFoundException } from "@nestjs/common";
import { GetCompanySignupRequestUseCase } from "../../application/use-cases/get-company-signup-request.use-case";
import { ListCompanySignupRequestsUseCase } from "../../application/use-cases/list-company-signup-requests.use-case";
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

describe("ListCompanySignupRequestsUseCase", () => {
  it("normalizes pagination bounds", async () => {
    const repository = createRepository();
    repository.list.mockResolvedValue({ items: [], page: 1, pageSize: 100, total: 0 });
    const useCase = new ListCompanySignupRequestsUseCase(repository);

    await useCase.execute({ page: -10, pageSize: 500, search: "  acme  " });

    expect(repository.list).toHaveBeenCalledWith({
      status: undefined,
      search: "acme",
      page: 1,
      pageSize: 100
    });
  });
});

describe("GetCompanySignupRequestUseCase", () => {
  it("throws not found when the request does not exist", async () => {
    const repository = createRepository();
    repository.findById.mockResolvedValue(null);
    const useCase = new GetCompanySignupRequestUseCase(repository);

    await expect(useCase.execute("missing")).rejects.toBeInstanceOf(NotFoundException);
  });
});
