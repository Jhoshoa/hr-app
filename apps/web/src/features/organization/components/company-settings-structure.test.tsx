import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { CompanySettingsPage } from "@/features/tenants/components/company-settings-page";
import type { OrganizationUnit } from "../organization-units-types";

const mutationState = { isLoading: false };
const dispatchMock = vi.fn();
const archiveOrganizationUnitMock = vi.fn();
const archiveOrganizationUnitTypeMock = vi.fn();
const createOrganizationUnitTypeMock = vi.fn();
const createOrganizationUnitMock = vi.fn();
const createOrganizationRecordMock = vi.fn();
const deleteOrganizationUnitMock = vi.fn();
const deleteOrganizationUnitTypeMock = vi.fn();
const reorderOrganizationUnitTypesMock = vi.fn();
const updateCurrentTenantMock = vi.fn();
const defaultOrganizationUnitsData: OrganizationUnit[] = [
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
  },
  {
    id: "unit-2",
    tenantId: "tenant-1",
    typeId: "type-1",
    type: { id: "type-1", key: "branch", name: "Branch" },
    parentOrganizationUnitId: null,
    parent: null,
    primaryLocationId: null,
    primaryLocation: null,
    key: "archived_unit",
    name: "Archived Unit",
    legalName: null,
    code: "ARC",
    status: "ARCHIVED",
    createdAt: "2026-05-18T00:00:00.000Z",
    updatedAt: "2026-05-18T00:00:00.000Z"
  }
];
const organizationUnitsData: OrganizationUnit[] = [...defaultOrganizationUnitsData];
const tenantData = {
  id: "tenant-1",
  name: "AssureSoft Demo",
  slug: "assuresoft-demo",
  status: "ACTIVE",
  defaultLanguage: "en",
  defaultCurrency: "USD",
  timezone: "America/New_York",
  profile: {
    website: "example.com",
    companySize: "11-50",
    country: "BO",
    phone: "+59170000000",
    contactEmail: "admin@example.com"
  }
};
const locationRecordsData = [
  {
    id: "location-1",
    tenantId: "tenant-1",
    name: "Cochabamba HQ",
    country: "BO",
    subdivisionCode: "BO-C",
    city: "Cochabamba",
    timezone: "America/La_Paz",
    status: "ACTIVE",
    createdAt: "2026-05-18T00:00:00.000Z",
    updatedAt: "2026-05-18T00:00:00.000Z"
  }
];
const organizationUnitTypesData = [
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
  },
  {
    id: "type-3",
    tenantId: "tenant-1",
    key: "archived_type",
    name: "Archived Type",
    sortOrder: 30,
    status: "ARCHIVED",
    createdAt: "2026-05-18T00:00:00.000Z",
    updatedAt: "2026-05-18T00:00:00.000Z"
  }
];

vi.mock("@/hooks/use-current-tenant", () => ({
  useCurrentTenant: () => ({
    tenantSlug: "assuresoft-demo"
  })
}));

vi.mock("@/store/hooks", () => ({
  useAppDispatch: () => dispatchMock
}));

vi.mock("@/features/tenants/tenants-api", () => ({
  useGetCurrentTenantQuery: () => ({
    data: tenantData,
    isError: false,
    isFetching: false
  }),
  useUpdateCurrentTenantMutation: () => [updateCurrentTenantMock, mutationState]
}));

vi.mock("../organization-api", () => ({
  useArchiveOrganizationRecordMutation: () => [vi.fn(), mutationState],
  useCreateOrganizationRecordMutation: () => [createOrganizationRecordMock, mutationState],
  useListOrganizationRecordsQuery: ({ kind }: { kind: string }) => ({
    data: kind === "location" ? locationRecordsData : [],
    isError: false,
    isFetching: false
  }),
  useReactivateOrganizationRecordMutation: () => [vi.fn(), mutationState],
  useUpdateOrganizationRecordMutation: () => [vi.fn(), mutationState]
}));

vi.mock("../organization-units-api", () => ({
  useArchiveOrganizationUnitMutation: () => [archiveOrganizationUnitMock, mutationState],
  useArchiveOrganizationUnitTypeMutation: () => [archiveOrganizationUnitTypeMock, mutationState],
  useCreateOrganizationUnitMutation: () => [createOrganizationUnitMock, mutationState],
  useCreateOrganizationUnitTypeMutation: () => [createOrganizationUnitTypeMock, mutationState],
  useDeleteOrganizationUnitMutation: () => [deleteOrganizationUnitMock, mutationState],
  useDeleteOrganizationUnitTypeMutation: () => [deleteOrganizationUnitTypeMock, mutationState],
  useListOrganizationUnitTypesQuery: () => ({
    data: organizationUnitTypesData,
    isError: false,
    isFetching: false,
    isLoading: false
  }),
  useListOrganizationUnitsQuery: () => ({
    data: organizationUnitsData,
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

describe("CompanySettingsPage structure settings", () => {
  beforeEach(() => {
    dispatchMock.mockReset();
    organizationUnitsData.splice(
      0,
      organizationUnitsData.length,
      ...defaultOrganizationUnitsData
    );
    archiveOrganizationUnitMock.mockReset();
    archiveOrganizationUnitMock.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    archiveOrganizationUnitTypeMock.mockReset();
    archiveOrganizationUnitTypeMock.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    createOrganizationUnitTypeMock.mockReset();
    createOrganizationUnitTypeMock.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    createOrganizationUnitMock.mockReset();
    createOrganizationUnitMock.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    createOrganizationRecordMock.mockReset();
    createOrganizationRecordMock.mockReturnValue({
      unwrap: () => Promise.resolve({
        id: "location-created",
        tenantId: "tenant-1",
        name: "New York HQ",
        country: "US",
        subdivisionCode: "US-NY",
        city: "New York",
        timezone: "America/New_York",
        status: "ACTIVE",
        createdAt: "2026-05-18T00:00:00.000Z",
        updatedAt: "2026-05-18T00:00:00.000Z"
      })
    });
    deleteOrganizationUnitMock.mockReset();
    deleteOrganizationUnitMock.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    deleteOrganizationUnitTypeMock.mockReset();
    deleteOrganizationUnitTypeMock.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    reorderOrganizationUnitTypesMock.mockReset();
    reorderOrganizationUnitTypesMock.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    updateCurrentTenantMock.mockReset();
    updateCurrentTenantMock.mockReturnValue({ unwrap: () => Promise.resolve(tenantData) });
  });

  it("shows company settings tabs", () => {
    render(
      <ToastProvider>
        <CompanySettingsPage />
      </ToastProvider>
    );

    expect(screen.getByRole("button", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Locations" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Structure" })).toBeInTheDocument();
  });

  it("renders company profile fields with slug disabled and save changes gated by dirty state", async () => {
    render(
      <ToastProvider>
        <CompanySettingsPage />
      </ToastProvider>
    );

    expect(screen.getByDisplayValue("assuresoft-demo")).toBeDisabled();
    expect(screen.getByDisplayValue("example.com")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("admin@example.com")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Contact email")).not.toBeInTheDocument();
    expect(screen.queryByText("Default language")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Timezone/)).toHaveValue("America/La_Paz");
    expect(screen.queryByRole("option", { name: "New York (America/New_York)" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();

    fireEvent.change(screen.getByDisplayValue("example.com"), { target: { value: "new.example.com" } });

    await waitFor(() => expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled());
  });

  it("submits company profile changes as a nested tenant profile payload", async () => {
    render(
      <ToastProvider>
        <CompanySettingsPage />
      </ToastProvider>
    );

    fireEvent.change(screen.getByDisplayValue("example.com"), { target: { value: "new.example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(updateCurrentTenantMock).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultLanguage: "en",
          tenantSlug: "assuresoft-demo",
          profile: expect.objectContaining({
            website: "new.example.com",
            companySize: "11-50",
            country: "BO",
            phone: "+59170000000"
          })
        })
      )
    );
    const submittedPayload = updateCurrentTenantMock.mock.calls.at(0)?.at(0);
    expect(submittedPayload?.profile).not.toHaveProperty("contactEmail");
  });

  it("renders organization unit types", () => {
    render(
      <ToastProvider>
        <CompanySettingsPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Structure" }));

    expect(screen.getByRole("heading", { name: "Organization unit types" })).toBeInTheDocument();
    expect(screen.getByText("branch")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Sort" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save order" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reorder Branch" })).toBeInTheDocument();
  });

  it("does not expose sort order in the organization unit type drawer", () => {
    render(
      <ToastProvider>
        <CompanySettingsPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Structure" }));
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
        <CompanySettingsPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Structure" }));
    fireEvent.click(screen.getByRole("button", { name: "Add type" }));
    fireEvent.change(screen.getByPlaceholderText("branch"), { target: { value: "office" } });
    fireEvent.change(screen.getByPlaceholderText("Branch"), { target: { value: "Office" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Organization unit type key already exists.")).toBeInTheDocument();
  });

  it("asks for confirmation before saving organization unit type order changes", async () => {
    render(
      <ToastProvider>
        <CompanySettingsPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Structure" }));

    fireEvent.keyDown(screen.getByRole("button", { name: "Reorder Office" }), { key: "ArrowUp" });
    await waitFor(() => expect(screen.getByRole("button", { name: "Save order" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Save order" }));

    expect(screen.getByRole("heading", { name: "Save type order" })).toBeInTheDocument();
    expect(reorderOrganizationUnitTypesMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: "Save order" }).at(-1) as HTMLButtonElement);

    expect(reorderOrganizationUnitTypesMock).toHaveBeenCalledWith({
      tenantSlug: "assuresoft-demo",
      typeIds: ["type-2", "type-1", "type-3"]
    });
    expect(await screen.findByText("Organization unit type order saved")).toBeInTheDocument();
  });

  it("shows permanent delete only for archived organization unit types and confirms before deleting", async () => {
    render(
      <ToastProvider>
        <CompanySettingsPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Structure" }));

    expect(screen.queryByRole("button", { name: "Delete Branch" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete Archived Type" }));

    expect(screen.getByRole("heading", { name: "Delete type permanently" })).toBeInTheDocument();
    expect(deleteOrganizationUnitTypeMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));

    expect(deleteOrganizationUnitTypeMock).toHaveBeenCalledWith({
      tenantSlug: "assuresoft-demo",
      typeId: "type-3"
    });
    expect(await screen.findByText("Organization unit type deleted")).toBeInTheDocument();
  });

  it("shows permanent delete only for archived organization units and confirms before deleting", async () => {
    render(
      <ToastProvider>
        <CompanySettingsPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Structure" }));

    expect(screen.queryByRole("button", { name: "Delete Cochabamba" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete Archived Unit" }));

    expect(screen.getByRole("heading", { name: "Delete organization unit permanently" })).toBeInTheDocument();
    expect(deleteOrganizationUnitMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));

    expect(deleteOrganizationUnitMock).toHaveBeenCalledWith({
      tenantSlug: "assuresoft-demo",
      unitId: "unit-2"
    });
    expect(await screen.findByText("Organization unit deleted")).toBeInTheDocument();
  });

  it("shows the backend message when archiving an organization unit type is blocked", async () => {
    archiveOrganizationUnitTypeMock.mockReturnValueOnce({
      unwrap: () =>
        Promise.reject({
          data: {
            error: {
              code: "CONFLICT",
              message: "Organization unit type cannot be archived while active units use it."
            }
          }
        })
    });

    render(
      <ToastProvider>
        <CompanySettingsPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Structure" }));
    fireEvent.click(screen.getByRole("button", { name: "Archive Branch" }));
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));

    expect(
      await screen.findByText("Organization unit type cannot be archived while active units use it.")
    ).toBeInTheDocument();
  });

  it("shows the backend message when archiving an organization unit is blocked", async () => {
    archiveOrganizationUnitMock.mockReturnValueOnce({
      unwrap: () =>
        Promise.reject({
          data: {
            error: {
              code: "CONFLICT",
              message: "Organization unit cannot be archived while it has active child units."
            }
          }
        })
    });

    render(
      <ToastProvider>
        <CompanySettingsPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Structure" }));
    fireEvent.click(screen.getByRole("button", { name: "Archive Cochabamba" }));
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));

    expect(
      await screen.findByText("Organization unit cannot be archived while it has active child units.")
    ).toBeInTheDocument();
  });

  it("renders organization units with location kept separate", () => {
    render(
      <ToastProvider>
        <CompanySettingsPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Structure" }));

    expect(screen.getByRole("heading", { name: "Organization units" })).toBeInTheDocument();
    expect(screen.getByText("Cochabamba HQ")).toBeInTheDocument();
  });

  it("uses a country-scoped subdivision dropdown when creating a location", async () => {
    render(
      <ToastProvider>
        <CompanySettingsPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Locations" }));
    fireEvent.click(screen.getByRole("button", { name: "Add location" }));

    fireEvent.change(await screen.findByPlaceholderText("Cochabamba HQ"), { target: { value: "Santa Cruz HQ" } });
    fireEvent.change(screen.getByRole("combobox", { name: /Country/ }), { target: { value: "BO" } });
    fireEvent.change(screen.getByLabelText("State / department"), { target: { value: "BO-S" } });
    fireEvent.change(screen.getByLabelText("City"), { target: { value: "Santa Cruz" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(createOrganizationRecordMock).toHaveBeenCalledWith({
        kind: "location",
        tenantSlug: "assuresoft-demo",
        payload: {
          name: "Santa Cruz HQ",
          country: "BO",
          subdivisionCode: "BO-S",
          city: "Santa Cruz",
          timezone: "America/La_Paz"
        }
      })
    );
  });

  it("creates an organization unit with an optional existing primary location", async () => {
    render(
      <ToastProvider>
        <CompanySettingsPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Structure" }));
    fireEvent.click(screen.getByRole("button", { name: "Add unit" }));

    fireEvent.change(await screen.findByPlaceholderText("Santa Cruz"), { target: { value: "Santa Cruz Branch" } });
    expect(screen.queryByLabelText("Create primary location")).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Primary location" }), { target: { value: "location-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(createOrganizationUnitMock).toHaveBeenCalled());
    expect(createOrganizationRecordMock).not.toHaveBeenCalled();
    expect(createOrganizationUnitMock).toHaveBeenCalledWith({
      tenantSlug: "assuresoft-demo",
      payload: {
        typeId: "type-1",
        parentOrganizationUnitId: null,
        primaryLocationId: "location-1",
        key: null,
        name: "Santa Cruz Branch",
        legalName: null,
        code: null
      }
    });
  });

  it("paginates organization units after ten rows", () => {
    organizationUnitsData.splice(
      0,
      organizationUnitsData.length,
      ...Array.from({ length: 11 }, (_, index) => ({
        id: `unit-${index + 1}`,
        tenantId: "tenant-1",
        typeId: "type-1",
        type: { id: "type-1", key: "branch", name: "Branch" },
        parentOrganizationUnitId: null,
        parent: null,
        primaryLocationId: null,
        primaryLocation: null,
        key: `unit_${String(index + 1).padStart(2, "0")}`,
        name: `Unit ${String(index + 1).padStart(2, "0")}`,
        legalName: null,
        code: null,
        status: "ACTIVE",
        createdAt: "2026-05-18T00:00:00.000Z",
        updatedAt: "2026-05-18T00:00:00.000Z"
      }))
    );

    render(
      <ToastProvider>
        <CompanySettingsPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Structure" }));

    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("Unit 10")).toBeInTheDocument();
    expect(screen.queryByText("Unit 11")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getByText("Unit 11")).toBeInTheDocument();
    expect(screen.queryByText("Unit 01")).not.toBeInTheDocument();
  });
});
