import { Suspense } from "react";
import { AuthCallback } from "@/components/auth/auth-callback";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground">
          Completing sign in...
        </main>
      }
    >
      <AuthCallback />
    </Suspense>
  );
}
