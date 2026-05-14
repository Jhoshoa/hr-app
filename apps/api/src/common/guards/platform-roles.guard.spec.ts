import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import type { PlatformRoleKey } from "@prisma/client";
import { PlatformRolesGuard } from "./platform-roles.guard";

const createContext = (user?: { platformRoles: PlatformRoleKey[] }): ExecutionContext => ({
  getClass: jest.fn(),
  getHandler: jest.fn(),
  switchToHttp: jest.fn(() => ({
    getRequest: jest.fn(() => ({ user }))
  }))
} as unknown as ExecutionContext);

const createReflector = (
  options: { isPublic?: boolean; requiredRoles?: PlatformRoleKey[] } = {}
): Reflector => ({
  getAllAndOverride: jest.fn((key: unknown) => {
    if (key === "isPublic") {
      return options.isPublic;
    }

    if (key === "requiredPlatformRoles") {
      return options.requiredRoles;
    }

    return undefined;
  })
} as unknown as Reflector);

describe("PlatformRolesGuard", () => {
  it("allows public routes", () => {
    const guard = new PlatformRolesGuard(createReflector({ isPublic: true }));

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it("allows routes without required platform roles", () => {
    const guard = new PlatformRolesGuard(createReflector());

    expect(guard.canActivate(createContext({ platformRoles: [] }))).toBe(true);
  });

  it("allows users with one of the required platform roles", () => {
    const guard = new PlatformRolesGuard(
      createReflector({ requiredRoles: ["PLATFORM_OWNER", "PLATFORM_ADMIN"] })
    );

    expect(guard.canActivate(createContext({ platformRoles: ["PLATFORM_ADMIN"] }))).toBe(true);
  });

  it("throws unauthorized when required platform roles exist but user is missing", () => {
    const guard = new PlatformRolesGuard(
      createReflector({ requiredRoles: ["PLATFORM_OWNER"] })
    );

    expect(() => guard.canActivate(createContext())).toThrow(UnauthorizedException);
  });

  it("throws forbidden when the user does not have a required platform role", () => {
    const guard = new PlatformRolesGuard(
      createReflector({ requiredRoles: ["PLATFORM_OWNER"] })
    );

    expect(() => guard.canActivate(createContext({ platformRoles: ["PLATFORM_SUPPORT"] }))).toThrow(
      ForbiddenException
    );
  });
});
