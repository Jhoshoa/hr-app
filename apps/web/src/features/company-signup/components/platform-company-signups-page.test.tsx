import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { PlatformCompanySignupsPage } from "./platform-company-signups-page";

const listQuery = vi.fn();
const getQuery = vi.fn();
const usePlatformRoles = vi.fn();
const mutationState = { isLoading: false };

vi.mock("@/hooks/use-platform-roles", () => ({
  usePlatformRoles: () => usePlatformRoles()
}));

vi.mock("../company-signup-api", () => ({
  useApprovePlatformCompanySignupRequestMutation: () => [vi.fn(), mutationState],
  useArchivePlatformTenantMutation: () => [vi.fn(), mutationState],
  useGetPlatformCompanySignupRequestQuery: (...args: unknown[]) => getQuery(...args),
  useListPlatformCompanySignupRequestsQuery: (...args: unknown[]) => listQuery(...args),
  useReactivatePlatformTenantMutation: () => [vi.fn(), mutationState],
  useRejectPlatformCompanySignupRequestMutation: () => [vi.fn(), mutationState]
}));

const pendingRequest = {
  id: "request-1",
  companyName: "Acme Corp",
  desiredTenantSlug: "acme",
  adminFirstName: "Ana",
  adminLastName: "Owner",
  adminEmail: "ana@example.com",
  companyWebsite: "acme.com",
  companySize: "51-200",
  country: "BO",
  timezone: "America/La_Paz",
  preferredLanguage: "es",
  phone: null,
  message: null,
  status: "PENDING",
  approvedTenantId: null,
  approvedTenant: null,
  reviewedByUserId: null,
  reviewedAt: null,
  rejectionReason: null,
  createdAt: "2026-05-14T12:00:00.000Z",
  updatedAt: "2026-05-14T12:00:00.000Z"
};

describe("PlatformCompanySignupsPage", () => {
  beforeEach(() => {
    listQuery.mockReturnValue({
      data: {
        items: [pendingRequest],
        page: 1,
        pageSize: 10,
        total: 1
      },
      isError: false,
      isFetching: false
    });
    getQuery.mockReturnValue({ data: undefined, isFetching: false });
    usePlatformRoles.mockReturnValue(["PLATFORM_OWNER"]);
  });

  it("renders company signup rows and privileged review actions", () => {
    render(
      <ToastProvider>
        <PlatformCompanySignupsPage />
      </ToastProvider>
    );

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve Acme Corp" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject Acme Corp" })).toBeInTheDocument();
  });

  it("hides review actions from support users", () => {
    usePlatformRoles.mockReturnValue(["PLATFORM_SUPPORT"]);

    render(
      <ToastProvider>
        <PlatformCompanySignupsPage />
      </ToastProvider>
    );

    expect(screen.queryByRole("button", { name: "Approve Acme Corp" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reject Acme Corp" })).not.toBeInTheDocument();
  });
});
