import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";

export const createSupabaseBrowserClient = () => {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    return null;
  }

  return createClient(env.supabaseUrl, env.supabaseAnonKey);
};
