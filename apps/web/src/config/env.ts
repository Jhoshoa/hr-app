import { z } from "zod";

const envSchema = z.object({
  apiBaseUrl: z.string().url().default("http://localhost:3001/api/v1"),
  supabaseUrl: z.string().optional(),
  supabaseAnonKey: z.string().optional(),
  authMode: z.enum(["mock", "supabase"]).default("mock")
});

export const env = envSchema.parse({
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  authMode: process.env.NEXT_PUBLIC_AUTH_MODE
});
