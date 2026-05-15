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

export const roleKeyFromName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
