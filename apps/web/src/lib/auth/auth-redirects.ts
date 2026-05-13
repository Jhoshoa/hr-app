export const authCallbackPath = "/auth/callback";
export const appHomePath = "/dashboard";
export const loginPath = "/login";

export const getAuthCallbackUrl = () => {
  if (typeof window === "undefined") {
    return authCallbackPath;
  }

  return `${window.location.origin}${authCallbackPath}`;
};
