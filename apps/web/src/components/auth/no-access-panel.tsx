"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { baseApi } from "@/features/api/base-api";
import { clearCurrentUser } from "@/features/auth/auth-slice";
import { clearTenants } from "@/features/tenants/tenant-slice";
import { useCurrentUser } from "@/hooks/use-current-user";
import { loginPath } from "@/lib/auth/auth-redirects";
import { createSupabaseBrowserClient } from "@/lib/auth/supabase-client";
import { useAppDispatch } from "@/store/hooks";

export function NoAccessPanel() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const currentUser = useCurrentUser();

  const logout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase?.auth.signOut();
    dispatch(baseApi.util.resetApiState());
    dispatch(clearCurrentUser());
    dispatch(clearTenants());
    router.replace(loginPath);
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>No workspace access</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Your account was authenticated, but it does not have access to an organization yet.
          In production, an admin invitation or approved access request will grant access.
        </p>
        {currentUser?.email ? (
          <p className="mt-4 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{currentUser.email}</span>
          </p>
        ) : null}
        <div className="mt-5 flex justify-end">
          <Button onClick={logout} variant="secondary">
            Sign out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
