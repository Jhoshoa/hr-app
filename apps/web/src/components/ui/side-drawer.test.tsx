import { render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";
import { SideDrawer } from "./side-drawer";

describe("SideDrawer", () => {
  it("renders a fixed footer outside the scrollable content region", () => {
    render(
      <SideDrawer
        footer={<Button type="button">Save</Button>}
        isOpen
        onClose={vi.fn()}
        title="Edit access"
      >
        <p>Scrollable content</p>
      </SideDrawer>
    );

    const footer = screen.getByRole("contentinfo");

    expect(within(footer).getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(footer).toHaveClass("border-t");
    expect(screen.getByText("Scrollable content").parentElement).toHaveClass("overflow-y-auto");
  });

  it("does not render when closed", () => {
    render(
      <SideDrawer isOpen={false} onClose={vi.fn()} title="Hidden">
        <p>Hidden content</p>
      </SideDrawer>
    );

    expect(screen.queryByText("Hidden content")).not.toBeInTheDocument();
  });
});
