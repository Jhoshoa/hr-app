import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { CountrySelect } from "./country-select";

describe("CountrySelect", () => {
  it("renders supported America country options with ISO alpha-2 values", () => {
    render(<CountrySelect includeEmptyOption />);

    expect(screen.getByRole("option", { name: "Select country" })).toHaveValue("");
    expect(screen.getByRole("option", { name: "Bolivia" })).toHaveValue("BO");
    expect(screen.getByRole("option", { name: "United States" })).toHaveValue("US");
  });
});
