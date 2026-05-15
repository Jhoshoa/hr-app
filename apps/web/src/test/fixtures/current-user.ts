import type { CurrentUser, TenantSummary } from "@/types/identity";

export const currentUserFixture: CurrentUser = {
  email: "maria.rojas@andeshr.example",
  id: "user-hr-admin",
  name: "Maria Rojas"
};

export const currentTenantFixture: TenantSummary = {
  permissions: [
    "tenant.read",
    "employees.read",
    "employees.manage",
    "users.manage",
    "audit.read",
    "roles.manage"
  ],
  roleKey: "hr_admin",
  roles: [
    {
      id: "role-hr-admin",
      isSystemRole: true,
      key: "hr_admin",
      name: "HR Admin"
    }
  ],
  tenantId: "tenant-assuresoft-demo",
  tenantName: "Andes People Ops",
  tenantSlug: "assuresoft-demo"
};
