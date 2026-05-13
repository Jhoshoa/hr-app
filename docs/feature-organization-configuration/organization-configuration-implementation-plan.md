# Organization Configuration Implementation Plan

Created: May 13, 2026.

## Purpose

This document plans the next implementation slice for tenant organization configuration.

The goal is to let tenant admins configure the organizational catalogs that employee records depend on:

- departments,
- locations,
- job titles,
- employment types,
- work modes,
- client projects,
- later holiday calendars and other tenant-level HR settings.

This feature should connect the existing backend organization module to the frontend and complete the missing backend operations needed for real use.

## Recommendation

Yes, this should be the next area after authentication and `/me` integration.

Reason:

- Employee creation/editing depends on these catalogs.
- The backend already has a useful first version for listing and creating these records.
- The frontend needs a real Settings area before employee forms can be complete.
- It is a bounded feature with clear data models and permissions.
- It will exercise the authenticated API, tenant header, permissions, forms, validation, tables, loading states, and mutations.

## Where It Should Live In The UI

Use:

```text
/settings/organization
```

This should be inside the existing authenticated app shell and under the sidebar `Settings` area.

Settings will eventually contain many areas:

```text
/settings
/settings/company
/settings/organization
/settings/users
/settings/roles
/settings/permissions
/settings/audit
/settings/localization
/settings/billing
/settings/access
```

Because organization configuration has many catalogs, do not put everything on the settings landing page. Use a dedicated `Organization` settings page with internal tabs or a secondary navigation.

Recommended first layout:

```text
Settings
  Organization
    Departments
    Locations
    Job titles
    Employment types
    Work modes
    Client projects
```

Use tabs for the first implementation. If the content grows, move to a left-side secondary nav inside the settings page later.

## User Experience Direction

This is an operational admin screen, not a marketing page.

The page should be dense, predictable, and fast:

- Header with title and short description.
- Tabs for each catalog.
- Table/list for current records.
- Create button per tab.
- Inline status badges.
- Edit action per row.
- Archive/deactivate action per row.
- Empty state when no records exist.
- Error/loading states from RTK Query.

Avoid large hero sections or decorative UI. This should feel like a practical admin configuration page.

## Current Backend State

The backend currently has `OrganizationController` with list and create endpoints:

```text
GET  /api/v1/departments
POST /api/v1/departments

GET  /api/v1/locations
POST /api/v1/locations

GET  /api/v1/job-titles
POST /api/v1/job-titles

GET  /api/v1/employment-types
POST /api/v1/employment-types

GET  /api/v1/work-modes
POST /api/v1/work-modes

GET  /api/v1/client-projects
POST /api/v1/client-projects
```

All endpoints are tenant-aware through `x-tenant-slug`.

Permissions:

```text
organization.read
organization.manage
```

Existing backend module layers:

```text
OrganizationController
CreateOrganizationRecordUseCase
ListOrganizationRecordsUseCase
OrganizationRepository
PrismaOrganizationRepository
```

Current missing backend operations:

- read one record,
- update record,
- archive/deactivate record,
- reactivate record,
- validation for duplicates and references,
- better list response shape,
- tests for controller/e2e behavior.

## Current Database Models

Relevant Prisma models already exist:

```text
Department
Location
JobTitle
EmploymentType
WorkMode
ClientProject
```

They are tenant-scoped and mostly have:

```text
id
tenantId
name
status
createdAt
updatedAt
```

Some have extra fields:

```text
Department.parentDepartmentId
Location.country
Location.city
Location.timezone
JobTitle.level
EmploymentType.category
WorkMode.type
ClientProject.code
```

These are enough for the first UI.

## Backend API Contract To Implement

Keep the current flat endpoints for now. They are simple and readable.

### Departments

```text
GET    /api/v1/departments
POST   /api/v1/departments
GET    /api/v1/departments/{departmentId}
PATCH  /api/v1/departments/{departmentId}
POST   /api/v1/departments/{departmentId}/archive
POST   /api/v1/departments/{departmentId}/reactivate
```

Fields:

```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "name": "Engineering",
  "parentDepartmentId": null,
  "status": "ACTIVE",
  "createdAt": "2026-05-13T00:00:00.000Z",
  "updatedAt": "2026-05-13T00:00:00.000Z"
}
```

Create body:

```json
{
  "name": "Engineering",
  "parentDepartmentId": null
}
```

Update body:

```json
{
  "name": "Product Engineering",
  "parentDepartmentId": null
}
```

### Locations

```text
GET    /api/v1/locations
POST   /api/v1/locations
GET    /api/v1/locations/{locationId}
PATCH  /api/v1/locations/{locationId}
POST   /api/v1/locations/{locationId}/archive
POST   /api/v1/locations/{locationId}/reactivate
```

Create/update fields:

```json
{
  "name": "Cochabamba",
  "country": "BO",
  "city": "Cochabamba",
  "timezone": "America/La_Paz"
}
```

### Job Titles

```text
GET    /api/v1/job-titles
POST   /api/v1/job-titles
GET    /api/v1/job-titles/{jobTitleId}
PATCH  /api/v1/job-titles/{jobTitleId}
POST   /api/v1/job-titles/{jobTitleId}/archive
POST   /api/v1/job-titles/{jobTitleId}/reactivate
```

Create/update fields:

```json
{
  "name": "Senior Software Engineer",
  "level": "Senior"
}
```

### Employment Types

```text
GET    /api/v1/employment-types
POST   /api/v1/employment-types
GET    /api/v1/employment-types/{employmentTypeId}
PATCH  /api/v1/employment-types/{employmentTypeId}
POST   /api/v1/employment-types/{employmentTypeId}/archive
POST   /api/v1/employment-types/{employmentTypeId}/reactivate
```

Create/update fields:

```json
{
  "name": "Full time",
  "category": "employee"
}
```

### Work Modes

```text
GET    /api/v1/work-modes
POST   /api/v1/work-modes
GET    /api/v1/work-modes/{workModeId}
PATCH  /api/v1/work-modes/{workModeId}
POST   /api/v1/work-modes/{workModeId}/archive
POST   /api/v1/work-modes/{workModeId}/reactivate
```

Create/update fields:

```json
{
  "name": "Remote",
  "type": "remote"
}
```

### Client Projects

```text
GET    /api/v1/client-projects
POST   /api/v1/client-projects
GET    /api/v1/client-projects/{clientProjectId}
PATCH  /api/v1/client-projects/{clientProjectId}
POST   /api/v1/client-projects/{clientProjectId}/archive
POST   /api/v1/client-projects/{clientProjectId}/reactivate
```

Create/update fields:

```json
{
  "name": "Client Alpha",
  "code": "ALPHA"
}
```

## Archive vs Delete

Do not hard-delete organization records in the first implementation.

Use archive/deactivate:

```text
status = ARCHIVED
```

Reason:

- Employee job assignments may reference these records.
- Historical reporting should remain coherent.
- Deleting can break audit and history.

The UI can call it "Archive" instead of "Delete".

## Backend Implementation Plan

### Domain

Extend organization entity types:

```text
UpdateOrganizationRecordInput
ArchiveOrganizationRecordInput
ReactivateOrganizationRecordInput
```

Repository interface should support:

```text
create
list
findById
update
archive
reactivate
```

### Use Cases

Add:

```text
GetOrganizationRecordUseCase
UpdateOrganizationRecordUseCase
ArchiveOrganizationRecordUseCase
ReactivateOrganizationRecordUseCase
```

Keep use cases thin for now, but enforce tenant ownership and kind consistency in repository or use case.

### Repository

`PrismaOrganizationRepository` should:

- choose the correct Prisma model by kind,
- verify `tenantId`,
- update only fields valid for that kind,
- return a consistent entity shape,
- throw a not-found error if record does not exist for that tenant/kind.

### DTOs

Add update DTOs. They can mirror create DTOs but fields should be optional:

```text
UpdateDepartmentDto
UpdateLocationDto
UpdateJobTitleDto
UpdateEmploymentTypeDto
UpdateWorkModeDto
UpdateClientProjectDto
```

Validate:

- `name` minimum length,
- optional extra fields,
- reasonable enum-like values for status-affecting actions through dedicated endpoints.

### Controller

Add routes for get/update/archive/reactivate.

Use:

```text
@Permissions("organization.read") for GET
@Permissions("organization.manage") for POST/PATCH/archive/reactivate
```

### Error Handling

Use the existing global exception filter. If needed, add domain-specific errors later:

```text
ORGANIZATION_RECORD_NOT_FOUND
ORGANIZATION_RECORD_DUPLICATE
ORGANIZATION_RECORD_IN_USE
```

First implementation can rely on Nest/Prisma errors, but better user-facing errors should follow.

### Tests

Add or expand:

```text
CreateOrganizationRecordUseCase
ListOrganizationRecordsUseCase
UpdateOrganizationRecordUseCase
ArchiveOrganizationRecordUseCase
ReactivateOrganizationRecordUseCase
```

Add e2e tests if feasible:

- create department,
- list departments,
- update department,
- archive department,
- reject access without permission,
- tenant isolation.

At minimum, unit tests should cover use cases and repository shape.

## Frontend Implementation Plan

### Route

Create:

```text
apps/web/app/(app)/settings/organization/page.tsx
```

Later:

```text
apps/web/app/(app)/settings/page.tsx
apps/web/app/(app)/settings/users/page.tsx
apps/web/app/(app)/settings/roles/page.tsx
```

But for this slice, `settings/organization` is enough.

### Navigation

Current sidebar has `Settings`.

Clicking Settings should eventually go to:

```text
/settings
```

For this slice, it can go directly to:

```text
/settings/organization
```

or a simple `/settings` landing page can link to Organization.

Recommended:

1. Add `/settings` landing page with options.
2. Add `/settings/organization` page.

### Page Structure

Recommended layout:

```text
PageHeader
  title: Organization
  description: Configure departments, locations, job structure, work modes, and client projects.

Tabs
  Departments
  Locations
  Job titles
  Employment types
  Work modes
  Client projects

Active tab panel
  toolbar:
    search
    status filter
    create button
  table:
    name
    extra fields
    status
    updated at
    actions
```

### Components Needed

Shared components:

```text
SettingsSectionHeader
OrganizationCatalogTabs
OrganizationRecordTable
OrganizationRecordFormDialog
ArchiveRecordDialog
```

Feature components:

```text
DepartmentFields
LocationFields
JobTitleFields
EmploymentTypeFields
WorkModeFields
ClientProjectFields
```

For the first implementation, this can be one generic form component driven by catalog config.

### RTK Query API

Add:

```text
apps/web/src/features/organization/organization-api.ts
```

Endpoints:

```text
listOrganizationRecords(kind)
createOrganizationRecord(kind, body)
updateOrganizationRecord(kind, id, body)
archiveOrganizationRecord(kind, id)
reactivateOrganizationRecord(kind, id)
```

Map kinds to paths:

```ts
department -> departments
location -> locations
jobTitle -> job-titles
employmentType -> employment-types
workMode -> work-modes
clientProject -> client-projects
```

Cache tags:

```text
OrganizationRecord
Department
Location
JobTitle
EmploymentType
WorkMode
ClientProject
```

### Types

Add frontend types:

```text
OrganizationRecordKind
OrganizationRecord
CreateOrganizationRecordInput
UpdateOrganizationRecordInput
```

Keep them frontend/API-facing. Do not import Prisma types into frontend.

### Validation

Use React Hook Form and Zod if forms become non-trivial.

For the first slice, simple controlled form state is acceptable if we keep it isolated. However, because this feature has multiple forms and validation, React Hook Form + Zod is the better fit.

Suggested schemas:

```text
departmentSchema
locationSchema
jobTitleSchema
employmentTypeSchema
workModeSchema
clientProjectSchema
```

### Permissions

Frontend should:

- show page if user has `organization.read`,
- show create/edit/archive actions only with `organization.manage`.

Backend remains the source of truth and must enforce permissions.

### Empty/Loading/Error States

Every tab should handle:

```text
loading
error
empty
success
mutation pending
```

Empty examples:

```text
No departments configured.
Create departments before adding employee job assignments.
```

## Data Dependencies For Employee Features

Employee create/edit will need these catalogs:

- department,
- location,
- job title,
- employment type,
- work mode,
- manager employee,
- client project.

Therefore organization configuration should be implemented before deep employee form work.

## Suggested First Implementation Slice

Do not build every advanced setting at once.

First slice:

Backend:

1. Add update/archive/reactivate for all existing organization record kinds.
2. Add unit tests for update/archive/reactivate use cases.
3. Add one e2e happy path if practical.

Frontend:

1. Add `/settings` landing page.
2. Add `/settings/organization`.
3. Add tabs for six catalogs.
4. Implement list/create/update/archive/reactivate for departments first.
5. Generalize to the other five catalogs after department works.
6. Use shared config to avoid six copy-pasted pages.

Definition of done:

- Organization page loads with real backend data.
- User can create, edit, archive, and reactivate records.
- UI respects `organization.read` and `organization.manage`.
- Employee-related forms can later consume these catalogs.
- Typecheck/build pass for API and web.

## Implementation Order

Recommended order:

1. Backend repository contract update.
2. Backend use cases.
3. Backend controller routes.
4. Backend tests.
5. Frontend API slice.
6. Settings routes.
7. Organization tabs and table.
8. Create/edit dialog.
9. Archive/reactivate actions.
10. Verification and dev server restart.

## Open Questions

### Should settings have a landing page first?

Recommendation: yes.

Create a simple settings landing page so future settings modules have a home. The Organization page should not become the only Settings entry forever.

### Should each catalog have its own route?

Not initially.

Use query/state tabs:

```text
/settings/organization?tab=departments
```

or client-side tabs without URL state for the first slice.

Later, if deep links matter:

```text
/settings/organization/departments
/settings/organization/locations
```

### Should archive be blocked when records are in use?

Not for the first implementation.

Archiving should hide records from future selection but preserve historical assignments. Later we can add warnings like:

```text
This department is used by 14 employees.
```

### Should inactive/archived records show in employee forms?

For create forms:

```text
show ACTIVE only
```

For edit/history:

```text
show referenced archived records as read-only historical values
```

## Risks

### Too Much UI Duplication

Six catalogs can easily create repeated code.

Mitigation:

- Use catalog configuration objects.
- Use one generic table and one generic dialog where practical.
- Keep kind-specific field renderers small.

### Backend Kind Mapping Complexity

The repository currently uses switch statements. Adding update/archive/reactivate can increase duplication.

Mitigation:

- Keep switch statements explicit at first.
- Avoid over-abstracting Prisma model access too early.
- Refactor only after patterns are clear.

### Permission Drift

Frontend and backend permission names must match.

Current backend permissions:

```text
organization.read
organization.manage
```

Use those exact strings in frontend.

## Decision

Proceed with organization configuration as the next implementation slice.

Place it under Settings, starting with:

```text
/settings
/settings/organization
```

Complete backend update/archive/reactivate before frontend write flows, then integrate real backend data into the frontend organization settings UI. This creates the foundation needed for employee create/edit workflows.

