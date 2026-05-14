import { describe, expect, it } from "vitest";
import { hasAnyPlatformRole } from "./use-platform-roles";

describe("hasAnyPlatformRole", () => {
  it("allows access when no platform role is required", () => {
    expect(hasAnyPlatformRole([], [])).toBe(true);
  });

  it("allows access when one required role matches", () => {
    expect(hasAnyPlatformRole(["PLATFORM_SUPPORT"], ["PLATFORM_OWNER", "PLATFORM_SUPPORT"])).toBe(true);
  });

  it("denies access when none of the required roles match", () => {
    expect(hasAnyPlatformRole(["PLATFORM_SUPPORT"], ["PLATFORM_OWNER", "PLATFORM_ADMIN"])).toBe(false);
  });
});
