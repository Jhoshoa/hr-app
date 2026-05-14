import { zodResolver } from "@hookform/resolvers/zod";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { Select } from "./company-signup-page";

const schema = z.object({
  companySize: z.string().min(1, "Required")
});

function TestForm({ onSubmit }: Readonly<{ onSubmit: (values: { companySize: string }) => void }>) {
  const { handleSubmit, register } = useForm<{ companySize: string }>({
    defaultValues: { companySize: "" },
    resolver: zodResolver(schema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="company-size">Company size</label>
      <Select id="company-size" {...register("companySize")}>
        <option value="">Select size</option>
        <option value="11-50">11-50</option>
      </Select>
      <button type="submit">Save</button>
    </form>
  );
}

describe("CompanySignup Select", () => {
  it("forwards refs and works with react-hook-form registration", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<TestForm onSubmit={onSubmit} />);

    await user.selectOptions(screen.getByLabelText("Company size"), "11-50");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith({ companySize: "11-50" }, expect.anything());
  });
});
