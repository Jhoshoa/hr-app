"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { appHomePath, authResolvePath, loginPath } from "@/lib/auth/auth-redirects";
import { createSupabaseBrowserClient } from "@/lib/auth/supabase-client";

export function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Completing sign in...");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const redirectTo = searchParams.get("redirectTo") ?? appHomePath;

    if (!supabase) {
      router.replace(`${loginPath}?reason=missing-config`);
      return;
    }

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        setMessage("No active session was returned. Redirecting to login...");
        router.replace(loginPath);
        return;
      }

      router.replace(`${authResolvePath}?redirectTo=${encodeURIComponent(redirectTo)}`);
    });
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground">
      {message}
    </main>
  );
}
