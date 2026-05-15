import type {
  AccessPermission,
  TenantInvitation,
  TenantInvitationStatus
} from "./access-types";

export const maxInvitationResends = 3;

export const formatAccessDate = (value?: string | null) => {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
};

export const getInvitationDisplayStatus = (
  invitation: Pick<TenantInvitation, "status" | "expiresAt">
): TenantInvitationStatus => {
  if (invitation.status === "PENDING" && new Date(invitation.expiresAt).getTime() <= Date.now()) {
    return "EXPIRED";
  }

  return invitation.status;
};

export const canResendInvitation = (
  invitation: Pick<TenantInvitation, "status" | "expiresAt" | "resendCount">
) => {
  const status = getInvitationDisplayStatus(invitation);

  return (status === "PENDING" || status === "EXPIRED") && invitation.resendCount < maxInvitationResends;
};

export const canCancelInvitation = (
  invitation: Pick<TenantInvitation, "status" | "expiresAt">
) => {
  const status = getInvitationDisplayStatus(invitation);

  return status === "PENDING" || status === "EXPIRED";
};

export const groupPermissionsByModule = (permissions: readonly AccessPermission[]) => {
  const groups = new Map<string, AccessPermission[]>();

  for (const permission of permissions) {
    const moduleName = permission.module?.trim() || "Other";
    groups.set(moduleName, [...(groups.get(moduleName) ?? []), permission]);
  }

  return [...groups.entries()]
    .map(([moduleName, items]) => ({
      moduleName,
      permissions: items.sort((first, second) => {
        if (first.sortOrder !== second.sortOrder) {
          return first.sortOrder - second.sortOrder;
        }

        return first.key.localeCompare(second.key);
      })
    }))
    .sort((first, second) => first.moduleName.localeCompare(second.moduleName));
};

export const groupPermissionKeysForDisplay = (
  permissionKeys: readonly string[],
  catalog: readonly AccessPermission[]
) => {
  const permissionByKey = new Map(catalog.map((permission) => [permission.key, permission]));
  const groups = new Map<
    string,
    {
      key: string;
      description: string;
      isCritical: boolean;
      sortOrder: number;
    }[]
  >();

  for (const key of [...new Set(permissionKeys)].sort()) {
    const permission = permissionByKey.get(key);
    const moduleName = permission?.module?.trim() || moduleNameFromPermissionKey(key);
    const item = {
      key,
      description: permission?.description ?? key,
      isCritical: permission?.isCritical ?? false,
      sortOrder: permission?.sortOrder ?? 0
    };

    groups.set(moduleName, [...(groups.get(moduleName) ?? []), item]);
  }

  return [...groups.entries()]
    .map(([moduleName, permissions]) => ({
      moduleName,
      permissions: permissions.sort((first, second) => {
        if (first.sortOrder !== second.sortOrder) {
          return first.sortOrder - second.sortOrder;
        }

        return first.key.localeCompare(second.key);
      })
    }))
    .sort((first, second) => first.moduleName.localeCompare(second.moduleName));
};

export const roleKeyFromName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);

const moduleNameFromPermissionKey = (permissionKey: string) => {
  const [rawModule] = permissionKey.split(".");
  const value = rawModule?.trim();

  if (!value) {
    return "Other";
  }

  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
};
