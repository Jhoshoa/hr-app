import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { CompanySignupPage } from "./company-signup-page";

const mutationState = { isLoading: false };
const replaceMock = vi.fn();
const createCompanySignupRequestMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock
  })
}));

vi.mock("@/hooks/use-debounced-value", () => ({
  useDebouncedValue: (value: string) => value
}));

vi.mock("../company-signup-api", () => ({
  useCreateCompanySignupRequestMutation: () => [createCompanySignupRequestMock, mutationState],
  useLazyCheckCompanySignupAdminEmailAvailabilityQuery: () => [
    vi.fn(),
    {
      currentData: { available: true, canReuseExistingUser: false, existingUser: false, value: "admin@example.com" },
      isFetching: false
    }
  ],
  useLazyCheckCompanySignupTenantSlugAvailabilityQuery: () => [
    vi.fn(),
    {
      currentData: { available: true, value: "acme-operations" },
      isFetching: false
    }
  ],
  useLazyCheckCompanySignupWebsiteAvailabilityQuery: () => [
    vi.fn(),
    { currentData: undefined, isFetching: false }
  ]
}));

describe("CompanySignupPage", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    createCompanySignupRequestMock.mockReset();
    createCompanySignupRequestMock.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          adminEmail: "admin@example.com",
          companyName: "Acme Operations",
          createdAt: "2026-05-19T00:00:00.000Z",
          desiredTenantSlug: "acme-operations",
          id: "signup-request-1",
          status: "PENDING"
        })
    });
  });

  it("hides preferred language and defaults it to English", () => {
    const { container } = render(
      <ToastProvider>
        <CompanySignupPage />
      </ToastProvider>
    );

    expect(screen.queryByText("Preferred language")).not.toBeInTheDocument();
    expect(container.querySelector('input[name="preferredLanguage"]')).toHaveValue("en");
  });

  it("resets the form and sends users to login from the success dialog after submit", async () => {
    const { container } = render(
      <ToastProvider>
        <CompanySignupPage />
      </ToastProvider>
    );
    const field = (name: string) => {
      const element = container.querySelector(`[name="${name}"]`);
      if (!(element instanceof HTMLElement)) {
        throw new Error(`Field ${name} was not found.`);
      }
      return element;
    };

    fireEvent.change(field("companyName"), { target: { value: "Acme Operations" } });
    fireEvent.change(field("desiredTenantSlug"), { target: { value: "acme-operations" } });
    fireEvent.change(field("companySize"), { target: { value: "51-200" } });
    fireEvent.change(field("country"), { target: { value: "BO" } });
    fireEvent.change(field("timezone"), { target: { value: "America/La_Paz" } });
    fireEvent.change(field("adminFirstName"), { target: { value: "Maria" } });
    fireEvent.change(field("adminLastName"), { target: { value: "Rojas" } });
    fireEvent.change(field("adminEmail"), { target: { value: "admin@example.com" } });

    const submitButton = screen.getByRole("button", { name: /submit request/i });
    await waitFor(() => expect(submitButton).toBeEnabled());

    fireEvent.click(submitButton);

    await waitFor(() =>
      expect(createCompanySignupRequestMock).toHaveBeenCalledWith(
        expect.objectContaining({
          adminEmail: "admin@example.com",
          companyName: "Acme Operations",
          country: "BO",
          desiredTenantSlug: "acme-operations",
          preferredLanguage: "en",
          timezone: "America/La_Paz"
        })
      )
    );

    expect(await screen.findByRole("dialog", { name: "Request submitted" })).toBeInTheDocument();
    expect(screen.getByText("Workspace: acme-operations")).toBeInTheDocument();

    await waitFor(() => expect(field("companyName")).toHaveValue(""));
    expect(field("desiredTenantSlug")).toHaveValue("");
    expect(field("adminEmail")).toHaveValue("");

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(replaceMock).toHaveBeenCalledWith("/login");
  });
});
