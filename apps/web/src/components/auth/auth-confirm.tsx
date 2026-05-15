"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginPath } from "@/lib/auth/auth-redirects";
import { createSupabaseBrowserClient } from "@/lib/auth/supabase-client";

export function AuthConfirm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Confirming email...");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const tokenHash = searchParams.get("token_hash");
    const next = searchParams.get("next") ?? "/dashboard";

    if (!supabase) {
      router.replace(`${loginPath}?reason=missing-config`);
      return;
    }

    if (!tokenHash) {
      void supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          router.replace(next);
          return;
        }

        setMessage("Confirmation token is missing. Redirecting to login...");
        router.replace(loginPath);
      });
      return;
    }

    void supabase.auth
      .verifyOtp({
        token_hash: tokenHash,
        type: "email"
      })
      .then(({ error }) => {
        if (error) {
          setMessage("Email could not be confirmed. Redirecting to login...");
          router.replace(loginPath);
          return;
        }

        router.replace(next);
      });
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground">
      {message}
    </main>
  );
}
