"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { ErrorState } from "@/components/data-display/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { setCurrentUser } from "@/features/auth/auth-slice";
import { useGetMeQuery } from "@/features/auth/current-user-api";
import { setTenants } from "@/features/tenants/tenant-slice";
import {
  clearWorkspaceContextCache,
  loadWorkspaceContextCache,
  saveWorkspaceContextCache
} from "@/lib/auth/workspace-cache";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

interface AppAccessGateProps {
  readonly children: ReactNode;
}

export function AppAccessGate({ children }: AppAccessGateProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isTenantHydrated = useAppSelector((state) => state.tenant.isHydrated);
  const [cachedWorkspace] = useState(() => loadWorkspaceContextCache());
  const { data, isError, isLoading } = useGetMeQuery(undefined, { refetchOnMountOrArgChange: true });
  const hasWorkspaceContext = useMemo(
    () => isTenantHydrated || Boolean(cachedWorkspace?.tenants.length),
    [cachedWorkspace, isTenantHydrated]
  );

  useEffect(() => {
    if (!cachedWorkspace || isTenantHydrated) {
      return;
    }

    dispatch(setCurrentUser(cachedWorkspace.user));
    dispatch(setTenants(cachedWorkspace.tenants));
  }, [cachedWorkspace, dispatch, isTenantHydrated]);

  useEffect(() => {
    if (!data) {
      return;
    }

    if (data.tenants.length === 0) {
      clearWorkspaceContextCache();
      dispatch(setCurrentUser(data.user));
      router.replace("/no-access");
      return;
    }

    dispatch(setCurrentUser(data.user));
    dispatch(setTenants(data.tenants));
    saveWorkspaceContextCache({ user: data.user, tenants: data.tenants });
  }, [data, dispatch, router]);

  if (isLoading && !hasWorkspaceContext) {
    return <WorkspaceLoadingState />;
  }

  if (isError && !hasWorkspaceContext) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <ErrorState
          title="Could not load your workspace"
          description="The session is active, but the backend could not return your user and tenant access."
        />
      </main>
    );
  }

  if (data?.tenants.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground">
        Redirecting...
      </div>
    );
  }

  return children;
}

function WorkspaceLoadingState() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 border-r border-border bg-surface p-5 lg:block">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-4 w-28" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 7 }, (_, index) => (
            <Skeleton className="h-9 w-full" key={index} />
          ))}
        </div>
      </aside>
      <main className="flex-1 p-6">
        <div className="flex justify-end">
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="mt-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton className="h-28 w-full" key={index} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
