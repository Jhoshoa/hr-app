import { ForbiddenException } from "@nestjs/common";
import { ResolveTenantContextUseCase } from "../../application/use-cases/resolve-tenant-context.use-case";
import type { UsersRepository } from "../../domain/ports/users.repository.port";

const createRepository = (): jest.Mocked<UsersRepository> => ({
  findByExternalAuthId: jest.fn(),
  createFromExternalUser: jest.fn(),
  findTenantMembershipsByUserId: jest.fn(),
  findTenantMembershipContext: jest.fn()
});

describe("ResolveTenantContextUseCase", () => {
  it("returns tenant context when user has an active membership", async () => {
    const repository = createRepository();
    repository.findTenantMembershipContext.mockResolvedValue({
      tenantId: "tenant-1",
      tenantSlug: "assuresoft-demo",
      roleKey: "owner",
      permissions: ["tenant.read"]
    });

    const useCase = new ResolveTenantContextUseCase(repository);
    const result = await useCase.execute({
      userId: "user-1",
      tenantSlug: "assuresoft-demo"
    });

    expect(result.permissions).toEqual(["tenant.read"]);
  });

  it("throws forbidden when user has no membership", async () => {
    const repository = createRepository();
    repository.findTenantMembershipContext.mockResolvedValue(null);

    const useCase = new ResolveTenantContextUseCase(repository);

    await expect(
      useCase.execute({
        userId: "user-1",
        tenantSlug: "unknown"
      })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
