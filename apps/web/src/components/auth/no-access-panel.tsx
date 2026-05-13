"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loginPath } from "@/lib/auth/auth-redirects";
import { createSupabaseBrowserClient } from "@/lib/auth/supabase-client";

export function NoAccessPanel() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase?.auth.signOut();
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
        <div className="mt-5 flex justify-end">
          <Button onClick={logout} variant="secondary">
            Sign out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
