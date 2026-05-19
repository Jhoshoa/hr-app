import { MeController } from "../../presentation/controllers/me.controller";
import type { ListUserTenantsUseCase } from "../../application/use-cases/list-user-tenants.use-case";

describe("MeController", () => {
  it("returns the authenticated user tenants and platform roles", async () => {
    const listUserTenantsUseCase = {
      execute: jest.fn().mockResolvedValue([
        {
          tenantId: "tenant-1",
          tenantSlug: "assuresoft-demo",
          tenantName: "AssureSoft Demo",
          roleKey: "owner",
          permissions: ["tenant.read"],
          features: ["timesheets"]
        }
      ])
    } as unknown as jest.Mocked<ListUserTenantsUseCase>;
    const controller = new MeController(listUserTenantsUseCase);

    const result = await controller.getMe({
      id: "user-1",
      email: "owner@example.com",
      name: "Owner User",
      externalAuthProvider: "supabase",
      externalAuthUserId: "external-1",
      platformRoles: ["PLATFORM_OWNER"]
    });

    expect(result).toEqual({
      user: {
        id: "user-1",
        email: "owner@example.com",
        name: "Owner User",
        externalAuthProvider: "supabase",
        externalAuthUserId: "external-1",
        platformRoles: ["PLATFORM_OWNER"]
      },
      tenants: [
        {
          tenantId: "tenant-1",
          tenantSlug: "assuresoft-demo",
          tenantName: "AssureSoft Demo",
          roleKey: "owner",
          permissions: ["tenant.read"],
          features: ["timesheets"]
        }
      ],
      platformRoles: ["PLATFORM_OWNER"]
    });
    expect(listUserTenantsUseCase.execute).toHaveBeenCalledWith("user-1");
  });
});
