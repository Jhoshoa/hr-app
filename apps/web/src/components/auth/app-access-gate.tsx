"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { ErrorState } from "@/components/data-display/error-state";
import { setCurrentUser } from "@/features/auth/auth-slice";
import { useGetMeQuery } from "@/features/auth/current-user-api";
import { setTenants } from "@/features/tenants/tenant-slice";
import { useAppDispatch } from "@/store/hooks";

interface AppAccessGateProps {
  readonly children: ReactNode;
}

export function AppAccessGate({ children }: AppAccessGateProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { data, isError, isLoading } = useGetMeQuery();

  useEffect(() => {
    if (!data) {
      return;
    }

    if (data.tenants.length === 0) {
      dispatch(setCurrentUser(data.user));
      router.replace("/no-access");
      return;
    }

    dispatch(setCurrentUser(data.user));
    dispatch(setTenants(data.tenants));
  }, [data, dispatch, router]);

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground">
        Loading workspace...
      </div>
    );
  }

  if (isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <ErrorState
          title="Could not load your workspace"
          description="The session is active, but the backend could not return your user and tenant access."
        />
      </main>
    );
  }

  if (data.tenants.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground">
        Redirecting...
      </div>
    );
  }

  return children;
}
