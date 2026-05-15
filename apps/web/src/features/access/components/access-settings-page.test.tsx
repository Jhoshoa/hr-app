import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { AccessSettingsPage } from "./access-settings-page";

const currentTenant = vi.fn();
const currentUser = vi.fn();
let queryState = { isError: false, isFetching: false };
let getRoleState: { data: unknown; isFetching: boolean } = { data: undefined, isFetching: false };
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
          },
          {
            id: "role-2",
            tenantId: "tenant-1",
            key: "supervisor",
            name: "Supervisor",
            description: "Team supervisor",
            isSystemRole: false,
            status: "ACTIVE",
            memberCount: 0,
            permissionCount: 1,
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

  it("shows a role form skeleton while edited role details are not available yet", () => {
    getRoleState = { data: undefined, isFetching: false };

    render(
      <ToastProvider>
        <AccessSettingsPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Roles" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit Supervisor" }));

    expect(screen.getByLabelText("Loading role details")).toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("keeps user role save disabled until role selection changes", () => {
    render(
      <ToastProvider>
        <AccessSettingsPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit roles for ana@example.com" }));

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox", { name: /Supervisor/ }));

    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("keeps self access save disabled even when role selection changes", () => {
    currentUser.mockReturnValue({ id: "user-1", email: "ana@example.com" });

    render(
      <ToastProvider>
        <AccessSettingsPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit roles for ana@example.com" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Supervisor/ }));

    expect(screen.getByText("Self access changes are blocked by the backend.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("keeps edit role save disabled until metadata changes", () => {
    getRoleState = {
      isFetching: false,
      data: {
        id: "role-2",
        tenantId: "tenant-1",
        key: "supervisor",
        name: "Supervisor",
        description: "Team supervisor",
        isSystemRole: false,
        status: "ACTIVE",
        memberCount: 0,
        permissionCount: 1,
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
        permissions: []
      }
    };

    render(
      <ToastProvider>
        <AccessSettingsPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Roles" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit Supervisor" }));

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Senior Supervisor" } });

    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });
});
