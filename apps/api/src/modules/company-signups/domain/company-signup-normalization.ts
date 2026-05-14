export const reservedTenantSlugs = new Set([
  "www",
  "api",
  "admin",
  "app",
  "login",
  "signup",
  "support",
  "help",
  "docs",
  "platform"
]);

export const tenantSlugPattern = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/;

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const normalizeTenantSlug = (slug: string): string => slug.trim().toLowerCase();

export const normalizeOptionalText = (value: string | undefined): string | undefined => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

export const normalizeCompanyWebsite = (value: string | undefined): string | undefined => {
  const normalized = normalizeOptionalText(value)?.toLowerCase();

  if (!normalized) {
    return undefined;
  }

  return normalized.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
};
