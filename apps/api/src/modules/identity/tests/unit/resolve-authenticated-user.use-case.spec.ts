import type { ConfigService } from "@nestjs/config";
import { ConflictException } from "@nestjs/common";
import { ResolveAuthenticatedUserUseCase } from "../../application/use-cases/resolve-authenticated-user.use-case";
import type { UsersRepository } from "../../domain/ports/users.repository.port";

const createRepository = (): jest.Mocked<UsersRepository> => ({
  findByExternalAuthId: jest.fn(),
  findByEmail: jest.fn(),
  linkExternalAuthUser: jest.fn(),
  createFromExternalUser: jest.fn(),
  syncExternalUserProfile: jest.fn(),
  ensureDevelopmentTenantMembership: jest.fn(),
  findTenantMembershipsByUserId: jest.fn(),
  findTenantMembershipContext: jest.fn(),
  findPlatformRolesByUserId: jest.fn()
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
    repository.findPlatformRolesByUserId.mockResolvedValue(["PLATFORM_OWNER"]);

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
    expect(result.platformRoles).toEqual(["PLATFORM_OWNER"]);
    expect(repository.findByEmail).not.toHaveBeenCalled();
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
    repository.findByEmail.mockResolvedValue(null);
    repository.createFromExternalUser.mockResolvedValue({
      id: "user-2",
      email: "new@example.com",
      name: "New User",
      externalAuthProvider: "supabase",
      externalAuthUserId: "external-2"
    });
    repository.findPlatformRolesByUserId.mockResolvedValue([]);

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
    expect(result.platformRoles).toEqual([]);
    expect(repository.findByEmail).toHaveBeenCalledWith("new@example.com");
    expect(repository.createFromExternalUser).toHaveBeenCalledWith({
      provider: "supabase",
      providerUserId: "external-2",
      email: "new@example.com",
      name: "New User"
    });
    expect(repository.syncExternalUserProfile).not.toHaveBeenCalled();
    expect(repository.ensureDevelopmentTenantMembership).not.toHaveBeenCalled();
  });

  it("links a pending user by email when the external auth user signs in", async () => {
    const repository = createRepository();
    repository.findByExternalAuthId.mockResolvedValue(null);
    repository.findByEmail.mockResolvedValue({
      id: "user-3",
      email: "owner@example.com",
      name: "Pending Owner"
    });
    repository.linkExternalAuthUser.mockResolvedValue({
      id: "user-3",
      email: "owner@example.com",
      name: "Tenant Owner",
      externalAuthProvider: "supabase",
      externalAuthUserId: "external-3"
    });
    repository.findPlatformRolesByUserId.mockResolvedValue([]);

    const useCase = new ResolveAuthenticatedUserUseCase(
      createConfigService() as ConfigService,
      repository
    );
    const externalUser = {
      provider: "supabase",
      providerUserId: "external-3",
      email: "owner@example.com",
      name: "Tenant Owner"
    };

    const result = await useCase.execute(externalUser);

    expect(result.id).toBe("user-3");
    expect(result.externalAuthProvider).toBe("supabase");
    expect(result.externalAuthUserId).toBe("external-3");
    expect(repository.linkExternalAuthUser).toHaveBeenCalledWith("user-3", externalUser);
    expect(repository.createFromExternalUser).not.toHaveBeenCalled();
  });

  it("rejects an email match already linked to another external identity", async () => {
    const repository = createRepository();
    repository.findByExternalAuthId.mockResolvedValue(null);
    repository.findByEmail.mockResolvedValue({
      id: "user-4",
      email: "conflict@example.com",
      name: "Existing User",
      externalAuthProvider: "supabase",
      externalAuthUserId: "different-external-id"
    });

    const useCase = new ResolveAuthenticatedUserUseCase(
      createConfigService() as ConfigService,
      repository
    );

    await expect(
      useCase.execute({
        provider: "supabase",
        providerUserId: "external-4",
        email: "conflict@example.com",
        name: "Existing User"
      })
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.linkExternalAuthUser).not.toHaveBeenCalled();
    expect(repository.createFromExternalUser).not.toHaveBeenCalled();
    expect(repository.findPlatformRolesByUserId).not.toHaveBeenCalled();
  });
});
