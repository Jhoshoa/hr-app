# Tenant Onboarding And Access Plan

Created: May 13, 2026.

## Purpose

This document defines how tenant access should work in production and how local development can temporarily bootstrap access while the real tenant configuration flows are being built.

The key decision:

```text
Supabase Auth proves identity.
The HR app backend grants tenant access.
```

A user who can authenticate with Google should not automatically get access to a tenant in production.

## Current Local Development Shortcut

For local development only, we can support:

```env
AUTO_JOIN_DEFAULT_TENANT=true
DEFAULT_TENANT_SLUG=assuresoft-demo
DEFAULT_TENANT_ROLE=hr_admin
```

This is useful while building the first frontend/backend integration because a newly authenticated Supabase user needs a local `TenantMembership` before they can use tenant-aware pages.

This behavior must be disabled outside development.

Recommended guard:

```text
AUTO_JOIN_DEFAULT_TENANT can only run when NODE_ENV=development.
```

## Production Rule

In production, tenant access should be explicit.

After a user signs in:

1. Supabase Auth validates the identity.
2. Backend resolves or creates local `User`.
3. Backend checks active `TenantMembership`.
4. If memberships exist, user enters the app.
5. If no memberships exist, user sees a no-access or onboarding state.

The backend should not silently attach users to a tenant in production.

## Production Access Models

There are three realistic models. We can support more than one over time.

### Model 1: Invitation-Based Access

Best for B2B HR SaaS.

An owner or HR admin invites a user to a tenant. The invited user receives an email, signs in with Google or email/password, then accepts the invitation.

Use this as the primary production model.

Advantages:

- Strong tenant boundary.
- Admin controls who gets access.
- Works for employees, managers, HR staff, finance, recruiters, and owners.
- Avoids random Google accounts joining a tenant.

### Model 2: Domain-Based Self-Join

Optional later.

If tenant config allows it, users with an approved company email domain can request or automatically receive access.

Example:

```text
Allowed domain: assuresoft.com
User email: person@assuresoft.com
```

This should be controlled per tenant.

Possible modes:

```text
disabled
request_access
auto_join_employee
```

This is useful for employee self-service, but it needs careful rules.

### Model 3: Tenant Signup / Create Workspace

Optional later.

A new company owner signs in and creates a tenant/workspace.

This is a product onboarding flow, not an employee login flow.

For now, defer this unless we want open self-service company signup.

## Recommended First Production Flow

Start with invitation-based access plus a no-access screen.

Flow:

```text
User signs in with Google
  -> frontend calls GET /api/v1/me
  -> backend creates/resolves local User
  -> backend returns tenants
```

If tenants exist:

```text
redirect to /dashboard
```

If tenants are empty:

```text
redirect to /no-access
```

The no-access page should explain that the account exists but does not yet have access to an organization.

## Frontend Views Needed

### Login

Route:

```text
/login
```

Responsibilities:

- Start Supabase Google login.
- Later support email/password through Supabase Auth.
- Redirect authenticated users away from login.

Backend calls:

- None directly before Supabase login.

Supabase calls:

- `signInWithOAuth({ provider: "google" })`
- later `signInWithPassword`

### Auth Callback

Route:

```text
/auth/callback
```

Responsibilities:

- Let Supabase restore the browser session.
- Call or trigger `GET /api/v1/me`.
- Route user based on tenant access.

Backend calls:

```text
GET /api/v1/me
```

Expected outcomes:

- User has tenants: redirect to `/dashboard`.
- User has no tenants: redirect to `/no-access`.
- Token invalid: redirect to `/login`.

### No Access

Route:

```text
/no-access
```

Responsibilities:

- Show that authentication succeeded but tenant access is missing.
- Give next steps.
- Allow logout.
- Optionally allow requesting access.

States:

```text
No tenant membership
Pending invitation exists
Access request submitted
Access request rejected
```

Backend calls:

```text
GET /api/v1/me
GET /api/v1/access-requests/current
POST /api/v1/access-requests
```

The access request endpoint can be deferred. The first version can just show no-access and logout.

### Accept Invitation

Route:

```text
/accept-invitation?token=<invitation-token>
```

Responsibilities:

- Validate an invitation token.
- Ask user to sign in if needed.
- Link signed-in user to the invitation.
- Activate membership.
- Redirect to tenant app.

Backend calls:

```text
GET /api/v1/invitations/{token}
POST /api/v1/invitations/{token}/accept
```

Rules:

- If invitation email does not match authenticated user email, reject or require admin override.
- If user is not authenticated, preserve invitation token and redirect to login.
- Once accepted, mark membership active.

### Tenant Selection

Route:

```text
/select-tenant
```

Responsibilities:

- Show available tenants when user belongs to more than one.
- Store selected tenant slug.
- Redirect to dashboard.

Backend calls:

```text
GET /api/v1/me
```

For the first version, auto-select the first tenant if there is only one.

### Settings Users

Route:

```text
/settings/users
```

Responsibilities:

- List tenant users and invitations.
- Invite users.
- Resend invitations.
- Disable memberships.
- Change roles.

Backend calls:

```text
GET /api/v1/users
GET /api/v1/invitations
POST /api/v1/invitations
POST /api/v1/invitations/{invitationId}/resend
PATCH /api/v1/tenant-memberships/{membershipId}
POST /api/v1/tenant-memberships/{membershipId}/disable
```

Permissions:

```text
user.read
user.invite
membership.manage
role.assign
```

### Settings Roles

Route:

```text
/settings/roles
```

Responsibilities:

- Show roles.
- Create custom roles later.
- Assign permissions to roles.

Backend calls:

```text
GET /api/v1/roles
POST /api/v1/roles
GET /api/v1/permissions
PUT /api/v1/roles/{roleId}/permissions
```

Permissions:

```text
role.read
role.manage
permission.read
permission.assign
```

### Tenant Access Settings

Route:

```text
/settings/access
```

Responsibilities:

- Configure allowed email domains.
- Configure self-join behavior.
- Configure default role for domain-based self-join if enabled.
- Configure whether access requests are allowed.

Backend calls:

```text
GET /api/v1/tenants/current/access-settings
PATCH /api/v1/tenants/current/access-settings
```

This can be deferred until after invitation-based access works.

## Backend Endpoints Needed

### Current User

Already exists:

```text
GET /api/v1/me
```

Responsibilities:

- Validate Supabase bearer token.
- Create or resolve local `User`.
- Return active tenant memberships.
- Return role/permission context per tenant.

Recommended response:

```json
{
  "user": {
    "id": "local-user-id",
    "email": "person@example.com",
    "name": "Person Example",
    "externalAuthProvider": "supabase",
    "externalAuthUserId": "supabase-user-id"
  },
  "tenants": [
    {
      "tenantId": "tenant-id",
      "tenantSlug": "assuresoft-demo",
      "tenantName": "Assuresoft Demo",
      "roleKey": "hr_admin",
      "permissions": ["employee.read"]
    }
  ]
}
```

If no tenant access exists:

```json
{
  "user": {},
  "tenants": []
}
```

This should be a `200`, not a `403`, because authentication succeeded.

### Invitations

Create invitation:

```text
POST /api/v1/invitations
```

Request body:

```json
{
  "email": "person@example.com",
  "roleId": "role-id",
  "message": "optional message"
}
```

Behavior:

- Requires tenant context.
- Requires `user.invite`.
- Creates local invitation record.
- Creates or updates invited local user if needed.
- Creates `TenantMembership` with `INVITED` status.
- Sends invite through Supabase Auth or email provider.

List invitations:

```text
GET /api/v1/invitations
```

Validate invitation token:

```text
GET /api/v1/invitations/{token}
```

Accept invitation:

```text
POST /api/v1/invitations/{token}/accept
```

Resend invitation:

```text
POST /api/v1/invitations/{invitationId}/resend
```

Cancel invitation:

```text
POST /api/v1/invitations/{invitationId}/cancel
```

### Tenant Memberships

Update membership:

```text
PATCH /api/v1/tenant-memberships/{membershipId}
```

Request body:

```json
{
  "roleId": "new-role-id",
  "status": "ACTIVE"
}
```

Disable membership:

```text
POST /api/v1/tenant-memberships/{membershipId}/disable
```

Reactivate membership:

```text
POST /api/v1/tenant-memberships/{membershipId}/reactivate
```

### Users

List tenant users:

```text
GET /api/v1/users
```

Return:

```json
{
  "data": [
    {
      "userId": "user-id",
      "email": "person@example.com",
      "name": "Person Example",
      "membershipId": "membership-id",
      "membershipStatus": "ACTIVE",
      "roleKey": "hr_admin",
      "joinedAt": "2026-05-13T00:00:00.000Z"
    }
  ]
}
```

Get user detail:

```text
GET /api/v1/users/{userId}
```

### Roles And Permissions

List roles:

```text
GET /api/v1/roles
```

Create role:

```text
POST /api/v1/roles
```

Update role:

```text
PATCH /api/v1/roles/{roleId}
```

List permissions:

```text
GET /api/v1/permissions
```

Replace role permissions:

```text
PUT /api/v1/roles/{roleId}/permissions
```

### Access Requests

Optional after no-access page.

Current user access request:

```text
GET /api/v1/access-requests/current
```

Create access request:

```text
POST /api/v1/access-requests
```

Request body:

```json
{
  "tenantSlug": "assuresoft-demo",
  "message": "I need access to my company workspace."
}
```

Admin list:

```text
GET /api/v1/access-requests
```

Approve:

```text
POST /api/v1/access-requests/{accessRequestId}/approve
```

Reject:

```text
POST /api/v1/access-requests/{accessRequestId}/reject
```

This should be deferred unless we need open request access soon.

### Tenant Access Settings

Get access settings:

```text
GET /api/v1/tenants/current/access-settings
```

Update access settings:

```text
PATCH /api/v1/tenants/current/access-settings
```

Example:

```json
{
  "allowedEmailDomains": ["assuresoft.com"],
  "selfJoinMode": "request_access",
  "defaultSelfJoinRoleId": null,
  "accessRequestsEnabled": true
}
```

## Data Model Additions To Consider

Current tables already include:

```text
User
Tenant
TenantMembership
Role
Permission
RolePermission
```

Useful additions:

### Invitation

```text
Invitation
  id
  tenantId
  email
  roleId
  status: PENDING | ACCEPTED | CANCELLED | EXPIRED
  tokenHash
  invitedByUserId
  acceptedByUserId
  expiresAt
  acceptedAt
  createdAt
  updatedAt
```

Do not store raw invitation tokens. Store a hash.

### AccessRequest

```text
AccessRequest
  id
  tenantId
  userId
  email
  status: PENDING | APPROVED | REJECTED | CANCELLED
  message
  reviewedByUserId
  reviewedAt
  createdAt
  updatedAt
```

Optional.

### TenantAccessSettings

```text
TenantAccessSettings
  tenantId
  allowedEmailDomains
  selfJoinMode
  defaultSelfJoinRoleId
  accessRequestsEnabled
  createdAt
  updatedAt
```

Optional for later.

## Security Requirements

- Authenticated does not mean authorized.
- `GET /api/v1/me` may create a local user, but it must not grant production tenant access by itself.
- Only users with explicit permissions can invite users or modify memberships.
- Role assignment must be permission-gated.
- Invitation tokens must expire.
- Invitation tokens must be stored hashed.
- Invitation acceptance must validate authenticated email.
- Disabling a membership should immediately remove access on the next API request.
- Backend must enforce permissions even if frontend hides UI correctly.

## Recommended Implementation Order

### Local Development Now

1. Implement frontend call to `GET /api/v1/me` after Supabase login.
2. Add no-access state if `tenants` is empty.
3. Add development-only auto join:

```env
AUTO_JOIN_DEFAULT_TENANT=true
DEFAULT_TENANT_SLUG=assuresoft-demo
DEFAULT_TENANT_ROLE=hr_admin
```

Guard it with:

```text
NODE_ENV=development
```

### Production-Ready Access Foundation

1. Add no-access page.
2. Add tenant selection page or auto-select one tenant.
3. Add invitations table/model.
4. Add invitation endpoints.
5. Add settings users page integration.
6. Add role assignment support.

### Later

1. Add domain-based request access.
2. Add tenant access settings page.
3. Add access request approval workflow.
4. Add tenant self-signup if product strategy requires it.

## Decision

Use local auto-join only as a temporary development helper.

For production, use invitation-based tenant access as the primary model. New authenticated users can be created in the local `User` table, but tenant access must come from an explicit invitation, admin assignment, approved access request, or controlled tenant signup flow.

