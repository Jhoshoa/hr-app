import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { TimezoneSelect } from "./timezone-select";

describe("TimezoneSelect", () => {
  it("renders supported timezone options", () => {
    render(<TimezoneSelect includeEmptyOption />);

    expect(screen.getByRole("option", { name: "Select timezone" })).toHaveValue("");
    expect(screen.getByRole("option", { name: "La Paz (America/La_Paz)" })).toHaveValue("America/La_Paz");
  });

  it("filters timezone options by country", () => {
    render(<TimezoneSelect countryCode="BO" />);

    expect(screen.getByRole("option", { name: "La Paz (America/La_Paz)" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "New York (America/New_York)" })).not.toBeInTheDocument();
  });
});
