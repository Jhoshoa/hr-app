import type { ConfigService } from "@nestjs/config";
import { ResolveAuthenticatedUserUseCase } from "../../application/use-cases/resolve-authenticated-user.use-case";
import type { UsersRepository } from "../../domain/ports/users.repository.port";

const createRepository = (): jest.Mocked<UsersRepository> => ({
  findByExternalAuthId: jest.fn(),
  createFromExternalUser: jest.fn(),
  syncExternalUserProfile: jest.fn(),
  ensureDevelopmentTenantMembership: jest.fn(),
  findTenantMembershipsByUserId: jest.fn(),
  findTenantMembershipContext: jest.fn()
});

const createConfigService = (): Pick<ConfigService, "get" | "getOrThrow"> => ({
  get: jest.fn((key: string) => {
    if (key === "app.nodeEnv") {
      return "test";
    }

    if (key === "app.autoJoinDefaultTenant") {
      return false;
    }

    return undefined;
  }),
  getOrThrow: jest.fn()
});

describe("ResolveAuthenticatedUserUseCase", () => {
  it("returns an existing internal user for an external auth user", async () => {
    const repository = createRepository();
    repository.findByExternalAuthId.mockResolvedValue({
      id: "user-1",
      email: "hr@example.com",
      name: "HR User",
      externalAuthProvider: "supabase",
      externalAuthUserId: "external-1"
    });
    repository.syncExternalUserProfile.mockResolvedValue({
      id: "user-1",
      email: "hr@example.com",
      name: "HR User Updated",
      externalAuthProvider: "supabase",
      externalAuthUserId: "external-1"
    });

    const useCase = new ResolveAuthenticatedUserUseCase(
      createConfigService() as ConfigService,
      repository
    );
    const result = await useCase.execute({
      provider: "supabase",
      providerUserId: "external-1",
      email: "hr@example.com",
      name: "HR User Updated"
    });

    expect(result.id).toBe("user-1");
    expect(result.name).toBe("HR User Updated");
    expect(repository.createFromExternalUser).not.toHaveBeenCalled();
    expect(repository.syncExternalUserProfile).toHaveBeenCalledWith("user-1", {
      provider: "supabase",
      providerUserId: "external-1",
      email: "hr@example.com",
      name: "HR User Updated"
    });
    expect(repository.ensureDevelopmentTenantMembership).not.toHaveBeenCalled();
  });

  it("creates an internal user when the external auth user is new", async () => {
    const repository = createRepository();
    repository.findByExternalAuthId.mockResolvedValue(null);
    repository.createFromExternalUser.mockResolvedValue({
      id: "user-2",
      email: "new@example.com",
      name: "New User",
      externalAuthProvider: "supabase",
      externalAuthUserId: "external-2"
    });

    const useCase = new ResolveAuthenticatedUserUseCase(
      createConfigService() as ConfigService,
      repository
    );
    const result = await useCase.execute({
      provider: "supabase",
      providerUserId: "external-2",
      email: "new@example.com",
      name: "New User"
    });

    expect(result.id).toBe("user-2");
    expect(result.name).toBe("New User");
    expect(repository.createFromExternalUser).toHaveBeenCalledWith({
      provider: "supabase",
      providerUserId: "external-2",
      email: "new@example.com",
      name: "New User"
    });
    expect(repository.syncExternalUserProfile).not.toHaveBeenCalled();
    expect(repository.ensureDevelopmentTenantMembership).not.toHaveBeenCalled();
  });
});
