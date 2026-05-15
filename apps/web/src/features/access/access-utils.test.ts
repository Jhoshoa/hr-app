import { describe, expect, it, vi } from "vitest";
import type { AccessPermission, TenantInvitation } from "./access-types";
import {
  canCancelInvitation,
  canResendInvitation,
  getInvitationDisplayStatus,
  groupPermissionKeysForDisplay,
  groupPermissionsByModule,
  roleKeyFromName
} from "./access-utils";

describe("access-utils", () => {
  it("derives expired display status from expiresAt without mutating backend state", () => {
    vi.setSystemTime(new Date("2026-05-15T12:00:00.000Z"));
    const invitation = {
      status: "PENDING",
      expiresAt: "2026-05-15T11:59:00.000Z",
      resendCount: 0
    } as Pick<TenantInvitation, "status" | "expiresAt" | "resendCount">;

    expect(getInvitationDisplayStatus(invitation)).toBe("EXPIRED");
    expect(canResendInvitation(invitation)).toBe(true);
    expect(canCancelInvitation(invitation)).toBe(true);

    vi.useRealTimers();
  });

  it("blocks resend when the max count is reached", () => {
    expect(
      canResendInvitation({
        status: "PENDING",
        expiresAt: "2026-05-22T00:00:00.000Z",
        resendCount: 3
      })
    ).toBe(false);
  });

  it("groups permissions by module and sorts by sort order", () => {
    const permissions = [
      { id: "2", key: "users.manage", module: "Users", sortOrder: 20 },
      { id: "1", key: "users.read", module: "Users", sortOrder: 10 },
      { id: "3", key: "tenant.read", module: "Tenant", sortOrder: 10 }
    ] as AccessPermission[];

    expect(groupPermissionsByModule(permissions)).toEqual([
      expect.objectContaining({ moduleName: "Tenant" }),
      expect.objectContaining({
        moduleName: "Users",
        permissions: [
          expect.objectContaining({ key: "users.read" }),
          expect.objectContaining({ key: "users.manage" })
        ]
      })
    ]);
  });

  it("creates stable role keys from names", () => {
    expect(roleKeyFromName("Finance Reviewer!")).toBe("finance_reviewer");
  });

  it("groups effective permission keys with catalog metadata and fallback modules", () => {
    const catalog = [
      {
        id: "1",
        key: "users.read",
        description: "Read users",
        module: "Users",
        sortOrder: 10,
        isCritical: false
      },
      {
        id: "2",
        key: "tenant.manage",
        description: "Manage tenant",
        module: "Tenant",
        sortOrder: 20,
        isCritical: true
      }
    ] as AccessPermission[];

    expect(groupPermissionKeysForDisplay(["employees.read", "tenant.manage", "users.read"], catalog)).toEqual([
      expect.objectContaining({
        moduleName: "Employees",
        permissions: [expect.objectContaining({ key: "employees.read" })]
      }),
      expect.objectContaining({
        moduleName: "Tenant",
        permissions: [expect.objectContaining({ key: "tenant.manage", isCritical: true })]
      }),
      expect.objectContaining({
        moduleName: "Users",
        permissions: [expect.objectContaining({ key: "users.read", description: "Read users" })]
      })
    ]);
  });
});
