import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { PhoneInput } from "./phone-input";

function ControlledPhoneInput({ countryCode = "BO" }: { readonly countryCode?: string }) {
  const [value, setValue] = React.useState("");

  return (
    <PhoneInput
      countryCode={countryCode}
      name="phone"
      onChange={(event) => setValue(event.target.value)}
      value={value}
    />
  );
}

describe("PhoneInput", () => {
  it("uses the selected country default calling code and emits E.164-shaped values", () => {
    const onChange = vi.fn();

    render(<PhoneInput countryCode="BO" name="phone" onChange={onChange} value="" />);

    expect(screen.getByLabelText("Phone country code")).toHaveValue("+591");
    expect(screen.getByRole("option", { name: "BO +591" })).toHaveValue("+591");
    expect(screen.getByRole("option", { name: "US +1" })).toHaveValue("+1");

    fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "70000000" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          name: "phone",
          value: "+59170000000"
        })
      })
    );
  });

  it("keeps the national number when changing calling code", () => {
    const onChange = vi.fn();

    render(<PhoneInput countryCode="BO" name="phone" onChange={onChange} value="+59170000000" />);

    fireEvent.change(screen.getByLabelText("Phone country code"), { target: { value: "+1" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: "+170000000"
        })
      })
    );
  });

  it("keeps a manually selected calling code before the user enters a number", () => {
    const onChange = vi.fn();

    render(<PhoneInput countryCode="BO" name="phone" onChange={onChange} value="" />);

    fireEvent.change(screen.getByLabelText("Phone country code"), { target: { value: "+1" } });

    expect(screen.getByLabelText("Phone country code")).toHaveValue("+1");

    fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "4155550100" } });

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: "+14155550100"
        })
      })
    );
  });

  it("does not duplicate the calling code while typing an incomplete number", () => {
    render(<ControlledPhoneInput countryCode="BO" />);

    const input = screen.getByLabelText("Phone number");

    fireEvent.change(input, { target: { value: "7" } });
    expect(input).toHaveValue("7");

    fireEvent.change(input, { target: { value: "70" } });
    expect(input).toHaveValue("70");

    fireEvent.change(input, { target: { value: "70000000" } });
    expect(input).toHaveValue("70000000");
  });
});
