"use client";

import type { Session } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { appHomePath, loginPath } from "@/lib/auth/auth-redirects";
import { createSupabaseBrowserClient } from "@/lib/auth/supabase-client";
import { clearWorkspaceContextCache, loadWorkspaceContextCache } from "@/lib/auth/workspace-cache";

interface AuthGuardProps {
  readonly children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      router.replace(`${loginPath}?reason=missing-config`);
      return;
    }

    let isMounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session);
      setIsChecking(false);

      if (!data.session) {
        clearWorkspaceContextCache();
        router.replace(`${loginPath}?redirectTo=${encodeURIComponent(pathname || appHomePath)}`);
        return;
      }

      const cachedWorkspace = loadWorkspaceContextCache();

      if (
        cachedWorkspace &&
        data.session.user.email &&
        cachedWorkspace.user.email !== data.session.user.email
      ) {
        clearWorkspaceContextCache();
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (!nextSession) {
        clearWorkspaceContextCache();
        router.replace(loginPath);
        return;
      }

      const cachedWorkspace = loadWorkspaceContextCache();

      if (
        cachedWorkspace &&
        nextSession.user.email &&
        cachedWorkspace.user.email !== nextSession.user.email
      ) {
        clearWorkspaceContextCache();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (isChecking || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground">
        Checking session...
      </div>
    );
  }

  return children;
}
