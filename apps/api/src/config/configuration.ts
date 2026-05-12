export const configuration = () => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT ?? 3001),
    apiPrefix: process.env.API_PREFIX ?? "api",
    defaultTenantSlug: process.env.DEFAULT_TENANT_SLUG ?? "assuresoft-demo"
  },
  database: {
    url: process.env.DATABASE_URL
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: process.env.SUPABASE_JWT_SECRET
  }
});
