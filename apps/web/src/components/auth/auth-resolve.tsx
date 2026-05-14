"use client";

import type { Session } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ErrorState } from "@/components/data-display/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { setCurrentUser, setPlatformRoles } from "@/features/auth/auth-slice";
import { useGetMeQuery } from "@/features/auth/current-user-api";
import { setTenants } from "@/features/tenants/tenant-slice";
import { loginPath } from "@/lib/auth/auth-redirects";
import { resolveInitialRoute } from "@/lib/auth/route-resolution";
import { createSupabaseBrowserClient } from "@/lib/auth/supabase-client";
import { clearWorkspaceContextCache, saveWorkspaceContextCache } from "@/lib/auth/workspace-cache";
import { useAppDispatch } from "@/store/hooks";

export function AuthResolve() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const { data, isError, isLoading } = useGetMeQuery(undefined, {
    refetchOnMountOrArgChange: true,
    skip: !session
  });

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      clearWorkspaceContextCache();
      router.replace(`${loginPath}?reason=missing-config`);
      return;
    }

    let isMounted = true;

    void supabase.auth.getSession().then(({ data: sessionData }) => {
      if (!isMounted) {
        return;
      }

      setSession(sessionData.session);
      setIsCheckingSession(false);

      if (!sessionData.session) {
        clearWorkspaceContextCache();
        router.replace(loginPath);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!data) {
      return;
    }

    dispatch(setCurrentUser(data.user));
    dispatch(setPlatformRoles(data.platformRoles));
    dispatch(setTenants(data.tenants));
    saveWorkspaceContextCache({
      user: data.user,
      tenants: data.tenants,
      platformRoles: data.platformRoles,
      selectedTenantSlug: data.tenants[0]?.tenantSlug
    });

    router.replace(resolveInitialRoute(data, redirectTo));
  }, [data, dispatch, redirectTo, router]);

  useEffect(() => {
    if (isError) {
      clearWorkspaceContextCache();
    }
  }, [isError]);

  if (isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <ErrorState
          title="Could not prepare your workspace"
          description="The session is active, but the backend could not resolve your access."
        />
      </main>
    );
  }

  return <AuthResolveLoadingState isLoading={isCheckingSession || isLoading || !data} />;
}

function AuthResolveLoadingState({ isLoading }: Readonly<{ isLoading: boolean }>) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <Skeleton className="mx-auto h-10 w-10 rounded-full" />
        <h1 className="mt-5 text-base font-semibold text-foreground">
          {isLoading ? "Preparing your workspace..." : "Redirecting..."}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We are checking your access before opening the right workspace.
        </p>
      </div>
    </main>
  );
}
