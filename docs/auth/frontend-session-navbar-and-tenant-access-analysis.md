# Frontend Session Navbar And Tenant Access Analysis

Created: May 13, 2026.

## Purpose

This document analyzes the implementation needed to finish the authenticated frontend experience around:

- loading the current user from `GET /api/v1/me`,
- displaying real user data in the navbar,
- adding a user dropdown,
- implementing logout,
- handling tenant access and no-access state,
- preparing tenant selection behavior.

This is the next integration step after Supabase Google login and the development-only tenant bootstrap.

## Current State

The frontend can authenticate with Supabase and protect app routes.

Current flow:

```text
/login
  -> Supabase Google OAuth
  -> /auth/callback
  -> /dashboard
  -> AuthGuard checks Supabase session
  -> AppAccessGate calls GET /api/v1/me
```

The backend can resolve the Supabase user and create a local `User`. In development, it can also auto-join the user to the default tenant when:

```env
NODE_ENV=development
AUTO_JOIN_DEFAULT_TENANT=true
```

## Gaps Found

### Navbar Still Uses Fixture User Data

`UserMenu` currently reads:

```text
currentUserFixture
```

That means the navbar can show fake values even when the logged-in Supabase user is different.

This must be replaced with the result of `GET /api/v1/me`.

### `/me` Does Not Return User Name

The backend request context currently exposes:

```text
id
email
externalAuthProvider
externalAuthUserId
```

It does not include `name`, even though the local `User` table has a `name` column and the repository stores the value when creating a user from Supabase.

The navbar needs:

```text
user.name
user.email
```

If `name` is unavailable, the frontend should fall back to email.

### `/me` Does Not Return Tenant Name

The current tenant membership context contains:

```text
tenantId
tenantSlug
roleKey
permissions
```

The frontend currently maps:

```text
tenantName = tenantSlug
```

That is acceptable as a temporary fallback, but the app shell should eventually display the tenant's real name.

Recommended backend addition:

```text
tenantName
```

### No User Dropdown Exists Yet

The current navbar has separate icon buttons but no dropdown menu.

The first dropdown should include:

```text
Signed-in user name
Signed-in user email
Current role
Current tenant
Tenant switcher section if more than one tenant exists
Account placeholder
Sign out
```

### Logout Is Not Wired

Logout should:

1. call `supabase.auth.signOut()`,
2. reset frontend API/cache state,
3. clear tenant state,
4. redirect to `/login`.

The backend does not need a logout endpoint because Supabase owns the browser session.

### Tenant Selection Is Not Complete

The app currently auto-selects the first tenant from `/me`.

That is fine for one tenant. If the user has multiple tenants, we need either:

- a dropdown tenant switcher in the navbar/sidebar, or
- a dedicated `/select-tenant` page.

For now, implement tenant switching inside the user dropdown or tenant identity area. A dedicated page can come later if the UX needs it.

## Backend Changes Needed

### Add `name` To Authenticated User Context

Update the backend user context to include:

```ts
name?: string;
```

Affected areas:

```text
AuthenticatedUser
AuthenticatedUserContext
PrismaUsersRepository
ResolveAuthenticatedUserUseCase
/me response
unit tests
```

### Update Existing User Profile Data

When a Supabase user logs in, if the local user already exists, the backend should sync basic profile fields:

```text
email
name
```

This keeps the navbar current if the user's Google/Supabase profile changes.

Recommended repository method:

```text
syncExternalUserProfile(externalUser)
```

Or simpler:

```text
findOrCreateFromExternalUser(externalUser)
```

For now, it is acceptable to update the existing user inside `ResolveAuthenticatedUserUseCase` through a repository method.

### Add `tenantName` To Membership Context

Update:

```text
TenantMembershipContext
PrismaUsersRepository.toMembershipContext
frontend MeResponse mapping
```

New shape:

```json
{
  "tenantId": "tenant-id",
  "tenantSlug": "assuresoft-demo",
  "tenantName": "AssureSoft Demo",
  "roleKey": "owner",
  "permissions": ["tenant.read"]
}
```

## Frontend Changes Needed

### Store Current User In Redux

Add an auth slice:

```text
auth
  user
  sessionStatus
```

`AppAccessGate` should dispatch:

```text
setCurrentUser(data.user)
setTenants(data.tenants)
```

`UserMenu` should read from Redux instead of fixtures.

### Make Tenant State Switchable

Current tenant state should support:

```text
setTenants(tenants)
selectTenant(tenantSlug)
clearTenants()
```

This is needed for logout and tenant switching.

### User Dropdown

Implement a lightweight accessible dropdown without adding a new dependency yet.

Controls:

```text
button: user icon + visible name/email
menu:
  user identity block
  current tenant / role
  tenant list if more than one
  account placeholder
  sign out action
```

Use click outside / Escape later if needed. The first implementation can close on item click.

### Logout

`UserMenu` should call:

```ts
await supabase.auth.signOut();
dispatch(baseApi.util.resetApiState());
dispatch(clearCurrentUser());
dispatch(clearTenants());
router.replace("/login");
```

### No Access Page

The current `/no-access` page is acceptable for the first version.

Improve later with:

```text
current user email
request access action
invitation instructions
```

### Auth Callback

Current callback behavior is acceptable:

```text
restore session
redirect to target route
AppAccessGate calls /me
```

It should remain simple. Do not call too many business endpoints inside the callback page.

## Recommended User Flow After Implementation

### First Login In Development

```text
User clicks Google login
  -> Supabase returns session
  -> frontend enters /dashboard
  -> AuthGuard validates session exists
  -> AppAccessGate calls GET /api/v1/me
  -> backend creates/syncs local User
  -> backend auto-joins default tenant in development
  -> frontend stores user and tenant
  -> navbar displays real user and tenant data
```

### Logout

```text
User opens dropdown
  -> clicks Sign out
  -> Supabase session is cleared
  -> Redux auth/tenant/api cache is reset
  -> user redirects to /login
  -> protected routes redirect to /login if revisited
```

### No Access

```text
User has Supabase session
  -> /me returns tenants: []
  -> frontend redirects to /no-access
```

In development this should only happen if auto-join is disabled or misconfigured.

## Implementation Order

1. Backend: add `name` to user context.
2. Backend: sync existing user email/name from Supabase.
3. Backend: add `tenantName` to membership context.
4. Frontend: add auth slice and tenant clear/select actions.
5. Frontend: store `/me` user and tenants in Redux.
6. Frontend: replace fixture user menu with real user data.
7. Frontend: add dropdown menu with logout.
8. Frontend: verify protected route redirect behavior.
9. Run backend/frontend typecheck, tests, and builds.
10. Restart backend/frontend.

## Risks

### Stale `/me` Cache

RTK Query may keep `/me` cached after logout or tenant changes.

Mitigation:

```text
resetApiState on logout
invalidate CurrentUser after tenant membership changes later
```

### Multiple Tenants

Auto-selecting first tenant is fine for now, but it is not enough long term.

Mitigation:

```text
add tenant switcher now at a basic level
add /select-tenant later if needed
```

### Backend Tenant Name Contract

Frontend should not keep inventing `tenantName` from slug once backend can return the real value.

Mitigation:

```text
add tenantName to /me now
```

## Decision

Implement this now.

This is not throwaway work. It is the production path for session state, `/me`, navbar identity, logout, tenant access, and no-access handling. Future invitation and tenant access flows will build on the same `/me` and TenantMembership foundation.

