import { Suspense } from "react";
import { AuthResolve } from "@/components/auth/auth-resolve";

export default function AuthResolvePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground">
          Preparing your workspace...
        </main>
      }
    >
      <AuthResolve />
    </Suspense>
  );
}
