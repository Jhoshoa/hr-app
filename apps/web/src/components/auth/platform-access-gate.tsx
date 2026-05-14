"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { ErrorState } from "@/components/data-display/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { setCurrentUser, setPlatformRoles } from "@/features/auth/auth-slice";
import { useGetMeQuery } from "@/features/auth/current-user-api";
import { setTenants } from "@/features/tenants/tenant-slice";
import { platformHomePath } from "@/lib/auth/auth-redirects";
import {
  clearWorkspaceContextCache,
  loadWorkspaceContextCache,
  saveWorkspaceContextCache
} from "@/lib/auth/workspace-cache";
import { useAppDispatch } from "@/store/hooks";

interface PlatformAccessGateProps {
  readonly children: ReactNode;
}

export function PlatformAccessGate({ children }: PlatformAccessGateProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [cachedWorkspace] = useState(() => loadWorkspaceContextCache());
  const { data, isError, isLoading } = useGetMeQuery(undefined, { refetchOnMountOrArgChange: true });

  useEffect(() => {
    if (!cachedWorkspace || cachedWorkspace.platformRoles.length === 0) {
      return;
    }

    dispatch(setCurrentUser(cachedWorkspace.user));
    dispatch(setPlatformRoles(cachedWorkspace.platformRoles));
    dispatch(setTenants(cachedWorkspace.tenants));
  }, [cachedWorkspace, dispatch]);

  useEffect(() => {
    if (!data) {
      return;
    }

    if (data.platformRoles.length === 0) {
      clearWorkspaceContextCache();
      dispatch(setCurrentUser(data.user));
      dispatch(setPlatformRoles([]));
      dispatch(setTenants(data.tenants));
      router.replace("/no-access");
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

    if (data.platformRoles.length > 0 && !window.location.pathname.startsWith("/platform")) {
      router.replace(platformHomePath);
    }
  }, [data, dispatch, router]);

  if (isLoading) {
    return <PlatformAccessLoadingState />;
  }

  if (isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <ErrorState
          title="Could not load platform access"
          description="The session is active, but the backend could not return your platform permissions."
        />
      </main>
    );
  }

  if (!data || data.platformRoles.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground">
        Redirecting...
      </div>
    );
  }

  return children;
}

function PlatformAccessLoadingState() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 border-r border-border bg-surface p-5 lg:block">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-2 h-4 w-24" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton className="h-9 w-full" key={index} />
          ))}
        </div>
      </aside>
      <main className="flex-1 p-6">
        <div className="flex justify-end">
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="mt-8 space-y-4">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </main>
    </div>
  );
}
