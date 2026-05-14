export const authCallbackPath = "/auth/callback";
export const appHomePath = "/dashboard";
export const loginPath = "/login";
export const platformHomePath = "/platform/company-signups";

export const getAuthCallbackUrl = () => {
  if (typeof window === "undefined") {
    return authCallbackPath;
  }

  return `${window.location.origin}${authCallbackPath}`;
};
