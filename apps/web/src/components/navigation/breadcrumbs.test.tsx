import { render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { Breadcrumbs } from "./breadcrumbs";

describe("Breadcrumbs", () => {
  it("renders linked parent items and marks the current page", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Settings", href: "/settings" },
          { label: "Company settings" }
        ]}
      />
    );

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    const settingsLink = within(nav).getByRole("link", { name: "Settings" });

    expect(settingsLink).toHaveAttribute("href", "/settings");
    expect(within(nav).getByText("Company settings")).toHaveAttribute("aria-current", "page");
  });

  it("does not render an empty breadcrumb navigation", () => {
    const { container } = render(<Breadcrumbs items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("does not render the final breadcrumb item as a link even if href is passed", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Settings", href: "/settings" },
          { label: "Company settings", href: "/settings/company" }
        ]}
      />
    );

    expect(screen.queryByRole("link", { name: "Company settings" })).not.toBeInTheDocument();
    expect(screen.getByText("Company settings")).toHaveAttribute("aria-current", "page");
  });
});
