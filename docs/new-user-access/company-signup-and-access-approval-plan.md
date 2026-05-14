# Company Signup And Access Approval Plan

Created: May 13, 2026.

## Purpose

This document defines a production-oriented flow for:

1. public company registration,
2. internal HR app approval,
3. tenant creation,
4. first admin access assignment,
5. later user invitation.

This extends the tenant access plan from:

```text
docs/feature-tenant-config/tenant-onboarding-and-access-plan.md
```

The key rule still applies:

```text
Supabase Auth proves identity.
The HR app backend grants tenant access.
```

But this flow adds a new concept:

```text
A public signup request does not create tenant access immediately.
An internal platform admin must approve it.
```

## Recommended Product Flow

Use two separate flows:

1. Company signup request.
2. Tenant user access.

They are related, but they should not be the same thing.

### Flow 1: Public Company Signup Request

Public route:

```text
/company-signup
```

The company submits:

```text
company name
desired tenant slug
admin first name
admin last name
admin email
company website
company size
country
timezone
preferred language
phone number
optional message
```

### Field Uniqueness And Availability Checks

Only fields that identify a unique system resource should be treated as unique.

Require uniqueness for:

```text
desired tenant slug
admin email in the User table, if the product uses one global user account per email
```

Do not require uniqueness for:

```text
company name
admin first name
admin last name
company size
country
timezone
preferred language
phone number
optional message
```

`desired tenant slug` must be globally unique because it identifies the tenant URL and
tenant context. Validate it before insert and also enforce it with a unique database
constraint on `Tenant.slug`.

`admin email` should be unique in the `User` table if the product model treats one email
as one global user account. That does not necessarily mean one email can only own one
tenant. If the same person can administer multiple companies, keep `User.email` unique
and allow multiple `TenantMembership` rows for that user.

Do not automatically reject a company signup only because `admin email` already exists
as a user if the product allows the same person to administer multiple tenants. In that
case, treat repeated admin emails as review signals or prevent only simultaneous pending
requests when needed.

`company website` should not be a hard unique constraint by default. It can be used for
duplicate detection or platform admin review, but should not block submission unless the
business explicitly requires one tenant per website/domain.

`company name` should not be unique. Use it only for possible duplicate warnings because
different companies can share the same or similar legal/trade names.

For the public signup form, use debounced availability checks for fields where early
feedback improves user experience:

```text
desired tenant slug
admin email
company website, optional duplicate warning only
```

Recommended debounce time:

```text
400ms to 700ms
```

Run local validation first, then call availability endpoints only if the local format is
valid. For example, check slug length and URL-safe characters before checking whether the
slug is available.

Debounced frontend validation is only a UX improvement. The backend must still validate
on submit, and the database must still enforce final uniqueness to handle race conditions.

Example tenant URL:

```text
https://<tenant-slug>.hrapp.com
```

For local development, this can map to:

```text
http://<tenant-slug>.localhost:3000
```

or the existing header-based tenant context:

```text
x-tenant-slug: <tenant-slug>
```

### Flow 2: Internal Approval

Internal HR app platform route:

```text
/platform/company-signups
```

Only platform-level admins can access this page.

The platform admin can:

```text
view pending signup requests
approve request
reject request
reserve/change tenant slug
choose initial subscription/status later
create tenant
grant first tenant owner access
```

### Flow 3: First Tenant Owner Access

When a signup request is approved:

1. Create `Tenant`.
2. Create default tenant roles and permissions for that tenant.
3. Resolve or create the local `User` for the submitted admin email.
4. Create `TenantMembership` with:

```text
status: ACTIVE
role: owner
tenant: newly created tenant
```

5. Mark the signup request as approved.
6. Record who approved it.
7. Optionally send an email when email delivery is ready.

If the admin user has not signed in with Supabase yet, the local `User` can be created
in an invited or pending state, but there is one important limitation:

```text
The current User model requires externalAuthUserId.
```

That means today it is easiest to grant access only after the admin has signed in once,
or to change the data model so pending local users can exist before Supabase identity
exists.

## Important Data Model Implication

The current `User` table requires:

```text
externalAuthUserId String @unique
```

This works when users are created from Supabase login, but it is not ideal for invitation
or pre-approved access before login.

For production access workflows, update the user model to allow pending users:

```prisma
model User {
  id                   String      @id @default(uuid()) @db.Uuid
  email                String      @unique
  name                 String?
  status               UserStatus  @default(INVITED)
  externalAuthProvider String?
  externalAuthUserId   String?     @unique
  createdAt            DateTime    @default(now())
  updatedAt            DateTime    @updatedAt
}
```

Then the backend can:

1. create a pending user by email during approval,
2. create the tenant membership,
3. later link the user to Supabase after Google sign-in.

The first tenant owner can sign in with Google. Do not require email/password only for
this flow. The important condition is that Supabase returns a verified email matching
the approved `adminEmail`.

When the user signs in, resolve user in this order:

1. Find by `externalAuthProvider + externalAuthUserId`.
2. If not found, find by email.
3. If email match exists and external auth is empty, attach Supabase identity.
4. If neither exists, create a new active user with no tenant access.

This is safer and more complete than requiring a user to sign in before approval.

## New Tables Recommended

Yes, a new table is recommended. Do not use only SQL queries or overloaded
`TenantMembership` rows for company signup requests.

### CompanySignupRequest

This table tracks public company registration requests before they become tenants.

```prisma
enum CompanySignupStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

model CompanySignupRequest {
  id                 String              @id @default(uuid()) @db.Uuid
  companyName        String
  desiredTenantSlug  String
  adminFirstName     String
  adminLastName      String
  adminEmail         String
  companyWebsite     String?
  companySize        String?
  country            String?
  timezone           String?
  preferredLanguage  String              @default("es")
  phone              String?
  message            String?
  status             CompanySignupStatus @default(PENDING)
  approvedTenantId   String?             @db.Uuid
  reviewedByUserId   String?             @db.Uuid
  reviewedAt         DateTime?
  rejectionReason    String?
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt

  @@index([status, createdAt])
  @@index([adminEmail])
  @@index([desiredTenantSlug])
}
```

### PlatformUserRole

Tenant roles like `owner`, `hr_admin`, `manager`, and `employee` are scoped to one
tenant. They should not be used to control platform-wide actions such as approving new
companies.

Add platform-level roles separately:

```prisma
enum PlatformRoleKey {
  PLATFORM_OWNER
  PLATFORM_ADMIN
  PLATFORM_SUPPORT
}

model PlatformUserRole {
  id        String          @id @default(uuid()) @db.Uuid
  userId    String          @db.Uuid
  roleKey   PlatformRoleKey
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt

  @@unique([userId, roleKey])
  @@index([roleKey])
}
```

This gives one user access to the HR app platform/admin console without making them a
member of every tenant.

### Platform Admin Access Model

Platform admin access is not tenant access.

Do not model the HR app platform itself as a normal tenant just to give someone access
to company signup approval. A platform admin should not need a `TenantMembership` to
approve companies, reject companies, view platform-level signup requests, or assign other
platform roles.

Recommended model:

```text
User
PlatformUserRole
```

Tenant-scoped model:

```text
User
TenantMembership
TenantRole
TenantPermission
```

This means one person can have both kinds of access:

```text
User A has PLATFORM_OWNER globally.
User A is also owner of assuresoft-demo for local testing or internal company use.
```

But those are two separate grants. Removing `PLATFORM_OWNER` should remove access to the
platform dashboard without removing that user's tenant memberships. Removing a tenant
membership should not remove platform approval access.

The platform dashboard should be a separate internal surface, for example:

```text
/platform/company-signups
/platform/tenants
/platform/users
```

Those routes should check `PlatformUserRole`, not `TenantMembership`, and should not
require `x-tenant-slug`.

Avoid creating a fake tenant like:

```text
tenant: platform
tenant role: owner
```

That approach mixes global platform authorization with tenant authorization and makes it
too easy for tenant-level roles to accidentally receive platform-level powers.

## Why A New Table Is Better

A `CompanySignupRequest` table is better because:

- it preserves requests that are rejected,
- it allows review/audit before tenant creation,
- it prevents random public signups from creating tenants immediately,
- it supports duplicate checks,
- it supports anti-spam/rate limiting,
- it lets admins change the slug before approval,
- it can later connect to billing, subscriptions, and CRM,
- it separates public lead/request data from tenant access data.

It would be worse to create tenants immediately from public form submission because:

- anyone could reserve slugs,
- spam could fill the production database with tenants,
- tenant URLs could be abused,
- support and billing would have no approval checkpoint,
- rollback becomes harder if the request is invalid.

It would also be worse to assign tenant membership directly from the public form because:

- authentication and authorization would be mixed,
- tenant boundaries would be weaker,
- the first admin email may be mistyped,
- there is no internal approval record,
- there is no clear place to store rejection or review metadata.

## NestJS Backend Flow

### Public Endpoint

```text
POST /api/v1/company-signup-requests
```

Public endpoint. No Supabase auth required.

Responsibilities:

1. Validate request body.
2. Normalize email and desired slug.
3. Check slug format and reserved words.
4. Check if tenant slug already exists.
5. Check if an active pending request already exists for the desired slug.
6. Check if a user with the admin email already exists only when existing users are not
   allowed to request or own additional tenants.
7. Check if an active pending request already exists for the admin email when the product
   should prevent the same email from opening multiple simultaneous company requests.
8. Optionally flag duplicate company website/domain for platform review.
9. Create `CompanySignupRequest` with `PENDING` status.
10. Optionally enqueue notification to platform admins.

Recommended validations:

```text
companyName required
desiredTenantSlug required, lowercase, URL-safe
adminEmail required, valid email
preferredLanguage in supported languages
timezone in supported timezones
companySize from allowed options
```

Recommended availability endpoints:

```text
GET /api/v1/company-signup-requests/availability/tenant-slug?value=<slug>
GET /api/v1/company-signup-requests/availability/admin-email?value=<email>
GET /api/v1/company-signup-requests/availability/company-website?value=<url>
```

The website endpoint should return a warning-level duplicate signal by default, not a
hard rejection.

Reserved slugs:

```text
www
api
admin
app
login
signup
support
help
docs
platform
```

### Platform Admin Endpoints

```text
GET /api/v1/platform/company-signup-requests
GET /api/v1/platform/company-signup-requests/:id
POST /api/v1/platform/company-signup-requests/:id/approve
POST /api/v1/platform/company-signup-requests/:id/reject
```

These endpoints require a platform role:

```text
PLATFORM_OWNER
PLATFORM_ADMIN
```

They should not require `x-tenant-slug`, because they operate above tenant scope.

### Approval Use Case

Create an application use case:

```text
ApproveCompanySignupRequestUseCase
```

Inputs:

```text
signupRequestId
reviewedByUserId
finalTenantSlug
initialAdminRoleKey
```

Default initial role:

```text
owner
```

Implementation should run inside one database transaction:

1. Lock or fetch the signup request.
2. Confirm status is `PENDING`.
3. Confirm final tenant slug is available.
4. Create the tenant.
5. Create default roles for that tenant.
6. Attach default permissions to roles.
7. Upsert or create the admin user by email.
8. Create or update `TenantMembership` as `ACTIVE`.
9. Update signup request to `APPROVED`.
10. Write an audit event.
11. Publish an application event.

Pseudo-code:

```ts
await prisma.$transaction(async (tx) => {
  const request = await tx.companySignupRequest.findUniqueOrThrow({
    where: { id: signupRequestId }
  });

  if (request.status !== "PENDING") {
    throw new ConflictException("Signup request has already been reviewed.");
  }

  const tenant = await tx.tenant.create({
    data: {
      name: request.companyName,
      slug: finalTenantSlug,
      defaultLanguage: request.preferredLanguage,
      timezone: request.timezone ?? "America/La_Paz"
    }
  });

  const ownerRole = await createTenantDefaultRolesAndPermissions(tx, tenant.id);

  const user = await tx.user.upsert({
    where: { email: request.adminEmail.toLowerCase() },
    update: {
      name: `${request.adminFirstName} ${request.adminLastName}`.trim(),
      status: "ACTIVE"
    },
    create: {
      email: request.adminEmail.toLowerCase(),
      name: `${request.adminFirstName} ${request.adminLastName}`.trim(),
      status: "INVITED"
    }
  });

  await tx.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: user.id
      }
    },
    update: {
      roleId: ownerRole.id,
      status: "ACTIVE",
      joinedAt: new Date()
    },
    create: {
      tenantId: tenant.id,
      userId: user.id,
      roleId: ownerRole.id,
      status: "ACTIVE",
      joinedAt: new Date()
    }
  });

  await tx.companySignupRequest.update({
    where: { id: request.id },
    data: {
      status: "APPROVED",
      approvedTenantId: tenant.id,
      reviewedByUserId,
      reviewedAt: new Date()
    }
  });
});
```

This pseudo-code assumes the `User.externalAuthUserId` field has been made nullable. If
that field remains required, the approval flow cannot create a pending user before the
admin signs in.

## Background Services

For the first implementation, approval can be synchronous. A background worker is useful
but not required to create the tenant and membership.

Use background jobs for side effects:

```text
send email to platform admins when a signup request is submitted
send approval email to company admin
send rejection email
retry failed emails
sync signup request to CRM or billing later
provision tenant defaults that are slow or optional
```

Recommended event names:

```text
CompanySignupRequestSubmitted
CompanySignupRequestApproved
CompanySignupRequestRejected
TenantProvisioned
TenantOwnerGranted
```

Initial implementation can use the existing in-memory event bus for local development,
but production should use a real queue:

```text
BullMQ + Redis
```

or another durable worker system.

Do not put critical authorization state only in a background job. Tenant creation,
default roles, and first owner membership should be committed transactionally during
approval so the system does not end up with a tenant but no owner.

## First Platform Admin User

The first user who can approve company signup requests should not be a tenant `hr_admin`.
This user also does not need to belong to any tenant in order to access the platform
approval dashboard.

Use a platform-level role:

```text
PLATFORM_OWNER
```

This user can:

```text
approve company signup requests
reject company signup requests
view all tenant metadata
assign platform admin/support users
perform emergency tenant access operations
```

Tenant roles should remain tenant-scoped:

```text
owner
hr_admin
manager
employee
finance_viewer
recruiter
```

This separation matters because a tenant `owner` should not be able to approve new
companies for the whole HR app platform.

The same login mechanism can be used for platform admins and tenant users. For example,
the first platform owner can sign in with Google through Supabase. After Supabase proves
identity, the backend checks `PlatformUserRole` for platform routes and
`TenantMembership` for tenant routes.

Platform route authorization:

```text
Supabase user identity -> local User -> PlatformUserRole
```

Tenant route authorization:

```text
Supabase user identity -> local User -> TenantMembership for selected tenant
```

## How To Seed The First Platform Owner

### Development

In development, seed a known platform owner from an environment variable:

```env
PLATFORM_OWNER_EMAIL=ichuta.josoe@gmail.com
```

The seed can:

1. create or upsert a local `User` if the model supports pending users,
2. assign `PLATFORM_OWNER`,
3. optionally assign that user as `owner` of `assuresoft-demo` for local tenant testing.

This makes local development closer to production because access is still explicit and
stored in the database.

The optional `assuresoft-demo` membership is not what grants platform access. It only
lets the same developer account test normal tenant screens without switching users.

Avoid relying only on `AUTO_JOIN_DEFAULT_TENANT` long term. It is useful for early local
work, but it does not exercise the real access model.

### Production

In production, do not hard-code a platform owner in source code.

Use one of these options:

1. One-time deployment script with an explicit email.
2. Secure admin CLI command.
3. Environment variable consumed by a one-time bootstrap job.
4. Direct SQL run by an operator during initial setup.

Recommended first production approach:

```text
one-time CLI command or script
```

Example command:

```text
pnpm platform:grant-owner --email ichuta.josoe@gmail.com
```

The command should:

1. verify the user exists or create a pending user,
2. grant `PLATFORM_OWNER`,
3. print a verification result,
4. be idempotent.

Do not keep granting platform owner automatically on every production boot. That creates
a permanent privilege escalation path if the environment is misconfigured.

## Development Strategy That Resembles Production

Recommended local setup:

1. Keep `AUTO_JOIN_DEFAULT_TENANT=false` by default.
2. Seed `assuresoft-demo`.
3. Seed default tenant roles.
4. Seed or bootstrap a `PLATFORM_OWNER`.
5. Use the public company signup page to create pending requests.
6. Use the platform admin page to approve requests.
7. Let approval create tenant, roles, and first owner membership.

Temporary local shortcut:

```env
AUTO_JOIN_DEFAULT_TENANT=true
DEFAULT_TENANT_SLUG=assuresoft-demo
DEFAULT_TENANT_ROLE=owner
```

This shortcut should stay development-only and should not be the main path once the
company signup approval flow exists.

## What To Implement Now

The best next slice is not full email invitations. It is company signup approval plus
manual first-owner provisioning.

### Backend

1. Add nullable external auth fields to `User`.
2. Add `CompanySignupRequest`.
3. Add `PlatformUserRole`.
4. Add platform auth guard/decorator.
5. Add public create signup request endpoint.
6. Add platform admin list/detail/approve/reject endpoints.
7. Add approval transaction that creates:
   - tenant,
   - default roles,
   - role permissions,
   - first admin user,
   - active owner membership.
8. Add audit events.
9. Add tests for duplicate slug, duplicate pending request, approve, reject, and permission denial.

### Frontend

1. Add public `/company-signup`.
2. Add internal `/platform/company-signups`.
3. Add debounced availability checks for desired tenant slug and admin email.
4. Add optional duplicate warning for company website/domain.
5. Add approval/rejection UI.
6. Add basic states:
   - pending,
   - approved,
   - rejected,
   - duplicate slug,
   - duplicate admin email, if admin email is configured as unique for signup,
   - possible duplicate company website,
   - unauthorized.

### Email Later

Email can be added after the data flow is correct.

Until email exists, the admin can tell the company admin:

```text
Your company workspace has been approved. Sign in with this email:
admin@example.com
```

After sign-in, `/me` should return the active tenant membership.

## Alternative Idea

A better long-term architecture is to support three access entry points:

1. Platform-approved company signup.
2. Tenant admin invitations.
3. Tenant domain-based access request.

Recommended order:

1. Platform-approved company signup, because it creates the first tenant and owner.
2. Tenant admin manual user management, because it is useful even before email exists.
3. Invitation email flow, because it improves UX after the core authorization model is proven.
4. Domain-based access request, because it adds risk and should be tenant-configurable.

This order avoids blocking tenant creation on email delivery while still keeping tenant
access explicit and auditable.

## Open Decisions

Before implementation, decide:

1. Should tenant access use subdomains immediately or keep `x-tenant-slug` until later?
2. Should tenant slug changes be allowed after approval?
3. Should company signup requests expire if not reviewed?
4. Should duplicate admin emails be allowed to request multiple companies?
5. Should `PLATFORM_SUPPORT` be allowed to view tenants but not approve companies?
6. Should first tenant admin membership be `ACTIVE` immediately or `INVITED` until first login?

Recommended defaults:

```text
Use x-tenant-slug first; add subdomains later.
Do not allow tenant slug changes after approval in v1.
Do not expire signup requests in v1.
Allow duplicate admin emails for multiple companies only after platform review.
Let PLATFORM_SUPPORT view but not approve.
Make first owner membership ACTIVE on approval.
```
