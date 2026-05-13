import { zodResolver } from "@hookform/resolvers/zod";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { Input } from "./input";

const schema = z.object({
  name: z.string().min(1, "Required")
});

function TestForm({ onSubmit }: Readonly<{ onSubmit: (values: { name: string }) => void }>) {
  const { handleSubmit, register } = useForm<{ name: string }>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="name">Name</label>
      <Input id="name" {...register("name")} />
      <button type="submit">Save</button>
    </form>
  );
}

describe("Input", () => {
  it("forwards refs and works with react-hook-form registration", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<TestForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Name"), "Umsat Soft");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith({ name: "Umsat Soft" }, expect.anything());
  });
});
