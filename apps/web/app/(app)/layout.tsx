import { AppShell } from "@/components/app-shell/app-shell";
import { AppAccessGate } from "@/components/auth/app-access-gate";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function AuthenticatedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGuard>
      <AppAccessGate>
        <AppShell>{children}</AppShell>
      </AppAccessGate>
    </AuthGuard>
  );
}
