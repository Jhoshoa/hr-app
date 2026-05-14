import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./page-header";

describe("PageHeader", () => {
  it("renders title and description without breadcrumbs", () => {
    render(<PageHeader title="Dashboard" description="Workspace overview." />);

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Workspace overview.")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Breadcrumb" })).not.toBeInTheDocument();
  });

  it("renders optional breadcrumbs above the page title", () => {
    render(
      <PageHeader
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Organization settings" }
        ]}
        title="Organization settings"
        description="Configure catalogs."
      />
    );

    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("heading", { name: "Organization settings" })).toBeInTheDocument();
  });
});
