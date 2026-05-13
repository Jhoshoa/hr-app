import type { CurrentUser, TenantSummary } from "@/types/identity";

export const currentUserFixture: CurrentUser = {
  email: "maria.rojas@andeshr.example",
  id: "user-hr-admin",
  name: "Maria Rojas"
};

export const currentTenantFixture: TenantSummary = {
  permissions: [
    "dashboard.read",
    "employee.read",
    "employee.write",
    "directory.read",
    "leave.read",
    "document.read",
    "audit.read",
    "role.manage"
  ],
  roleKey: "hr_admin",
  tenantId: "tenant-assuresoft-demo",
  tenantName: "Andes People Ops",
  tenantSlug: "assuresoft-demo"
};
