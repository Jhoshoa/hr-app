export const authCallbackPath = "/auth/callback";
export const authConfirmPath = "/auth/confirm";
export const authResolvePath = "/auth/resolve";
export const appHomePath = "/dashboard";
export const loginPath = "/login";
export const platformHomePath = "/platform/company-signups";

export const getAuthCallbackUrl = () => {
  if (typeof window === "undefined") {
    return authCallbackPath;
  }

  return `${window.location.origin}${authCallbackPath}`;
};

export const getAuthConfirmUrl = (nextPath: string) => {
  if (typeof window === "undefined") {
    return `${authConfirmPath}?next=${encodeURIComponent(nextPath)}`;
  }

  return `${window.location.origin}${authConfirmPath}?next=${encodeURIComponent(nextPath)}`;
};
