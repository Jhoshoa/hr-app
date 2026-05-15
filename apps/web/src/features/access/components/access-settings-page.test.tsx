import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { AccessSettingsPage } from "./access-settings-page";

const currentTenant = vi.fn();
const currentUser = vi.fn();
let queryState = { isError: false, isFetching: false };
let getRoleState = { data: undefined, isFetching: false };
const mutationState = { isLoading: false };

vi.mock("@/hooks/use-current-tenant", () => ({
  useCurrentTenant: () => currentTenant()
}));

vi.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => currentUser()
}));

vi.mock("../access-api", () => ({
  useArchiveRoleMutation: () => [vi.fn(), mutationState],
  useCancelTenantInvitationMutation: () => [vi.fn(), mutationState],
  useCreateRoleMutation: () => [vi.fn(), mutationState],
  useCreateTenantInvitationMutation: () => [vi.fn(), mutationState],
  useDisableTenantUserMutation: () => [vi.fn(), mutationState],
  useGetRoleQuery: () => getRoleState,
  useListPermissionsQuery: () => ({ data: [], ...queryState }),
  useListRolesQuery: () => ({
    data: queryState.isFetching
      ? undefined
      : [
          {
            id: "role-1",
            tenantId: "tenant-1",
            key: "hr_admin",
            name: "HR Admin",
            description: null,
            isSystemRole: true,
            status: "ACTIVE",
            memberCount: 1,
            permissionCount: 4,
            createdAt: "2026-05-15T00:00:00.000Z",
            updatedAt: "2026-05-15T00:00:00.000Z"
          }
        ],
    ...queryState
  }),
  useListTenantInvitationsQuery: () => ({ data: [], ...queryState }),
  useListTenantUsersQuery: () => ({
    data: queryState.isFetching
      ? undefined
      : [
          {
            membershipId: "membership-1",
            userId: "user-1",
            email: "ana@example.com",
            name: "Ana",
            userStatus: "ACTIVE",
            membershipStatus: "ACTIVE",
            roles: [{ id: "role-1", key: "hr_admin", name: "HR Admin", isSystemRole: true, status: "ACTIVE" }],
            effectivePermissions: ["users.read"],
            invitedAt: "2026-05-15T00:00:00.000Z",
            joinedAt: "2026-05-15T00:00:00.000Z",
            createdAt: "2026-05-15T00:00:00.000Z",
            updatedAt: "2026-05-15T00:00:00.000Z"
          }
        ],
    ...queryState
  }),
  useReactivateRoleMutation: () => [vi.fn(), mutationState],
  useReactivateTenantUserMutation: () => [vi.fn(), mutationState],
  useResendTenantInvitationMutation: () => [vi.fn(), mutationState],
  useUpdateRoleMutation: () => [vi.fn(), mutationState],
  useUpdateRolePermissionsMutation: () => [vi.fn(), mutationState],
  useUpdateTenantUserRolesMutation: () => [vi.fn(), mutationState]
}));

describe("AccessSettingsPage", () => {
  beforeEach(() => {
    queryState = { isError: false, isFetching: false };
    getRoleState = { data: undefined, isFetching: false };
    currentTenant.mockReturnValue({
      tenantSlug: "andes",
      permissions: ["users.read", "users.manage", "roles.manage"]
    });
    currentUser.mockReturnValue({ id: "user-admin", email: "admin@example.com" });
  });

  it("renders access tabs and tenant users for admins", () => {
    render(
      <ToastProvider>
        <AccessSettingsPage />
      </ToastProvider>
    );

    expect(screen.getByRole("button", { name: "Users" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Roles" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Invitations" })).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
  });

  it("blocks the page when the tenant lacks access permissions", () => {
    currentTenant.mockReturnValue({
      tenantSlug: "andes",
      permissions: ["organization.read"]
    });

    render(
      <ToastProvider>
        <AccessSettingsPage />
      </ToastProvider>
    );

    expect(screen.getByText("Access is not available")).toBeInTheDocument();
  });

  it("shows table skeleton rows before the initial users response resolves", () => {
    queryState = { isError: false, isFetching: true };

    vi.mocked(currentTenant).mockReturnValue({
      tenantSlug: "andes",
      permissions: ["users.read", "users.manage"]
    });

    render(
      <ToastProvider>
        <AccessSettingsPage />
      </ToastProvider>
    );

    expect(screen.queryByText("No tenant users exist.")).not.toBeInTheDocument();
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("shows a role form skeleton while cloned role details load", () => {
    getRoleState = { data: undefined, isFetching: true };

    render(
      <ToastProvider>
        <AccessSettingsPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Roles" }));
    fireEvent.click(screen.getByRole("button", { name: "Clone HR Admin" }));

    expect(screen.getByLabelText("Loading role details")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
