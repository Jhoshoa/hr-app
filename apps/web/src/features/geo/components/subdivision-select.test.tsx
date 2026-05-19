import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { SubdivisionSelect } from "./subdivision-select";

describe("SubdivisionSelect", () => {
  it("renders subdivisions for the selected country", () => {
    render(<SubdivisionSelect countryCode="BO" />);

    expect(screen.getByRole("option", { name: "Select state / department" })).toHaveValue("");
    expect(screen.getByRole("option", { name: "Cochabamba" })).toHaveValue("BO-C");
    expect(screen.getByRole("option", { name: "Santa Cruz" })).toHaveValue("BO-S");
  });

  it("does not render country-mismatched subdivisions", () => {
    render(<SubdivisionSelect countryCode="US" />);

    expect(screen.getByRole("option", { name: "New York" })).toHaveValue("US-NY");
    expect(screen.queryByRole("option", { name: "Cochabamba" })).not.toBeInTheDocument();
  });
});
