export { PrismaClient } from "@prisma/client";
export { permissionCatalog } from "./permission-catalog";
export type { PermissionCatalogEntry, PermissionKey } from "./permission-catalog";
export type {
  AuditEvent,
  Permission,
  Role,
  RolePermission,
  TenantInvitation,
  TenantInvitationRole,
  Tenant,
  TenantMembership,
  TenantMembershipRole,
  User
} from "@prisma/client";
