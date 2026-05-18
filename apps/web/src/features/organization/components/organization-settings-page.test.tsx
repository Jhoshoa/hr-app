import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { OrganizationSettingsPage } from "./organization-settings-page";

const mutationState = { isLoading: false };

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
  useCreateOrganizationUnitTypeMutation: () => [vi.fn(), mutationState],
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
      }
    ],
    isError: false
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
    isError: false
  }),
  useReactivateOrganizationUnitMutation: () => [vi.fn(), mutationState],
  useReactivateOrganizationUnitTypeMutation: () => [vi.fn(), mutationState],
  useUpdateOrganizationUnitMutation: () => [vi.fn(), mutationState],
  useUpdateOrganizationUnitTypeMutation: () => [vi.fn(), mutationState]
}));

describe("OrganizationSettingsPage", () => {
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
