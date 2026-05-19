import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { TenantFeatureService } from "../features/tenant-feature.service";
import { TenantFeatureGuard } from "./tenant-feature.guard";
import type { RequestWithContext } from "../types/request-context";

const createExecutionContext = (request: Partial<RequestWithContext>) =>
  ({
    getClass: jest.fn(),
    getHandler: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => request
    })
  }) as never;

describe("TenantFeatureGuard", () => {
  it("allows routes without required features", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined)
    } as unknown as Reflector;
    const guard = new TenantFeatureGuard(reflector, new TenantFeatureService());

    expect(guard.canActivate(createExecutionContext({}))).toBe(true);
  });

  it("allows tenants with all required features", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(["timesheets"])
    } as unknown as Reflector;
    const guard = new TenantFeatureGuard(reflector, new TenantFeatureService());

    expect(
      guard.canActivate(
        createExecutionContext({
          tenant: {
            id: "tenant-1",
            slug: "assuresoft-demo",
            roleKey: "owner",
            permissions: [],
            features: ["timesheets"]
          }
        })
      )
    ).toBe(true);
  });

  it("rejects tenants missing a required feature", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(["timesheets"])
    } as unknown as Reflector;
    const guard = new TenantFeatureGuard(reflector, new TenantFeatureService());

    expect(() =>
      guard.canActivate(
        createExecutionContext({
          tenant: {
            id: "tenant-1",
            slug: "assuresoft-demo",
            roleKey: "owner",
            permissions: [],
            features: []
          }
        })
      )
    ).toThrow(ForbiddenException);
  });
});
