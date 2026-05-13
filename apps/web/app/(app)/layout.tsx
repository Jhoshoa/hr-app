import { AppShell } from "@/components/app-shell/app-shell";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function AuthenticatedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
