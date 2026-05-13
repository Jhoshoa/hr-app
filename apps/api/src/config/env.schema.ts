import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  API_PREFIX: z.string().min(1).default("api"),
  DATABASE_URL: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(1),
  DEFAULT_TENANT_SLUG: z.string().min(1).default("assuresoft-demo"),
  DEFAULT_TENANT_ROLE: z.string().min(1).default("owner"),
  AUTO_JOIN_DEFAULT_TENANT: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true")
});

export const validateEnv = (config: Record<string, unknown>): Record<string, unknown> => {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${result.error.message}`);
  }

  return result.data;
};
