import { ResolveAuthenticatedUserUseCase } from "../../application/use-cases/resolve-authenticated-user.use-case";
import type { UsersRepository } from "../../domain/ports/users.repository.port";

const createRepository = (): jest.Mocked<UsersRepository> => ({
  findByExternalAuthId: jest.fn(),
  createFromExternalUser: jest.fn(),
  findTenantMembershipsByUserId: jest.fn(),
  findTenantMembershipContext: jest.fn()
});

describe("ResolveAuthenticatedUserUseCase", () => {
  it("returns an existing internal user for an external auth user", async () => {
    const repository = createRepository();
    repository.findByExternalAuthId.mockResolvedValue({
      id: "user-1",
      email: "hr@example.com",
      externalAuthProvider: "supabase",
      externalAuthUserId: "external-1"
    });

    const useCase = new ResolveAuthenticatedUserUseCase(repository);
    const result = await useCase.execute({
      provider: "supabase",
      providerUserId: "external-1",
      email: "hr@example.com"
    });

    expect(result.id).toBe("user-1");
    expect(repository.createFromExternalUser).not.toHaveBeenCalled();
  });

  it("creates an internal user when the external auth user is new", async () => {
    const repository = createRepository();
    repository.findByExternalAuthId.mockResolvedValue(null);
    repository.createFromExternalUser.mockResolvedValue({
      id: "user-2",
      email: "new@example.com",
      externalAuthProvider: "supabase",
      externalAuthUserId: "external-2"
    });

    const useCase = new ResolveAuthenticatedUserUseCase(repository);
    const result = await useCase.execute({
      provider: "supabase",
      providerUserId: "external-2",
      email: "new@example.com"
    });

    expect(result.id).toBe("user-2");
    expect(repository.createFromExternalUser).toHaveBeenCalledWith({
      provider: "supabase",
      providerUserId: "external-2",
      email: "new@example.com"
    });
  });
});
