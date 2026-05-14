import type { CurrentUser, PlatformRoleKey, TenantSummary } from "@/types/identity";

const workspaceCacheKey = "hr-app:workspace-context";

export interface WorkspaceContextCache {
  readonly user: CurrentUser;
  readonly tenants: TenantSummary[];
  readonly platformRoles: PlatformRoleKey[];
  readonly selectedTenantSlug?: string;
}

const isWorkspaceContextCache = (value: unknown): value is WorkspaceContextCache => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<WorkspaceContextCache>;
  return Boolean(
    candidate.user?.id &&
    Array.isArray(candidate.tenants) &&
    Array.isArray(candidate.platformRoles)
  );
};

export const loadWorkspaceContextCache = (): WorkspaceContextCache | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(workspaceCacheKey);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);
    return isWorkspaceContextCache(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
};

export const saveWorkspaceContextCache = (context: WorkspaceContextCache) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(workspaceCacheKey, JSON.stringify(context));
};

export const saveSelectedTenantSlugToWorkspaceCache = (tenantSlug: string) => {
  if (typeof window === "undefined") {
    return;
  }

  const currentCache = loadWorkspaceContextCache();

  if (!currentCache) {
    return;
  }

  saveWorkspaceContextCache({
    ...currentCache,
    selectedTenantSlug: tenantSlug
  });
};

export const clearWorkspaceContextCache = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(workspaceCacheKey);
};
