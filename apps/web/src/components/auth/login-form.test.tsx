import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

const replace = vi.fn();
const signInWithPassword = vi.fn();
const signInWithOAuth = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams("redirectTo=%2Fsettings")
}));

vi.mock("@/config/env", () => ({
  env: {
    authMode: "supabase",
    supabaseUrl: "https://example.supabase.co",
    supabaseAnonKey: "anon-key"
  }
}));

vi.mock("@/lib/auth/supabase-client", () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      signInWithOAuth,
      signInWithPassword
    }
  })
}));

describe("LoginForm", () => {
  beforeEach(() => {
    replace.mockReset();
    signInWithPassword.mockReset();
    signInWithOAuth.mockReset();
    signInWithPassword.mockResolvedValue({ error: null });
  });

  it("submits email and password through Supabase Auth", async () => {
    render(<LoginForm />);

    await userEvent.type(screen.getByPlaceholderText("Email"), "demo.owner@example.test");
    await userEvent.type(screen.getByPlaceholderText("Password"), "Password123!");
    await userEvent.click(screen.getByRole("button", { name: "Continue with email" }));

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "demo.owner@example.test",
      password: "Password123!"
    });
    expect(replace).toHaveBeenCalledWith("/auth/resolve?redirectTo=%2Fsettings");
  });

  it("shows Supabase email login errors", async () => {
    signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });

    render(<LoginForm />);

    await userEvent.type(screen.getByPlaceholderText("Email"), "demo.owner@example.test");
    await userEvent.type(screen.getByPlaceholderText("Password"), "wrong-password");
    await userEvent.click(screen.getByRole("button", { name: "Continue with email" }));

    expect(await screen.findByText("Invalid login credentials")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
