import { Suspense } from "react";
import { InvitationAcceptPage } from "@/features/access/components/invitation-accept-page";

export default function InvitationAcceptRoute() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading invitation...</div>}>
        <InvitationAcceptPage />
      </Suspense>
    </main>
  );
}
