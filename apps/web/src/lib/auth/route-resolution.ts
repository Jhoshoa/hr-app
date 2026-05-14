import type { MeResponse } from "@/features/auth/current-user-api";
import { appHomePath, platformHomePath } from "./auth-redirects";

const noAccessPath = "/no-access";

const isInternalPath = (path: string): boolean => path.startsWith("/") && !path.startsWith("//");

const normalizePath = (path?: string | null): string | undefined => {
  if (!path) {
    return undefined;
  }

  try {
    const decodedPath = decodeURIComponent(path);
    return isInternalPath(decodedPath) ? decodedPath : undefined;
  } catch {
    return isInternalPath(path) ? path : undefined;
  }
};

export const canAccessRoute = (me: MeResponse, pathname?: string | null): boolean => {
  const normalizedPath = normalizePath(pathname);

  if (!normalizedPath || normalizedPath === noAccessPath) {
    return true;
  }

  if (normalizedPath.startsWith("/platform")) {
    return me.platformRoles.length > 0;
  }

  return me.tenants.length > 0;
};

export const getDefaultInitialRoute = (me: MeResponse): string => {
  if (me.platformRoles.length > 0 && me.tenants.length === 0) {
    return platformHomePath;
  }

  if (me.tenants.length > 0) {
    return appHomePath;
  }

  if (me.platformRoles.length > 0) {
    return platformHomePath;
  }

  return noAccessPath;
};

export const resolveInitialRoute = (me: MeResponse, redirectTo?: string | null): string => {
  const normalizedRedirect = normalizePath(redirectTo);

  if (normalizedRedirect && canAccessRoute(me, normalizedRedirect)) {
    return normalizedRedirect;
  }

  return getDefaultInitialRoute(me);
};
