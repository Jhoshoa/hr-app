# Auth Resolve Route And Role-Based Loading Plan

Created: May 14, 2026.

## Problem

After email/password or Google login, the frontend currently sends users to the
default app home:

```text
/dashboard
```

Then `/me` resolves the real access context and may redirect again.

For a platform-only user like:

```text
platform.owner@example.test
```

this creates a bad intermediate state:

```text
login -> /dashboard -> /platform/company-signups
```

For a few seconds, the user can see dashboard UI that does not belong to their
access profile. This is not only visually rough; it also makes the permission
model feel unreliable.

## Core Decision

Do not send users directly to `/dashboard` after login.

Introduce a neutral route:

```text
/auth/resolve
```

This route should resolve the authenticated user's access context before
rendering any product page.

## When To Use `/auth/resolve`

Use `/auth/resolve` only after authentication entry points:

```text
/login email/password success -> /auth/resolve
/auth/callback OAuth success -> /auth/resolve
```

It should not be used as the normal loading state for every authenticated page.

## When Not To Use `/auth/resolve`

Do not redirect to `/auth/resolve` during normal app refreshes.

Examples:

```text
/dashboard refresh
/settings/company refresh
/platform/company-signups refresh
/employees refresh
```

Those pages should remain on the requested route and let their route guard or
layout-level gate verify access in place.

## Target Flow

Initial login:

```text
/login
  -> Supabase sign in
  -> /auth/resolve
  -> load /me
  -> resolve initial route
  -> redirect once
```

OAuth login:

```text
/auth/callback
  -> exchange/receive Supabase session
  -> /auth/resolve
  -> load /me
  -> resolve initial route
  -> redirect once
```

Authenticated refresh:

```text
current protected route
  -> verify Supabase session
  -> load /me in the gate/layout
  -> show skeleton/loading for that route
  -> render page if allowed
  -> redirect only if access is invalid
```

## Route Resolution

Create a centralized function:

```ts
resolveInitialRoute(me: MeResponse, redirectTo?: string): string
```

Initial version:

```text
platformRoles.length > 0 && tenants.length === 0 -> /platform/company-signups
tenants.length > 0 -> /dashboard
otherwise -> /no-access
```

Later versions can account for richer roles:

```text
PLATFORM_OWNER -> /platform/company-signups
PLATFORM_ADMIN -> /platform/company-signups
owner -> /dashboard
hr_admin -> /dashboard
manager -> /team
employee -> /me
finance -> /reports/finance
no access -> /no-access
```

The rule must be central and testable. Avoid scattering role-home decisions
across login, callback, app gate, platform gate, and individual pages.

## RedirectTo Handling

Support:

```text
/auth/resolve?redirectTo=/settings/company
```

The resolver should only honor `redirectTo` if the user has access to the target
area.

Examples:

```text
tenant user + redirectTo=/settings/company -> /settings/company
platform-only user + redirectTo=/settings/company -> /platform/company-signups
tenant user + redirectTo=/platform/company-signups without platform role -> /dashboard or /no-access
no-access user + any redirectTo -> /no-access
```

Initial implementation can use broad route classification:

```text
/platform/* requires platformRoles.length > 0
app routes require tenants.length > 0
/no-access is always allowed
```

Later, this should evolve into route metadata or permission-based access rules.

## Loading UX

`/auth/resolve` should render a neutral loading state.

Recommended copy:

```text
Preparing your workspace...
```

It should not show:

- Dashboard cards.
- Tenant navigation.
- Platform navigation.
- Any data from a cached workspace that may belong to another user.

For normal route refreshes, use page/layout-specific skeletons:

```text
/dashboard -> dashboard skeleton
/settings/company -> settings form skeleton
/platform/company-signups -> platform table skeleton
```

This keeps refreshes fast and contextual without showing incorrect content.

## Workspace Cache Rules

The existing workspace cache is useful, but it must not decide final routing
after login.

Recommended rules:

1. `/auth/resolve` should always call `/me`.
2. Cache may be used only for non-sensitive visual continuity after route access
   is confirmed.
3. Cache should be cleared on logout and when Supabase session user changes.
4. Cached tenant/platform context should never override fresh `/me` results.
5. If cached user email/id does not match the current Supabase session, ignore
   and clear the cache.

This prevents cases where a previous user's tenant context appears briefly after
logging in with another account.

## Guard Responsibilities

### AuthGuard

Responsible for:

- Verifying there is a Supabase session.
- Redirecting unauthenticated users to `/login`.
- Preserving `redirectTo`.

Not responsible for:

- Choosing the user's initial product home.
- Showing dashboard/platform content before `/me` confirms access.

### AuthResolve Page

Responsible for:

- Loading `/me`.
- Saving current user, tenants, and platform roles.
- Choosing the initial route.
- Respecting valid `redirectTo`.
- Showing a neutral loading state.

### AppAccessGate

Responsible for:

- Protecting tenant app routes.
- Loading `/me` when needed.
- Showing tenant-route skeletons during refresh.
- Redirecting platform-only users away from tenant pages.

### PlatformAccessGate

Responsible for:

- Protecting platform routes.
- Loading `/me` when needed.
- Showing platform-route skeletons during refresh.
- Redirecting non-platform users away from platform pages.

## Implementation Steps

1. Add route helpers:
   - `authResolvePath = "/auth/resolve"`
   - `resolveInitialRoute(me, redirectTo?)`
   - `canAccessRoute(me, pathname)`
2. Add `/auth/resolve` page and component.
3. Update email/password login success to redirect to `/auth/resolve`.
4. Update OAuth callback success to redirect to `/auth/resolve`.
5. Keep refreshes on their current route; do not send all auth checks to
   `/auth/resolve`.
6. Update `AppAccessGate` so platform-only users never render tenant children.
7. Update `PlatformAccessGate` so non-platform users never render platform
   children.
8. Tighten workspace cache usage to avoid stale-user flashes.
9. Add tests for:
   - platform-only user initial route.
   - tenant user initial route.
   - user with no access.
   - valid tenant `redirectTo`.
   - invalid platform `redirectTo`.
   - stale workspace cache ignored after session user change.

## Definition Of Done

- Logging in as `platform.owner@example.test` never renders `/dashboard`.
- Logging in as `demo.owner@example.test` lands on `/dashboard`.
- Refreshing `/platform/company-signups` stays on platform route and shows only
  platform loading/skeleton states while `/me` refreshes.
- Refreshing `/dashboard` stays on dashboard route and shows only tenant app
  loading/skeleton states while `/me` refreshes.
- A no-access user lands on `/no-access`.
- `redirectTo` is respected only when access allows it.
- Route-home decisions live in one tested module.
