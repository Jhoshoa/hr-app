"use client";

import { Chrome } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { env } from "@/config/env";
import { appHomePath, authResolvePath, getAuthCallbackUrl } from "@/lib/auth/auth-redirects";
import { createSupabaseBrowserClient } from "@/lib/auth/supabase-client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submittingProvider, setSubmittingProvider] = useState<"email" | "google" | null>(null);
  const redirectTo = searchParams.get("redirectTo") ?? appHomePath;
  const isSupabaseConfigured = env.authMode === "supabase";

  const signInWithGoogle = async () => {
    setError(null);
    setSubmittingProvider("google");

    const supabase = createSupabaseBrowserClient();

    if (!supabase || !isSupabaseConfigured) {
      setError("Supabase auth is not configured for this frontend session.");
      setSubmittingProvider(null);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      options: {
        queryParams: {
          access_type: "offline",
          prompt: "consent"
        },
        redirectTo: `${getAuthCallbackUrl()}?redirectTo=${encodeURIComponent(redirectTo)}`
      },
      provider: "google"
    });

    if (signInError) {
      setError(signInError.message);
      setSubmittingProvider(null);
    }
  };

  const signInWithEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmittingProvider("email");

    const supabase = createSupabaseBrowserClient();

    if (!supabase || !isSupabaseConfigured) {
      setError("Supabase auth is not configured for this frontend session.");
      setSubmittingProvider(null);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (signInError) {
      setError(signInError.message);
      setSubmittingProvider(null);
      return;
    }

    router.replace(`${authResolvePath}?redirectTo=${encodeURIComponent(redirectTo)}`);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={signInWithEmail}>
          <Input
            autoComplete="email"
            disabled={Boolean(submittingProvider)}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
            type="email"
            value={email}
          />
          <Input
            autoComplete="current-password"
            disabled={Boolean(submittingProvider)}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            type="password"
            value={password}
          />
          <Button
            className="w-full"
            disabled={Boolean(submittingProvider) || !email.trim() || !password}
            type="submit"
            variant="secondary"
          >
            {submittingProvider === "email" ? "Signing in..." : "Continue with email"}
          </Button>
          <Button
            className="w-full"
            disabled={Boolean(submittingProvider)}
            onClick={signInWithGoogle}
            type="button"
          >
            <Chrome size={16} aria-hidden="true" />
            {submittingProvider === "google" ? "Redirecting..." : "Continue with Google"}
          </Button>
          {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
          {!isSupabaseConfigured ? (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              Set NEXT_PUBLIC_AUTH_MODE=supabase and restart the frontend to use Supabase login.
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
