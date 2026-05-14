# Development Access Seed Strategy

Created: May 14, 2026.

## Problem

`AUTO_JOIN_DEFAULT_TENANT=true` was useful at the beginning because any authenticated user could enter the local app without building invitations, platform approvals, or tenant onboarding.

Now that the product has:

- Company signup requests.
- Platform roles.
- Tenant memberships.
- Tenant-specific settings and data.

the auto-join shortcut is risky even in local development.

With this environment:

```env
DEFAULT_TENANT_SLUG=assuresoft-demo
DEFAULT_TENANT_ROLE=owner
AUTO_JOIN_DEFAULT_TENANT=true
```

any user who authenticates with Google and calls `/me` is automatically granted:

```text
tenant: assuresoft-demo
role: owner
```

That is why a newly registered company admin can log in and see the default tenant data. The backend is doing exactly what the local shortcut tells it to do.

## Finding

The shortcut now conflicts with the real access model.

The correct rule is:

```text
Authentication proves identity.
TenantMembership grants tenant access.
PlatformUserRole grants platform/admin access.
CompanySignupRequest does not grant access until approval.
```

A user who submits a company signup request should not automatically see any tenant dashboard.

## Recommendation

Stop using `AUTO_JOIN_DEFAULT_TENANT` as the normal local development flow.

Recommended local env:

```env
DEV_AUTH_SEED_PASSWORD=Password123!
```

`DEFAULT_TENANT_SLUG`, `DEFAULT_TENANT_ROLE`, `AUTO_JOIN_DEFAULT_TENANT`, and
`DEV_SEED_USER_EMAIL` are no longer part of the normal path.

## Preferred Development Model

Use explicit seed data instead of auto-join.

Implemented seed control:

```env
DEV_AUTH_SEED_PASSWORD=Password123!
```

The seed always creates deterministic local demo data:

- `platform.owner@example.test` with `PLATFORM_OWNER`.
- `demo.owner@example.test` as owner of `assuresoft-demo`.
- `secondary.owner@example.test` as owner of `secondary-demo`.
- `pending.signup@example.test` as a pending company signup request.

The Supabase Auth seed creates matching login accounts for the first three
emails, using `DEV_AUTH_SEED_PASSWORD`.

The seed should create known local actors:

### Platform Owner

Purpose:

- Approves/rejects company signup requests.
- Accesses platform admin pages.

Data:

```text
User
  email: platform.owner@example.test

PlatformUserRole
  roleKey: PLATFORM_OWNER
```

Tenant membership:

- Optional.
- Platform owner should not need tenant membership to approve signup requests.

### Demo Tenant Admin

Purpose:

- Tests normal tenant dashboard and settings.

Data:

```text
Tenant
  slug: assuresoft-demo

User
  email: demo.owner@example.test

TenantMembership
  role: owner or hr_admin
  status: ACTIVE
```

### Second Tenant Admin

Purpose:

- Tests tenant isolation.
- Confirms data from tenant A does not appear in tenant B.

Data:

```text
Tenant
  slug: secondary-demo

User
  email: secondary.owner@example.test

TenantMembership
  role: owner
  status: ACTIVE
```

### Pending Signup Request

Purpose:

- Tests approval flow.

Data:

```text
CompanySignupRequest
  status: PENDING
  adminEmail: pending.signup@example.test
```

No tenant membership should exist until approval.

## Optional Safety Guard

The auto-join safety guard was removed after implementing Supabase Auth dev user
seeding. Development access now comes from explicit seeded users and
memberships, not from automatic tenant assignment during `/me`.

## Approval Page Priority

Implement the seed/access cleanup before going deeper into the Approval page.

Reason:

- The Approval page must be tested as a platform owner/admin.
- Company signup submitters must remain without tenant access until approved.
- Keeping auto-join enabled will hide real bugs because every new user gets dashboard access automatically.
- It also makes tenant isolation tests unreliable.

Recommended order:

1. Disable normal auto-join.
2. Run `corepack pnpm db:rebuild:local` when a clean local database is needed.
3. Run `corepack pnpm auth:seed:dev`.
4. Verify `/me` returns only seeded access for each login account.
5. Continue Approval page implementation.

## Local Cleanup Needed

After disabling auto-join, local DB may still contain memberships created accidentally.

The simplest local cleanup path is to reset the local database:

```powershell
$env:Path = "C:\Users\josoe.ichuta\AppData\Local\nvm\v18.20.8;$env:Path"
corepack pnpm db:rebuild:local
corepack pnpm auth:seed:dev
```

This command is destructive for the local database: it regenerates Prisma Client,
drops local data, reapplies migrations, and runs the seed.

Before running it on Windows, stop the API dev server so Prisma can replace its
generated client files without DLL locking issues.

For test users like `dan347114@gmail.com`, remove the accidental `TenantMembership` from `assuresoft-demo` unless that access is intentionally seeded.

Also clear frontend workspace cache when switching accounts:

```js
localStorage.removeItem("hr-app:workspace-context")
```

The cache does not grant backend permissions, but it can briefly display stale workspace context before `/me` refetches.

## Production Rule

Production must never use auto-join.

Production tenant access should come only from:

- Approved company signup.
- Explicit invitation.
- Admin-created membership.
- Future approved access request.
- Future controlled domain-based self-join, if enabled per tenant.

## Decision

Use explicit seeded users, platform roles, tenants, and memberships for development.

Treat `AUTO_JOIN_DEFAULT_TENANT` as deprecated for normal local work and keep it disabled while building company signup, approval, and tenant access flows.
The implementation has now removed the auto-join code path from the backend.
