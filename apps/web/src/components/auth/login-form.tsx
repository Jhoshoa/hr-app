"use client";

import { Chrome } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { env } from "@/config/env";
import { appHomePath, getAuthCallbackUrl } from "@/lib/auth/auth-redirects";
import { createSupabaseBrowserClient } from "@/lib/auth/supabase-client";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTo = searchParams.get("redirectTo") ?? appHomePath;

  const signInWithGoogle = async () => {
    setError(null);
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();

    if (!supabase || env.authMode !== "supabase") {
      setError("Supabase auth is not configured for this frontend session.");
      setIsSubmitting(false);
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
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Input disabled placeholder="Email password login will be wired through Supabase later" type="email" />
          <Button className="w-full" disabled variant="secondary">
            Continue with email
          </Button>
          <Button className="w-full" disabled={isSubmitting} onClick={signInWithGoogle}>
            <Chrome size={16} aria-hidden="true" />
            {isSubmitting ? "Redirecting..." : "Continue with Google"}
          </Button>
          {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
          {env.authMode !== "supabase" ? (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              Set NEXT_PUBLIC_AUTH_MODE=supabase and restart the frontend to use Google login.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
