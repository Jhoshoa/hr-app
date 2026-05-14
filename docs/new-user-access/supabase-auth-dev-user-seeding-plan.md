# Supabase Auth Dev User Seeding Plan

Created: May 14, 2026.

## Goal

Use real Supabase Auth email/password users for local development demo accounts.

Today the Prisma seed creates app users in our local `User` table:

```text
platform.owner@example.test
demo.owner@example.test
secondary.owner@example.test
pending.signup@example.test
```

Those records are useful for roles, tenant memberships, and signup workflow data,
but they cannot log in by themselves. Authentication is owned by Supabase Auth,
not by our local `User` table.

To log in with those accounts, matching users must also exist in Supabase Auth.

## Source Of Truth

The desired model remains:

```text
Supabase Auth = identity, password, OAuth, sessions, refresh tokens
Local User table = app profile, platform roles, tenant memberships
```

The backend should not implement its own password authentication.

## Required Supabase Key

Yes, we need a Supabase API key for this.

The script must use:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Reason:

- Creating Auth users programmatically requires Supabase Admin APIs.
- Admin APIs require the service role key.
- The service role key must only be used in backend scripts or trusted backend code.
- The service role key must never be exposed in the frontend.

The existing `SUPABASE_ANON_KEY` is not enough for this script. It is intended
for browser/client operations such as sign in, sign up, and reading public API
surfaces protected by RLS.

## Recommended Dev Accounts

Use stable emails and a shared local-only password:

```text
platform.owner@example.test     / Password123!
demo.owner@example.test         / Password123!
secondary.owner@example.test    / Password123!
```

Keep `pending.signup@example.test` as signup workflow data only. It should not
need login until the approval flow creates access.

These accounts are development-only.

## Environment Variables

The goal is to remove the confusing local auto-join variables:

```env
DEFAULT_TENANT_SLUG=assuresoft-demo
DEFAULT_TENANT_ROLE=owner
AUTO_JOIN_DEFAULT_TENANT=false
DEV_SEED_USER_EMAIL=
```

After implementing Supabase Auth user seeding, normal local development should
only need:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
```

Optional:

```env
DEV_AUTH_SEED_PASSWORD=Password123!
```

If omitted, the script can use a hardcoded development password and print it in
the terminal output.

## Proposed Scripts

Status: implemented.

Add a script at:

```text
packages/database/scripts/seed-supabase-auth-users.ts
```

Root command:

```bash
corepack pnpm auth:seed:dev
```

Database package command:

```bash
corepack pnpm --filter @hr-app/database auth:seed:dev
```

The script should:

1. Read `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
2. Create a Supabase admin client.
3. Upsert-like behavior for each dev auth user:
   - Try to find existing auth user by email if supported by the SDK/API.
   - If not found, create user with email/password and `email_confirm: true`.
   - If found, optionally update password and confirm email.
4. Print the created/updated accounts.
5. Fail fast if service role key is missing.

## Prisma Seed Coordination

The Prisma seed should keep creating the local app records:

```text
User
PlatformUserRole
Tenant
Role
RolePermission
TenantMembership
CompanySignupRequest
```

The local `User` records should use the same emails as Supabase Auth users.

On first login:

1. Frontend signs in with Supabase Auth email/password.
2. Supabase returns an access token.
3. Frontend calls backend `/me` with the token.
4. Backend verifies the token with Supabase.
5. Backend resolves the email.
6. Backend finds the seeded local `User` by email.
7. Backend links `externalAuthProvider` and `externalAuthUserId`.
8. Backend returns platform roles and tenant memberships.

This reuses the existing pending-user claiming behavior.

## Frontend Changes Needed

Status: implemented.

The login page currently supports Google login.

Add email/password login for Supabase mode:

```text
email input
password input
sign in button
validation and error state
loading state
```

The frontend should call:

```ts
supabase.auth.signInWithPassword({ email, password })
```

Then it should follow the same post-login flow used by Google:

```text
Supabase session -> backend /me -> workspace resolution -> dashboard/no-access
```

## Backend Changes Needed

Status: implemented for auto-join removal.

No new password endpoint should be added.

The backend should continue accepting Supabase JWTs only.

Cleanup completed:

1. Removed `AUTO_JOIN_DEFAULT_TENANT` from config.
2. Removed `DEFAULT_TENANT_SLUG` and `DEFAULT_TENANT_ROLE` from active config.
3. Removed `DEV_SEED_USER_EMAIL`.
4. Removed `ensureDevelopmentTenantMembership` from the identity flow.

Keep tests proving that users without `TenantMembership` cannot access tenant
endpoints.

## Reset Flow

Recommended clean local setup after implementation:

```powershell
$env:Path = "C:\Users\josoe.ichuta\AppData\Local\nvm\v18.20.8;$env:Path"
corepack pnpm db:rebuild:local
corepack pnpm auth:seed:dev
```

On Windows, stop the API dev server before running this flow to avoid Prisma
generated-client locks.

Then start:

```powershell
corepack pnpm --filter @hr-app/api dev
corepack pnpm --filter @hr-app/web dev
```

Login with:

```text
platform.owner@example.test / Password123!
demo.owner@example.test / Password123!
secondary.owner@example.test / Password123!
```

## Safety Rules

- Do not insert directly into Supabase `auth.users`.
- Use Supabase Admin API with service role key.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Keep demo passwords development-only.
- Do not use this script against production unless it is explicitly rewritten
  for production operations.

## Implementation Order

1. Add shared dev auth account constants for seed scripts.
2. Add Supabase Auth seeding script.
3. Add package/root `auth:seed:dev` commands.
4. Add email/password login UI in the frontend.
5. Test login for:
   - `platform.owner@example.test`
   - `demo.owner@example.test`
   - `secondary.owner@example.test`
6. Remove auto-join config and related code after the new flow is verified.
7. Update README with the final local setup commands.

## Decision

Implement Supabase Auth user seeding for development.

This gives us realistic login behavior while keeping Supabase Auth as the source
of truth for authentication and the local app database as the source of truth for
authorization, roles, tenant memberships, and product data.
