/// <reference types="node" />

import { devAuthLoginUsers, devAuthSeedPassword } from "../prisma/dev-seed-data";

interface SupabaseAuthUser {
  readonly id: string;
  readonly email?: string;
}

interface ListUsersResponse {
  readonly users?: SupabaseAuthUser[];
}

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const requireConfig = (): void => {
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL is required to seed Supabase Auth users.");
  }

  if (!serviceRoleKey || serviceRoleKey === "replace-me") {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to seed Supabase Auth users.");
  }
};

const authAdminFetch = async <TResponse>(
  path: string,
  init: RequestInit = {}
): Promise<TResponse> => {
  requireConfig();

  const response = await fetch(`${supabaseUrl}/auth/v1${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...init.headers
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase Auth request failed: ${response.status} ${response.statusText} ${body}`);
  }

  return response.json() as Promise<TResponse>;
};

const findAuthUserByEmail = async (email: string): Promise<SupabaseAuthUser | null> => {
  const normalizedEmail = email.trim().toLowerCase();
  let page = 1;

  while (page <= 20) {
    const data = await authAdminFetch<ListUsersResponse>(`/admin/users?page=${page}&per_page=100`);
    const users = data.users ?? [];
    const user = users.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail);

    if (user) {
      return user;
    }

    if (users.length < 100) {
      return null;
    }

    page += 1;
  }

  throw new Error("Could not scan all Supabase Auth users while seeding dev accounts.");
};

const createAuthUser = async (email: string, name: string): Promise<void> => {
  await authAdminFetch<SupabaseAuthUser>("/admin/users", {
    body: JSON.stringify({
      email,
      password: devAuthSeedPassword,
      email_confirm: true,
      user_metadata: { name }
    }),
    method: "POST"
  });
};

const updateAuthUser = async (id: string, name: string): Promise<void> => {
  await authAdminFetch<SupabaseAuthUser>(`/admin/users/${id}`, {
    body: JSON.stringify({
      password: devAuthSeedPassword,
      email_confirm: true,
      user_metadata: { name }
    }),
    method: "PUT"
  });
};

const seedSupabaseAuthUsers = async (): Promise<void> => {
  requireConfig();

  for (const user of devAuthLoginUsers) {
    const existingUser = await findAuthUserByEmail(user.email);

    if (existingUser) {
      await updateAuthUser(existingUser.id, user.name);
      console.log(`Updated Supabase Auth dev user: ${user.email}`);
      continue;
    }

    await createAuthUser(user.email, user.name);
    console.log(`Created Supabase Auth dev user: ${user.email}`);
  }

  console.log(`Dev auth password: ${devAuthSeedPassword}`);
};

seedSupabaseAuthUsers().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
