import type { ReactNode } from "react";
import { PlatformShell } from "@/components/platform-shell/platform-shell";
import { PlatformAccessGate } from "@/components/auth/platform-access-gate";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function PlatformLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AuthGuard>
      <PlatformAccessGate>
        <PlatformShell>{children}</PlatformShell>
      </PlatformAccessGate>
    </AuthGuard>
  );
}
