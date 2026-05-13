# Authenticated Loading State Analysis

Created: May 13, 2026.

## Problem

On page refresh, the authenticated app can show two full-page loading states:

```text
Checking session...
Loading workspace...
```

Both states are technically valid, but showing them one after another creates a heavy experience. Once a user is already logged in, the app should feel stable and only show skeleton/loading states where backend data is actually being loaded.

## Current Meaning

### Checking Session

Purpose:

- Ask Supabase whether the browser has a valid session.
- Decide whether to allow the authenticated app or redirect to `/login`.

This is useful for:

- First login.
- Auth callback.
- Unknown session state.
- Expired session.

### Loading Workspace

Purpose:

- Call `GET /api/v1/me`.
- Resolve tenant memberships, selected tenant, permissions, and access state.
- Decide whether to enter the app or redirect to `/no-access`.

This is useful when:

- We have a session but no tenant/user context yet.
- User just signed in.
- User may have no tenant access.

## UX Recommendation

Do not show two full-page blockers during a normal refresh.

Recommended behavior:

```text
Unknown session and no cached app context:
  show Checking session

Session exists but no tenant context:
  show minimal workspace skeleton/loading once

Session exists and cached tenant context exists:
  render AppShell immediately
  refetch /me in background
  use component-level skeletons for page data
```

## Desired User Experience

### Login / Callback

It is acceptable to show full-page loading because the app is deciding where the user belongs.

Routes:

```text
/login
/auth/callback
```

Recommended states:

- Checking session.
- Completing sign in.
- Redirecting to app.
- No access if tenant memberships are empty.

### Authenticated Refresh

When refreshing `/dashboard`, `/settings/company`, or any protected route:

- Avoid showing both full-page states.
- Prefer stable app shell.
- Show skeletons inside the active page.
- Keep cached tenant/user data visible while `/me` refetches.

### No Cached Context

If there is no cached tenant context yet, a short full-page workspace loading state is acceptable.

This can happen:

- First load after sign in.
- Browser storage was cleared.
- Redux memory state is empty after hard refresh and `/me` has not completed.

## Implementation Plan

### 1. Review Current Components

Likely files:

```text
apps/web/src/components/auth/auth-guard.tsx
apps/web/src/components/auth/app-access-gate.tsx
apps/web/src/features/auth/current-user-api.ts
apps/web/src/features/tenants/tenant-slice.ts
apps/web/src/components/app-shell/app-shell.tsx
```

### 2. AuthGuard Changes

Current likely behavior:

- Shows `Checking session...` while Supabase session is loading.

Recommended behavior:

- Keep full-page `Checking session...` only while session state is truly unknown.
- Once Supabase confirms a session exists, render children immediately.
- Do not wait for `/me` here.

AuthGuard should only answer:

```text
Is there a valid auth session?
```

It should not answer:

```text
Does this user have tenant access?
```

### 3. AppAccessGate Changes

Current likely behavior:

- Shows `Loading workspace...` while `/me` loads.

Recommended behavior:

- If `/me` is loading and no tenant context exists, show a minimal workspace loading state.
- If tenant context already exists in Redux, render children immediately while `/me` refetches.
- If `/me` returns no tenants, redirect to `/no-access`.
- If `/me` returns tenants, update Redux and render children.

Pseudo logic:

```ts
const hasCachedTenant = Boolean(currentTenant?.tenantId);
const { data, isLoading, isFetching } = useGetMeQuery();

if (isLoading && !hasCachedTenant) {
  return <WorkspaceSkeleton />;
}

if (data?.tenants.length === 0) {
  redirect("/no-access");
}

return children;
```

### 4. Tenant Slice Concern

Current tenant slice starts with a fixture tenant.

That can hide loading problems because the app always appears to have a tenant.

Recommended improvement:

- Replace fixture default with an explicit empty/unknown state.
- Use fixtures only in mock mode or tests.
- Track whether tenant context is hydrated:

```ts
interface TenantState {
  currentTenant: TenantSummary | null;
  availableTenants: TenantSummary[];
  isHydrated: boolean;
}
```

This is a bigger change and should be done carefully because many components assume `currentTenant` is not null.

Safer short-term option:

- Keep current slice shape for now.
- Add a derived helper that checks whether current tenant came from real `/me`.
- Later refactor to nullable tenant state.

### 5. AppShell Skeletons

If rendering shell before `/me` finishes, shell areas should tolerate missing or stale data:

- Tenant identity can show skeleton lines.
- User menu can show skeleton/avatar placeholder.
- Sidebar can render static navigation only after permissions exist.

Recommended short-term approach:

- Do not render shell until at least one tenant context exists.
- Once tenant exists, keep shell stable during refetch.

### 6. Page-Level Loading

Each page should own its own API loading state:

- Forms: field-level skeletons.
- Tables: skeleton rows.
- Cards: skeleton lines/blocks.
- Dashboards: metric skeleton cards.

Company Settings already follows this pattern after the skeleton update.

## Recommended First Code Change

Implement a minimal improvement first:

1. Keep `Checking session...` in `AuthGuard`.
2. Update `AppAccessGate` so `Loading workspace...` only appears when there is no tenant context.
3. If tenant context exists, render children while `/me` refetches.
4. Do not refactor tenant slice to nullable yet.

This reduces visual loading without a large app-wide refactor.

## Later Improvement

Refactor tenant state to remove fixture defaults:

```text
currentTenant: TenantSummary | null
isHydrated: boolean
```

Then update:

- Sidebar navigation.
- Tenant identity.
- User menu.
- PermissionGate.
- RTK Query base API tenant header logic.

This is cleaner but touches more files.

## Decision

Use full-page loading only for authentication or missing tenant context.

Use skeletons for data inside the authenticated app.

The app should not show both `Checking session...` and `Loading workspace...` during normal logged-in refresh unless there is no cached app context and `/me` has not completed yet.

