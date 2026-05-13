import { env } from "@/config/env";
import { createSupabaseBrowserClient } from "./supabase-client";

export const getAccessToken = async (): Promise<string | undefined> => {
  if (env.authMode === "mock") {
    return "mock-development-token";
  }

  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase?.auth.getSession() ?? { data: { session: null } };

  return data.session?.access_token;
};
