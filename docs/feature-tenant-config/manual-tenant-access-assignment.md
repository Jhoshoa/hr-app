# Manual Tenant Access Assignment

Created: May 13, 2026.

## Context

When a user signs in with Google through Supabase and sees this message:

```text
No workspace access

Your account was authenticated, but it does not have access to an organization yet.
In production, an admin invitation or approved access request will grant access.

Signed in as ichuta.josoe@gmail.com
```

the authentication flow worked, but the HR app backend did not find an active tenant
membership for that local user.

The key rule is:

```text
Supabase Auth proves identity.
The HR app backend grants tenant access.
```

So a Google account can be authenticated correctly and still have no access to any
organization.

## Why This Happens

The current flow is:

1. User signs in with Google.
2. Supabase validates the user identity.
3. The backend resolves or creates a local `User`.
4. `GET /api/v1/me` returns active tenant memberships.
5. If `tenants` is empty, the frontend redirects to `/no-access`.

In the current implementation:

- `GET /api/v1/me` is tenant-free and returns the current local user plus available tenants.
- Only `TenantMembership` rows with `status = 'ACTIVE'` are returned.
- The related `Tenant` must also have `status = 'ACTIVE'`.
- Development auto-join only runs when both conditions are true:

```env
NODE_ENV=development
AUTO_JOIN_DEFAULT_TENANT=true
```

The seed currently creates the `assuresoft-demo` tenant and the `owner` role. It does
not currently create an `hr_admin` role.

## Current Practical Fix

The full invitation flow is not required to unblock a known user during development or
controlled staging. The user can be granted access manually by creating or updating an
active `TenantMembership` row.

This should only be used as an operational shortcut until the production access flow is
implemented.

## Preconditions

Before running the SQL:

1. The user must have signed in at least once, so the backend has created a local `User`.
2. The tenant must exist.
3. The role must exist for that tenant.
4. The tenant should be active.

For the current seed data, the expected values are:

```text
email: ichuta.josoe@gmail.com
tenant slug: assuresoft-demo
role key: owner
```

## Manual SQL Assignment

Run this against the application Postgres database:

```sql
BEGIN;

WITH target_user AS (
  SELECT id
  FROM "User"
  WHERE lower(email) = lower('ichuta.josoe@gmail.com')
),
target_tenant AS (
  SELECT id
  FROM "Tenant"
  WHERE slug = 'assuresoft-demo'
    AND status = 'ACTIVE'
),
target_role AS (
  SELECT r.id
  FROM "Role" r
  JOIN target_tenant t ON t.id = r."tenantId"
  WHERE r.key = 'owner'
)
INSERT INTO "TenantMembership" (
  "id",
  "tenantId",
  "userId",
  "roleId",
  "status",
  "joinedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  t.id,
  u.id,
  r.id,
  'ACTIVE',
  now(),
  now(),
  now()
FROM target_user u
CROSS JOIN target_tenant t
CROSS JOIN target_role r
ON CONFLICT ("tenantId", "userId")
DO UPDATE SET
  "roleId" = EXCLUDED."roleId",
  "status" = 'ACTIVE',
  "joinedAt" = COALESCE("TenantMembership"."joinedAt", now()),
  "updatedAt" = now();

COMMIT;
```

## Verification Query

After running the assignment, verify the membership:

```sql
SELECT
  u.email,
  t.slug,
  r.key AS role,
  tm.status,
  tm."joinedAt"
FROM "TenantMembership" tm
JOIN "User" u ON u.id = tm."userId"
JOIN "Tenant" t ON t.id = tm."tenantId"
JOIN "Role" r ON r.id = tm."roleId"
WHERE lower(u.email) = lower('ichuta.josoe@gmail.com');
```

The expected result is one row with:

```text
email: ichuta.josoe@gmail.com
slug: assuresoft-demo
role: owner
status: ACTIVE
```

## If No Rows Are Changed

If the insert/update does not create or update a membership, check these cases:

- The user has not signed in yet, so `"User"` has no row for that email.
- `db:seed` has not been run.
- The tenant slug is not `assuresoft-demo`.
- The role key is not `owner`.
- The tenant is not `ACTIVE`.
- The database does not have `gen_random_uuid()` available. In that case, use an
  application-generated UUID or enable the appropriate Postgres UUID extension.

## Recommendation

Use manual SQL only for development, local testing, or controlled staging fixes.

For production, implement explicit tenant access management instead of silently attaching
authenticated users to a tenant. The recommended path is:

1. Keep `/no-access` as the correct state for authenticated users without memberships.
2. Add an internal/admin way to manage `TenantMembership` records:
   - list tenant users,
   - assign roles,
   - activate or disable memberships.
3. Add invitation-based access:
   - create invitation,
   - send invitation,
   - validate invitation token,
   - accept invitation after sign-in,
   - activate membership.
4. Add role management after the first membership flow is stable.
5. Later, consider domain-based self-join or access requests if the product needs them.

The current permission seed uses coarse permissions such as `users.read` and
`users.manage`. The tenant onboarding plan mentions finer-grained permissions such as
`user.invite`, `membership.manage`, and `role.assign`. Before building the final
invitation and user-management UI, decide whether to keep the current coarse permission
model or migrate to the finer-grained model.

## Local Development Alternative

For local development only, auto-join can be enabled:

```env
NODE_ENV=development
AUTO_JOIN_DEFAULT_TENANT=true
DEFAULT_TENANT_SLUG=assuresoft-demo
DEFAULT_TENANT_ROLE=owner
```

Do not enable this behavior in production.

Also note that `DEFAULT_TENANT_ROLE=hr_admin` will not work unless an `hr_admin` role is
added to the seed or created manually for the tenant.
