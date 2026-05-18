import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { OrganizationSettingsPage } from "./organization-settings-page";

const mutationState = { isLoading: false };
const createOrganizationUnitTypeMock = vi.fn();
const reorderOrganizationUnitTypesMock = vi.fn();

vi.mock("@/hooks/use-current-tenant", () => ({
  useCurrentTenant: () => ({
    tenantSlug: "assuresoft-demo"
  })
}));

vi.mock("../organization-api", () => ({
  useArchiveOrganizationRecordMutation: () => [vi.fn(), mutationState],
  useCreateOrganizationRecordMutation: () => [vi.fn(), mutationState],
  useListOrganizationRecordsQuery: ({ kind }: { kind: string }) => ({
    data:
      kind === "location"
        ? [
            {
              id: "location-1",
              tenantId: "tenant-1",
              name: "Cochabamba HQ",
              country: "BO",
              city: "Cochabamba",
              timezone: "America/La_Paz",
              status: "ACTIVE",
              createdAt: "2026-05-18T00:00:00.000Z",
              updatedAt: "2026-05-18T00:00:00.000Z"
            }
          ]
        : [],
    isError: false,
    isFetching: false
  }),
  useReactivateOrganizationRecordMutation: () => [vi.fn(), mutationState],
  useUpdateOrganizationRecordMutation: () => [vi.fn(), mutationState]
}));

vi.mock("../organization-units-api", () => ({
  useArchiveOrganizationUnitMutation: () => [vi.fn(), mutationState],
  useArchiveOrganizationUnitTypeMutation: () => [vi.fn(), mutationState],
  useCreateOrganizationUnitMutation: () => [vi.fn(), mutationState],
  useCreateOrganizationUnitTypeMutation: () => [createOrganizationUnitTypeMock, mutationState],
  useListOrganizationUnitTypesQuery: () => ({
    data: [
      {
        id: "type-1",
        tenantId: "tenant-1",
        key: "branch",
        name: "Branch",
        sortOrder: 10,
        status: "ACTIVE",
        createdAt: "2026-05-18T00:00:00.000Z",
        updatedAt: "2026-05-18T00:00:00.000Z"
      },
      {
        id: "type-2",
        tenantId: "tenant-1",
        key: "office",
        name: "Office",
        sortOrder: 20,
        status: "ACTIVE",
        createdAt: "2026-05-18T00:00:00.000Z",
        updatedAt: "2026-05-18T00:00:00.000Z"
      }
    ],
    isError: false,
    isFetching: false,
    isLoading: false
  }),
  useListOrganizationUnitsQuery: () => ({
    data: [
      {
        id: "unit-1",
        tenantId: "tenant-1",
        typeId: "type-1",
        type: { id: "type-1", key: "branch", name: "Branch" },
        parentOrganizationUnitId: null,
        parent: null,
        primaryLocationId: "location-1",
        primaryLocation: {
          id: "location-1",
          name: "Cochabamba HQ",
          city: "Cochabamba",
          country: "BO"
        },
        key: "cochabamba",
        name: "Cochabamba",
        legalName: null,
        code: "CBB",
        status: "ACTIVE",
        createdAt: "2026-05-18T00:00:00.000Z",
        updatedAt: "2026-05-18T00:00:00.000Z"
      }
    ],
    isError: false,
    isFetching: false,
    isLoading: false
  }),
  useReorderOrganizationUnitTypesMutation: () => [reorderOrganizationUnitTypesMock, mutationState],
  useReactivateOrganizationUnitMutation: () => [vi.fn(), mutationState],
  useReactivateOrganizationUnitTypeMutation: () => [vi.fn(), mutationState],
  useUpdateOrganizationUnitMutation: () => [vi.fn(), mutationState],
  useUpdateOrganizationUnitTypeMutation: () => [vi.fn(), mutationState]
}));

describe("OrganizationSettingsPage", () => {
  beforeEach(() => {
    createOrganizationUnitTypeMock.mockReset();
    createOrganizationUnitTypeMock.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    reorderOrganizationUnitTypesMock.mockReset();
    reorderOrganizationUnitTypesMock.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it("shows organization unit type and unit tabs", () => {
    render(
      <ToastProvider>
        <OrganizationSettingsPage />
      </ToastProvider>
    );

    expect(screen.getByRole("button", { name: "Organization unit types" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Organization units" })).toBeInTheDocument();
  });

  it("renders organization unit types", () => {
    render(
      <ToastProvider>
        <OrganizationSettingsPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Organization unit types" }));

    expect(screen.getByRole("heading", { name: "Organization unit types" })).toBeInTheDocument();
    expect(screen.getByText("branch")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Sort" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save order" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reorder Branch" })).toBeInTheDocument();
  });

  it("does not expose sort order in the organization unit type drawer", () => {
    render(
      <ToastProvider>
        <OrganizationSettingsPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Organization unit types" }));
    fireEvent.click(screen.getByRole("button", { name: "Add type" }));

    expect(screen.getByRole("heading", { name: "Add organization unit type" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("branch")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Branch")).toBeInTheDocument();
    expect(screen.queryByText("Sort order")).not.toBeInTheDocument();
  });

  it("shows the backend validation message when organization unit type creation fails", async () => {
    createOrganizationUnitTypeMock.mockReturnValueOnce({
      unwrap: () =>
        Promise.reject({
          data: {
            error: {
              code: "CONFLICT",
              message: "Organization unit type key already exists."
            }
          }
        })
    });

    render(
      <ToastProvider>
        <OrganizationSettingsPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Organization unit types" }));
    fireEvent.click(screen.getByRole("button", { name: "Add type" }));
    fireEvent.change(screen.getByPlaceholderText("branch"), { target: { value: "office" } });
    fireEvent.change(screen.getByPlaceholderText("Branch"), { target: { value: "Office" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Organization unit type key already exists.")).toBeInTheDocument();
  });

  it("asks for confirmation before saving organization unit type order changes", async () => {
    render(
      <ToastProvider>
        <OrganizationSettingsPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Organization unit types" }));

    fireEvent.keyDown(screen.getByRole("button", { name: "Reorder Office" }), { key: "ArrowUp" });
    await waitFor(() => expect(screen.getByRole("button", { name: "Save order" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Save order" }));

    expect(screen.getByRole("heading", { name: "Save type order" })).toBeInTheDocument();
    expect(reorderOrganizationUnitTypesMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: "Save order" }).at(-1) as HTMLButtonElement);

    expect(reorderOrganizationUnitTypesMock).toHaveBeenCalledWith({
      tenantSlug: "assuresoft-demo",
      typeIds: ["type-2", "type-1"]
    });
    expect(await screen.findByText("Organization unit type order saved")).toBeInTheDocument();
  });

  it("renders organization units with location kept separate", () => {
    render(
      <ToastProvider>
        <OrganizationSettingsPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Organization units" }));

    expect(screen.getByRole("heading", { name: "Organization units" })).toBeInTheDocument();
    expect(screen.getByText("Cochabamba HQ")).toBeInTheDocument();
  });
});
