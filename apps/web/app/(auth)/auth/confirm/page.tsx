import { Suspense } from "react";
import { AuthConfirm } from "@/components/auth/auth-confirm";

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground">
          Confirming email...
        </main>
      }
    >
      <AuthConfirm />
    </Suspense>
  );
}
