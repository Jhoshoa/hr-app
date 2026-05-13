# Tenant Configuration Implementation Roadmap

Created: May 13, 2026.

## Purpose

This document turns the tenant configuration scope into an implementation roadmap.

Target features:

- Company Profile + Localization.
- Holiday Calendars.
- Leave Types.
- Leave Policies.
- Document Categories + Requirements.
- Users + Invitations for production tenant access.

This is more specific than `tenant-configuration-scope-and-priorities.md`. Use this document before implementing each phase.

## Settings Placement

Use `Settings` as the main admin area.

Recommended structure:

```text
/settings
  Organization
    /settings/organization
    /settings/company
    /settings/holidays
  Leave
    /settings/leave/types
    /settings/leave/policies
  Documents
    /settings/documents/categories
    /settings/documents/requirements
  Access
    /settings/users
    /settings/invitations
    /settings/roles
    /settings/access
```

Do not put everything inside `/settings/organization`. Organization should hold tenant/company structure and calendars. Leave, Documents, and Access deserve their own settings groups because they have module-specific rules.

## Shared UX Rules

Apply these consistently:

- Lists show an empty state when there are no records.
- Lists paginate after 10 records.
- Create/edit uses a right-side drawer for simple records.
- Complex policy forms can use a full page or multi-section drawer.
- Archive/delete actions require a confirmation modal.
- Deletes are soft deletes when the model supports operational history.
- Successful create/update/archive/reactivate shows a toast.
- API errors show a toast plus inline validation where relevant.
- Forms validate on frontend and backend.
- Backend remains the source of truth for tenant isolation and permissions.

## Shared Backend Rules

Every tenant-owned endpoint must:

- Require authentication.
- Require tenant context.
- Enforce permission decorators.
- Scope every query by `tenantId`.
- Validate DTOs with `class-validator`.
- Prefer `PATCH` for updates.
- Prefer `POST /:id/archive` and `POST /:id/reactivate` for soft-delete lifecycle.
- Return `404` when the record does not belong to the current tenant.
- Add unit tests for use cases.
- Add repository/integration tests when business rules or Prisma queries become non-trivial.

## Shared Frontend Rules

Every settings feature should include:

- RTK Query endpoints.
- Typed API DTOs.
- Loading state.
- Empty state.
- Error state.
- Create/edit form validation.
- Confirmation modal for archive/reactivate/remove.
- Toast notifications.
- Permission-aware actions.
- Tests for pure helpers or critical UI behavior.

Use React Hook Form + Zod for complex forms. Simple catalog drawers may use local state only if the form has very few fields, but new modules should prefer React Hook Form + Zod to keep validation consistent.

## Phase 1: Company Profile + Localization

### Goal

Let tenant admins manage the company-level defaults already stored on `Tenant`.

### Data Model

Existing `Tenant` fields:

- `name`
- `slug`
- `defaultLanguage`
- `defaultCurrency`
- `timezone`
- `status`

Recommended additions later:

- `legalName`
- `taxIdentifier`
- `country`
- `logoObjectKey`

Do not add optional fields until the UI needs them.

### Backend Endpoints

```text
GET /api/v1/tenants/current
PATCH /api/v1/tenants/current
```

### Permissions

```text
tenant.read
tenant.manage
```

### UI

Route:

```text
/settings/company
```

Form sections:

- Company identity.
- Localization.
- Currency and timezone.

### Validations

Frontend and backend:

- `name`: required, 2-120 chars.
- `slug`: read-only initially.
- `defaultLanguage`: enum, start with `es`, `en`.
- `defaultCurrency`: enum/string, start with `BOB`, `USD`.
- `timezone`: required valid timezone string.

### Tests

- Backend use case updates tenant settings.
- Backend rejects invalid values.
- Frontend validation prevents empty company name.

## Phase 2: Holiday Calendars

### Goal

Support Bolivia/company holidays before implementing leave request calculations.

### Data Model

Add if missing:

```text
HolidayCalendar
  id
  tenantId
  name
  country
  locationId?
  status
  createdAt
  updatedAt

Holiday
  id
  tenantId
  calendarId
  name
  date
  isRecurring
  status
  createdAt
  updatedAt
```

Optional later:

- `isHalfDay`
- `paid`
- `observedDate`

### Backend Endpoints

```text
GET /api/v1/holiday-calendars
POST /api/v1/holiday-calendars
GET /api/v1/holiday-calendars/:calendarId
PATCH /api/v1/holiday-calendars/:calendarId
POST /api/v1/holiday-calendars/:calendarId/archive
POST /api/v1/holiday-calendars/:calendarId/reactivate

GET /api/v1/holiday-calendars/:calendarId/holidays
POST /api/v1/holiday-calendars/:calendarId/holidays
PATCH /api/v1/holidays/:holidayId
POST /api/v1/holidays/:holidayId/archive
POST /api/v1/holidays/:holidayId/reactivate
```

### Permissions

```text
organization.read
organization.manage
```

### UI

Route:

```text
/settings/holidays
```

Recommended layout:

- Left/table: holiday calendars.
- Detail area: holidays in selected calendar.
- Drawer for add/edit calendar.
- Drawer for add/edit holiday.
- Confirmation modal for archive/reactivate.

### Validations

Calendar:

- `name`: required.
- `country`: required, 2 chars.
- `locationId`: optional, must belong to tenant.

Holiday:

- `name`: required.
- `date`: required valid date.
- `isRecurring`: boolean.
- `calendarId`: must belong to tenant.

### Tests

- Calendar CRUD is tenant-scoped.
- Holiday cannot be created under another tenant's calendar.
- Archive calendar does not hard-delete holidays.

## Phase 3: Leave Types

### Goal

Define the absence categories employees can request.

### Data Model

Add:

```text
LeaveType
  id
  tenantId
  name
  code
  isPaid
  requiresApproval
  requiresAttachment
  allowHalfDay
  minimumNoticeDays
  status
  createdAt
  updatedAt
```

### Backend Endpoints

```text
GET /api/v1/leave-types
POST /api/v1/leave-types
GET /api/v1/leave-types/:leaveTypeId
PATCH /api/v1/leave-types/:leaveTypeId
POST /api/v1/leave-types/:leaveTypeId/archive
POST /api/v1/leave-types/:leaveTypeId/reactivate
```

### Permissions

```text
leave.read
leave.manage
```

### UI

Route:

```text
/settings/leave/types
```

Table columns:

- Name.
- Code.
- Paid.
- Approval.
- Attachment.
- Half day.
- Minimum notice.
- Status.
- Actions.

Drawer is acceptable for create/edit.

### Validations

- `name`: required, 2-120 chars.
- `code`: required, uppercase slug, unique per tenant.
- `minimumNoticeDays`: integer >= 0.
- Boolean flags default explicitly.

### Tests

- Unique code per tenant.
- Archive/reactivate lifecycle.
- Frontend helper formats boolean settings correctly.

## Phase 4: Leave Policies

### Goal

Define accrual and balance behavior per leave type.

### Data Model

Add:

```text
LeavePolicy
  id
  tenantId
  leaveTypeId
  name
  accrualMethod
  annualAllowance
  accrualFrequency
  carryoverLimit
  carryoverExpirationMonth?
  carryoverExpirationDay?
  prorateForNewHires
  allowNegativeBalance
  negativeBalanceLimit?
  effectiveFrom
  status
  createdAt
  updatedAt

LeavePolicyAssignmentRule
  id
  tenantId
  leavePolicyId
  employmentTypeId?
  locationId?
  departmentId?
  createdAt
  updatedAt
```

Possible enums:

```text
AccrualMethod = NONE | FIXED_ANNUAL | MONTHLY
AccrualFrequency = NONE | MONTHLY | ANNUAL
```

### Backend Endpoints

```text
GET /api/v1/leave-policies
POST /api/v1/leave-policies
GET /api/v1/leave-policies/:policyId
PATCH /api/v1/leave-policies/:policyId
POST /api/v1/leave-policies/:policyId/archive
POST /api/v1/leave-policies/:policyId/reactivate
PUT /api/v1/leave-policies/:policyId/assignment-rules
```

### Permissions

```text
leave.read
leave.manage
```

### UI

Route:

```text
/settings/leave/policies
```

Recommended UI:

- Policy list table.
- Full detail page or large drawer for policy editing.
- Sections:
  - Basic info.
  - Accrual rules.
  - Carryover rules.
  - Assignment rules.
  - Effective date.

This should not be implemented as a simple two-field catalog.

### Validations

- `leaveTypeId`: required and tenant-scoped.
- `name`: required.
- `annualAllowance`: decimal >= 0 when method requires it.
- `carryoverLimit`: decimal >= 0.
- `negativeBalanceLimit`: required only if negative balance is enabled.
- `effectiveFrom`: valid date.
- Assignment rule references must belong to the tenant.

### Tests

- Policy creation validates accrual method constraints.
- Assignment rules cannot reference another tenant's records.
- Archive policy does not delete historical balances later.

## Phase 5: Document Categories + Requirements

### Goal

Configure document metadata and required document rules before building full document workflows.

### Data Model

Add:

```text
DocumentCategory
  id
  tenantId
  name
  appliesTo
  requiresAcknowledgement
  requiresExpirationDate
  visibility
  status
  createdAt
  updatedAt

DocumentRequirement
  id
  tenantId
  categoryId
  employmentTypeId?
  locationId?
  jobTitleId?
  isRequired
  createdAt
  updatedAt
```

Possible enums:

```text
DocumentAppliesTo = EMPLOYEE | COMPANY_POLICY | CANDIDATE
DocumentVisibility = HR_ONLY | MANAGER_VISIBLE | EMPLOYEE_VISIBLE
```

### Backend Endpoints

```text
GET /api/v1/document-categories
POST /api/v1/document-categories
GET /api/v1/document-categories/:categoryId
PATCH /api/v1/document-categories/:categoryId
POST /api/v1/document-categories/:categoryId/archive
POST /api/v1/document-categories/:categoryId/reactivate

GET /api/v1/document-requirements
POST /api/v1/document-requirements
PATCH /api/v1/document-requirements/:requirementId
POST /api/v1/document-requirements/:requirementId/archive
```

### Permissions

```text
documents.read
documents.manage
```

### UI

Routes:

```text
/settings/documents/categories
/settings/documents/requirements
```

Categories:

- Table + drawer.

Requirements:

- Dedicated table with filters by category/location/employment type/job title.
- Drawer is acceptable, but must include lookup fields.

### Validations

- Category name required.
- `appliesTo` enum required.
- Requirement category must belong to tenant.
- Optional rule dimensions must belong to tenant.

### Tests

- Category archive preserves existing document metadata later.
- Requirement cannot reference another tenant's category or lookup records.

## Phase 6: Users + Invitations

### Goal

Replace local auto-join with production-safe tenant access management.

### Data Model

Current models:

- `User`
- `TenantMembership`
- `Role`
- `Permission`
- `RolePermission`

Add:

```text
Invitation
  id
  tenantId
  email
  roleId
  status
  tokenHash
  invitedByUserId
  acceptedByUserId?
  expiresAt
  acceptedAt?
  createdAt
  updatedAt
```

Possible enum:

```text
InvitationStatus = PENDING | ACCEPTED | CANCELLED | EXPIRED
```

### Backend Endpoints

```text
GET /api/v1/users
GET /api/v1/users/:userId

GET /api/v1/invitations
POST /api/v1/invitations
GET /api/v1/invitations/:token
POST /api/v1/invitations/:token/accept
POST /api/v1/invitations/:invitationId/resend
POST /api/v1/invitations/:invitationId/cancel

PATCH /api/v1/tenant-memberships/:membershipId
POST /api/v1/tenant-memberships/:membershipId/disable
POST /api/v1/tenant-memberships/:membershipId/reactivate
```

### Permissions

```text
users.read
users.invite
memberships.manage
roles.assign
```

### UI

Routes:

```text
/settings/users
/settings/invitations
/accept-invitation?token=...
```

Users page:

- Active users table.
- Role assignment.
- Disable/reactivate membership with confirmation.

Invitations page:

- Pending invitations table.
- Invite drawer.
- Resend/cancel actions with confirmation.

Accept invitation page:

- Validates token.
- Requires Supabase-authenticated user.
- Accepts invitation.
- Redirects to dashboard/select-tenant.

### Validations

- Email required and valid.
- Role must belong to tenant or be system role.
- Invitation token must be hashed in DB.
- Invitation must expire.
- Authenticated email must match invitation email.
- Cannot disable the last owner/admin without an explicit rule.

### Tests

- Invite creates pending membership or invitation state.
- Accept invitation activates membership only for matching email.
- Cancelled/expired invitation cannot be accepted.
- Users cannot manage memberships outside their tenant.

## Implementation Order

### Slice 1

```text
Company Profile + Localization
```

Reason:

- Smallest safe slice.
- Improves Settings foundation.
- Uses mostly existing schema.

### Slice 2

```text
Holiday Calendars
```

Reason:

- Needed before real leave calculations.
- Still contained inside Organization settings.

### Slice 3

```text
Leave Types
```

Reason:

- Required before Leave Policies.
- Simple enough to validate the Leave settings module structure.

### Slice 4

```text
Leave Policies
```

Reason:

- More complex rules and UI.
- Should be implemented after Leave Types are stable.

### Slice 5

```text
Document Categories + Requirements
```

Reason:

- Needed before document upload and missing-document reports.

### Slice 6

```text
Users + Invitations
```

Reason:

- Required for production tenant access.
- Can be moved earlier if local auto-join becomes a blocker.

## Definition Of Done Per Slice

Each slice is complete only when:

- Prisma schema and migration exist if new tables are needed.
- Seed data is updated when useful for local development.
- Backend module follows existing clean architecture patterns.
- DTO validation exists.
- Tenant isolation is enforced.
- Permissions are enforced.
- API use cases have unit tests.
- Frontend route exists under Settings.
- Frontend uses RTK Query.
- Create/edit forms validate input.
- Tables include loading, empty, error, and pagination states.
- Archive/reactivate/remove actions use confirmation modals.
- Successful actions show toast notifications.
- Typecheck passes for backend and frontend.
- Relevant tests pass.

## Notes For Current Codebase

- Organization settings already introduced useful frontend patterns:
  - tabs
  - table with pagination
  - right-side drawer
  - confirmation modal
  - toast provider
  - RTK Query integration
- Reuse those patterns, but avoid forcing complex policy forms into the same simple catalog component.
- Leave and Documents should become their own backend modules instead of being added into the Organization module.
- Holiday Calendars can live in Organization because they are part of tenant/company setup and are referenced by Leave.
- Users and Invitations belong closer to Identity/Tenants, not Organization.






Incluye:

  - Dónde ubicar cada feature dentro de Settings.
  - Qué va en Organization, Leave, Documents y Access.
  - Fases de implementación.
  - Tablas/modelos necesarios.
  - Endpoints esperados.
  - Permisos.
  - Validaciones frontend/backend.
  - Uso de drawer, páginas completas, confirmaciones y toasts.
  - Soft delete/archive/reactivate.
  - Tests necesarios.
  - Definition of Done por slice.

  Recomendación clave: no meter todo dentro de Settings -> Organization. Mejor:

  - Organization: company profile, catalogs, holidays.
  - Leave: leave types, leave policies.
  - Documents: categories, requirements.
  - Access: users, invitations, roles, access settings.

