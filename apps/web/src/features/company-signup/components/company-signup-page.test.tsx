import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { CompanySignupPage } from "./company-signup-page";

const mutationState = { isLoading: false };

vi.mock("../company-signup-api", () => ({
  useCreateCompanySignupRequestMutation: () => [vi.fn(), mutationState],
  useLazyCheckCompanySignupAdminEmailAvailabilityQuery: () => [
    vi.fn(),
    { currentData: undefined, isFetching: false }
  ],
  useLazyCheckCompanySignupTenantSlugAvailabilityQuery: () => [
    vi.fn(),
    { currentData: undefined, isFetching: false }
  ],
  useLazyCheckCompanySignupWebsiteAvailabilityQuery: () => [
    vi.fn(),
    { currentData: undefined, isFetching: false }
  ]
}));

describe("CompanySignupPage", () => {
  it("hides preferred language and defaults it to English", () => {
    const { container } = render(
      <ToastProvider>
        <CompanySignupPage />
      </ToastProvider>
    );

    expect(screen.queryByText("Preferred language")).not.toBeInTheDocument();
    expect(container.querySelector('input[name="preferredLanguage"]')).toHaveValue("en");
  });
});
