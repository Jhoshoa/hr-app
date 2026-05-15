import { describe, expect, it } from "vitest";
import { accessPermissions, hasAnyAccessPermission } from "./access-permissions";

describe("access-permissions", () => {
  it("uses OR semantics for access page visibility", () => {
    expect(hasAnyAccessPermission(["users.read"], accessPermissions.viewAccess)).toBe(true);
    expect(hasAnyAccessPermission(["organization.read"], accessPermissions.viewAccess)).toBe(false);
  });
});
