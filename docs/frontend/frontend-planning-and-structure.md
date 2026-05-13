# Frontend Planning And Structure

> Frontend planning document for the HR SaaS web application.
>
> Based on:
>
> - `docs/stack/recommended-technology-stack.md`
> - `docs/first-approach/hr-saas-first-approach.md`
>
> Created: May 13, 2026.

---

## Purpose

This document defines the first frontend plan for the HR SaaS web application. It covers folder structure, frontend stack, state management, API access, reusable components, page inventory, view responsibilities, expected data, user operations, and backend endpoints each area will consume.

This document intentionally does not define visual design. It should be used before creating UI mockups and before implementing the first `apps/web` scaffold.

---

## Frontend Goal

Build a responsive web application for HR admins, managers, employees, recruiters, finance viewers, and company owners. The first product should support the core HR workflows described in the product approach:

- Authentication and tenant selection.
- HR dashboard.
- Organization setup.
- Employee records.
- Employee directory and org chart.
- Documents and acknowledgements.
- Time off and leave.
- Approvals.
- Onboarding.
- Lightweight recruiting.
- Reports and exports.
- Notifications.
- Settings, roles, permissions, and audit visibility.

The frontend should be built as a professional SaaS operations app, not a marketing website. The main application should prioritize dense, scannable information, clear workflows, role-aware navigation, and efficient repeated use.

---

## Stack Decisions

Recommended frontend stack:

| Area | Decision |
|------|----------|
| Framework | Next.js with App Router |
| Language | TypeScript |
| UI runtime | React |
| Styling | Tailwind CSS |
| Component base | shadcn/ui and Radix UI |
| Icons | lucide-react |
| State management | Redux Toolkit |
| API data fetching | RTK Query |
| Forms | React Hook Form |
| Validation | Zod |
| Tables | TanStack Table |
| Charts | Recharts |
| Calendar UI | FullCalendar or React Big Calendar |
| Internationalization | next-intl |
| File uploads | Custom upload components first; Uppy later if needed |
| Unit/component tests | Vitest and React Testing Library |
| E2E tests | Playwright |
| Error monitoring | Sentry later |

### Redux Decision

Use Redux Toolkit for application state and RTK Query for backend communication.

RTK Query should own:

- API request lifecycle.
- Server cache.
- Loading and error states for API calls.
- Cache invalidation after mutations.
- Polling where useful for notifications or long-running exports.

Redux slices should own:

- UI state that must survive across pages.
- Current tenant selection.
- Sidebar collapsed state.
- Local filters that are shared across views when appropriate.
- User preferences such as language and theme, if not fully server-owned.

Redux should not duplicate server data already owned by RTK Query unless there is a clear reason.

---

## App Structure

Recommended `apps/web` structure:

```text
apps/
  web/
    app/
      layout.tsx
      page.tsx
      providers.tsx
      globals.css
      (auth)/
        login/
          page.tsx
        forgot-password/
          page.tsx
        reset-password/
          page.tsx
        accept-invitation/
          page.tsx
      (app)/
        layout.tsx
        dashboard/
          page.tsx
        employees/
          page.tsx
          new/
            page.tsx
          [employeeId]/
            page.tsx
            documents/
              page.tsx
            job/
              page.tsx
            compensation/
              page.tsx
            leave/
              page.tsx
            history/
              page.tsx
        directory/
          page.tsx
        org-chart/
          page.tsx
        documents/
          page.tsx
          policies/
            page.tsx
          missing/
            page.tsx
        leave/
          page.tsx
          requests/
            page.tsx
          balances/
            page.tsx
          calendar/
            page.tsx
          policies/
            page.tsx
        approvals/
          page.tsx
        onboarding/
          page.tsx
          templates/
            page.tsx
          packets/
            page.tsx
          packets/
            [packetId]/
              page.tsx
        recruiting/
          page.tsx
          jobs/
            page.tsx
            new/
              page.tsx
            [jobOpeningId]/
              page.tsx
          candidates/
            page.tsx
            [candidateId]/
              page.tsx
        reports/
          page.tsx
          [reportType]/
            page.tsx
        notifications/
          page.tsx
        settings/
          page.tsx
          company/
            page.tsx
          organization/
            page.tsx
          users/
            page.tsx
          roles/
            page.tsx
          permissions/
            page.tsx
          audit/
            page.tsx
          billing/
            page.tsx
          localization/
            page.tsx
      (public)/
        careers/
          [tenantSlug]/
            page.tsx
        jobs/
          [jobSlug]/
            page.tsx
            apply/
              page.tsx
    src/
      components/
        app-shell/
        auth/
        charts/
        data-display/
        documents/
        employees/
        forms/
        leave/
        navigation/
        onboarding/
        recruiting/
        reports/
        settings/
        ui/
      config/
        env.ts
        navigation.ts
        permissions.ts
      features/
        auth/
        tenants/
        dashboard/
        organization/
        employees/
        directory/
        documents/
        leave/
        approvals/
        onboarding/
        recruiting/
        reports/
        notifications/
        audit/
        settings/
      hooks/
      i18n/
        messages/
          en.json
          es.json
        routing.ts
      lib/
        api/
          base-api.ts
          api-error.ts
        auth/
          supabase-client.ts
          session.ts
        format/
          currency.ts
          date.ts
          names.ts
        utils.ts
      store/
        index.ts
        hooks.ts
        root-reducer.ts
        middleware.ts
      styles/
      test/
        fixtures/
        handlers/
        render.tsx
      types/
```

### Folder Responsibilities

| Folder | Responsibility |
|--------|----------------|
| `app` | Next.js routes, layouts, route groups, metadata, page-level composition. |
| `src/components` | Reusable UI and domain components. |
| `src/features` | Feature-specific RTK Query APIs, slices, selectors, and feature helpers. |
| `src/store` | Redux store setup, typed hooks, middleware, root reducer. |
| `src/lib/api` | Shared RTK Query base query, API error handling, request headers. |
| `src/lib/auth` | Supabase client, session helpers, token retrieval. |
| `src/config` | Static app config, route definitions, permission-to-navigation mapping. |
| `src/i18n` | Spanish and English message files and locale routing. |
| `src/types` | Shared frontend-only types. Prefer generated API types later. |
| `src/test` | Frontend test utilities, fixtures, and mock API handlers. |

---

## Route Groups

### `(auth)`

Unauthenticated account pages:

- Login.
- Forgot password.
- Reset password.
- Accept invitation.

These pages should use Supabase Auth for identity but should rely on the backend API for tenant membership, roles, and permissions after login.

### `(app)`

Authenticated tenant-aware SaaS application.

Every page in this group should assume:

- There is an authenticated user.
- The user has selected or resolved a current tenant.
- Requests include `Authorization: Bearer <token>`.
- Tenant-aware requests include `x-tenant-slug: <tenant-slug>`.
- Navigation and operations are permission-aware.

### `(public)`

Public candidate-facing and company-facing pages:

- Public career page.
- Public job detail page.
- Public job application page.

These pages should not require authentication. They should consume public recruiting endpoints only.

---

## State Management Plan

### Store Shape

Initial Redux store:

```text
store
  auth
    sessionStatus
    userId
    email
  tenant
    currentTenantSlug
    availableTenants
  layout
    sidebarCollapsed
    activeWorkspaceSection
  preferences
    locale
    timezone
    currency
  api
    RTK Query cache
```

### RTK Query API Slices

Recommended API slices:

```text
features/auth/auth-api.ts
features/tenants/tenants-api.ts
features/dashboard/dashboard-api.ts
features/organization/organization-api.ts
features/employees/employees-api.ts
features/documents/documents-api.ts
features/leave/leave-api.ts
features/approvals/approvals-api.ts
features/onboarding/onboarding-api.ts
features/recruiting/recruiting-api.ts
features/reports/reports-api.ts
features/notifications/notifications-api.ts
features/audit/audit-api.ts
```

Use one shared base API if practical:

```text
features/api/base-api.ts
```

The base API should:

- Read the API base URL from environment config.
- Attach Supabase access token to `Authorization`.
- Attach the current tenant slug to `x-tenant-slug` for tenant-aware requests.
- Normalize backend error responses.
- Handle `401` by clearing session state or triggering re-authentication.
- Handle `403` by showing permission-aware errors.

### Cache Tags

RTK Query cache tags should map to backend resource areas:

```text
CurrentUser
Tenant
Dashboard
Department
Location
JobTitle
EmploymentType
Employee
EmployeeDocument
DocumentCategory
PolicyDocument
LeaveType
LeavePolicy
LeaveBalance
LeaveRequest
ApprovalRequest
OnboardingTemplate
OnboardingPacket
JobOpening
Candidate
Report
Notification
AuditEvent
```

---

## API Conventions

The backend uses REST under `/api/v1`.

Frontend requests should assume:

```text
Authorization: Bearer <supabase-access-token>
x-tenant-slug: <tenant-slug>
```

`GET /api/v1/me` is the main exception because it does not require tenant context.

Recommended list endpoint behavior:

- `page`
- `pageSize`
- `search`
- `sort`
- `direction`
- Feature-specific filters.

Recommended response pattern for list views:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "total": 0
  }
}
```

Recommended backend error shape:

```json
{
  "error": {
    "code": "EMPLOYEE_NOT_FOUND",
    "message": "Employee was not found.",
    "details": {}
  }
}
```

The frontend should translate stable backend error codes where useful.

---

## Shared Components

### App Shell Components

| Component | Purpose |
|-----------|---------|
| `AppShell` | Main authenticated layout. |
| `SidebarNav` | Primary module navigation. |
| `TopBar` | Page title area, tenant switcher, notifications, user menu. |
| `TenantSwitcher` | Shows available tenants and changes current tenant. |
| `UserMenu` | Account, language, logout actions. |
| `PermissionGate` | Shows or hides UI based on permissions. |
| `PageHeader` | Standard title, description, actions, breadcrumbs. |
| `PageTabs` | Secondary navigation inside modules. |

### Data Components

| Component | Purpose |
|-----------|---------|
| `DataTable` | TanStack Table wrapper with sorting, filters, pagination. |
| `FilterBar` | Search and filter controls. |
| `EmptyState` | Empty data state. |
| `LoadingState` | Loading indicator for panels and pages. |
| `ErrorState` | Recoverable API error state. |
| `StatusBadge` | Consistent display for statuses. |
| `MetricCard` | Dashboard number with trend/context. |
| `ActivityTimeline` | Audit, employee history, candidate history, workflow history. |

### Form Components

| Component | Purpose |
|-----------|---------|
| `FormField` | Form label, validation message, help text. |
| `SelectField` | Standard select wrapper. |
| `DateField` | Date input with locale formatting. |
| `CurrencyField` | Currency amount input for BOB/USD. |
| `EmployeePicker` | Search/select employee. |
| `DepartmentPicker` | Search/select department. |
| `FileUploadField` | Upload control for documents. |
| `FormActions` | Submit/cancel/delete action area. |

### Domain Components

| Component | Purpose |
|-----------|---------|
| `EmployeeAvatar` | Employee initials/photo. |
| `EmployeeSummaryCard` | Compact employee identity and job summary. |
| `EmployeeStatusBadge` | Active, inactive, terminated. |
| `OrgUnitBreadcrumb` | Department/location hierarchy context. |
| `LeaveBalanceSummary` | Employee leave balances. |
| `LeaveRequestStatusBadge` | Pending, approved, rejected, cancelled. |
| `DocumentStatusBadge` | Missing, expiring, acknowledged, expired. |
| `ApprovalActions` | Approve/reject/comment controls. |
| `CandidatePipeline` | Candidate status pipeline. |
| `ReportExportButton` | CSV/XLSX export action. |

---

## Navigation Model

Primary authenticated navigation:

| Area | Route | Main Users |
|------|-------|------------|
| Dashboard | `/dashboard` | Owner, HR Admin, HR Staff, Manager |
| Employees | `/employees` | Owner, HR Admin, HR Staff, Manager, Finance Viewer |
| Directory | `/directory` | All users |
| Org Chart | `/org-chart` | All users |
| Documents | `/documents` | Owner, HR Admin, HR Staff, Employee |
| Leave | `/leave` | All users |
| Approvals | `/approvals` | Owner, HR Admin, HR Staff, Manager |
| Onboarding | `/onboarding` | Owner, HR Admin, HR Staff, Manager |
| Recruiting | `/recruiting` | Owner, HR Admin, HR Staff, Recruiter |
| Reports | `/reports` | Owner, HR Admin, HR Staff, Finance Viewer |
| Notifications | `/notifications` | All users |
| Settings | `/settings` | Owner, HR Admin |

Navigation must be filtered by permission, not only by role name.

---

## Page Inventory

### UI View Summary

The first frontend plan identifies **50 UI views**.

| # | View | Summary |
|---|------|---------|
| 1 | Login | User sign-in through Supabase Auth and initial profile/tenant loading. |
| 2 | Forgot Password | Password reset request flow. |
| 3 | Reset Password | Password update flow after a reset link. |
| 4 | Accept Invitation | Tenant invitation validation and acceptance flow. |
| 5 | App Shell | Authenticated tenant-aware layout with navigation, user menu, tenant switcher, and notifications preview. |
| 6 | Dashboard | Operational HR overview with headcount, approvals, leave, documents, onboarding, recruiting, and activity summaries. |
| 7 | Organization Settings | Departments, locations, job titles, employment types, work modes, client projects, and holiday calendars. |
| 8 | Employee List | Main HR employee database with search, filters, import, export, and create actions. |
| 9 | New Employee | Employee creation form for HR profile, job assignment, manager, and optional onboarding/invitation actions. |
| 10 | Employee Profile | Full employee profile with permission-aware personal, contact, job, custom field, and activity information. |
| 11 | Employee Job | Job assignment, manager relationship, department, location, work mode, and client/project history. |
| 12 | Employee Compensation | Compensation records and history for users with compensation permissions. |
| 13 | Employee Documents | Employee-specific documents, categories, expirations, downloads, and acknowledgements. |
| 14 | Employee Leave | Employee-specific leave balances, requests, and leave history. |
| 15 | Employee History | Employee profile change history and audit-related activity. |
| 16 | Directory | Permission-safe company directory for all employees. |
| 17 | Org Chart | Reporting-line visualization by manager relationships. |
| 18 | Documents Home | Central document workspace for recent uploads, expiring documents, missing documents, and categories. |
| 19 | Policies | Company policy documents and acknowledgement tracking. |
| 20 | Missing Documents | Required document compliance report by employee and category. |
| 21 | Leave Home | Employee and manager leave overview with balances, upcoming requests, and holidays. |
| 22 | Leave Requests | HR/manager view for leave request review, approval, rejection, override, and export. |
| 23 | Leave Balances | Leave balance administration, adjustments, transaction history, and export. |
| 24 | Leave Calendar | Team/company time-off and holiday calendar. |
| 25 | Leave Policies | Leave types, accrual policies, assignments, and policy configuration. |
| 26 | Approvals | Central approval inbox for leave, profile changes, documents, onboarding, and other workflows. |
| 27 | Onboarding Home | Onboarding progress overview with active packets, overdue tasks, and upcoming starts. |
| 28 | Onboarding Templates | Reusable onboarding templates and task definitions. |
| 29 | Onboarding Packets | List of onboarding packets with status, employee, owner, and progress filters. |
| 30 | Onboarding Packet Detail | One new-hire packet with tasks, required documents, acknowledgements, and activity. |
| 31 | Recruiting Home | Lightweight ATS dashboard with open jobs, candidate counts, recent candidates, and hiring summary. |
| 32 | Job Openings | Job opening list with create, edit, publish, close, and public link operations. |
| 33 | New Job Opening | Job opening creation form. |
| 34 | Job Detail And Pipeline | Job detail plus candidate pipeline by stage. |
| 35 | Candidates | Candidate list across jobs with filters and export later. |
| 36 | Candidate Detail | Candidate profile, resume/documents, notes, stage changes, and conversion to employee. |
| 37 | Public Careers Page | Public tenant career page listing open jobs. |
| 38 | Public Job Detail | Public job posting detail page. |
| 39 | Public Job Application | Public candidate application form with resume upload. |
| 40 | Reports Home | Standard and saved reports entry point. |
| 41 | Report Detail | One report with filters, columns, data table/chart, saved filters, and export. |
| 42 | Notifications | In-app notification list with read/unread actions. |
| 43 | Settings Home | Settings landing page for company, organization, users, roles, permissions, audit, billing, and localization. |
| 44 | Company Settings | Tenant company profile, default language, currency, timezone, and status. |
| 45 | Users | Tenant users, invitations, membership status, role changes, and disabling access. |
| 46 | Roles | Role list, custom role creation, role editing, and role lifecycle. |
| 47 | Permissions | Permission catalog and role-permission assignment management. |
| 48 | Audit | Tenant audit events with actor, action, resource, date, and filtering. |
| 49 | Localization | Tenant language, timezone, currency, regional defaults, and holiday calendar settings. |
| 50 | Billing | Current plan, subscription status, usage, employee count, and plan limits. |

### Authentication

#### Login

Route:

```text
/login
```

Purpose:

- Authenticate a user through Supabase Auth.
- Load internal user, tenant memberships, roles, and permissions.

Information shown:

- Email.
- Password.
- Error messages.
- Password reset link.

Operations:

- Sign in.
- Redirect to tenant selection or dashboard.

Endpoints/services:

| Method | Endpoint/Service | Purpose |
|--------|------------------|---------|
| Supabase SDK | `signInWithPassword` | Authenticate identity. |
| GET | `/api/v1/me` | Load internal user and available tenants. |

#### Forgot Password

Route:

```text
/forgot-password
```

Operations:

- Request password reset email.

Endpoints/services:

| Method | Endpoint/Service | Purpose |
|--------|------------------|---------|
| Supabase SDK | `resetPasswordForEmail` | Send reset email. |

#### Accept Invitation

Route:

```text
/accept-invitation
```

Operations:

- Accept tenant invitation.
- Set password if required by Supabase flow.
- Join tenant membership.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/invitations/{token}` | Validate invitation. |
| POST | `/api/v1/invitations/{token}/accept` | Accept invitation. |
| GET | `/api/v1/me` | Reload user memberships. |

Backend note: invitation endpoints are not implemented yet.

---

## App Shell And Tenant Context

### App Layout

Route:

```text
/(app)/*
```

Purpose:

- Provide tenant-aware authenticated shell.
- Load current user, current tenant, permissions, navigation, and notifications.

Information shown:

- Tenant name.
- User name.
- Navigation filtered by permission.
- Unread notifications count.

Operations:

- Switch tenant.
- Change language.
- Sign out.
- Open notifications.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/me` | Current user and available tenants. |
| GET | `/api/v1/tenants/current` | Current tenant detail. |
| GET | `/api/v1/notifications?status=unread&limit=10` | Notification preview. |

---

## Dashboard

### HR Dashboard

Route:

```text
/dashboard
```

Purpose:

- Give HR and leadership an operational overview.

Information shown:

- Total active employees.
- Headcount by department.
- Headcount by location.
- New hires this month.
- Terminations this month.
- Upcoming time off.
- Pending approvals.
- Missing or expiring documents.
- Onboarding packets in progress.
- Open job openings.
- Candidate pipeline summary.
- Recent audit or activity feed.

Operations:

- Navigate to filtered employee lists.
- Navigate to pending approvals.
- Navigate to missing documents.
- Export dashboard summaries later.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/dashboard/summary` | Main dashboard metrics. |
| GET | `/api/v1/reports/headcount` | Headcount metrics. |
| GET | `/api/v1/leave-requests?status=pending&limit=5` | Pending leave requests. |
| GET | `/api/v1/documents/missing?limit=5` | Missing documents. |
| GET | `/api/v1/onboarding-packets?status=in_progress&limit=5` | Active onboarding. |
| GET | `/api/v1/job-openings?status=open&limit=5` | Open jobs. |

Backend note: dashboard endpoints can be backed by the reports module or dedicated dashboard read endpoints.

---

## Organization Setup

### Organization Settings

Route:

```text
/settings/organization
```

Purpose:

- Configure tenant organization structure.

Information shown:

- Departments.
- Locations.
- Job titles.
- Employment types.
- Work modes.
- Client/project assignments.
- Holiday calendars.

Operations:

- Create, edit, archive departments.
- Create, edit, archive locations.
- Create, edit, archive job titles.
- Create, edit, archive employment types.
- Create, edit, archive work modes.
- Create, edit, archive client/project records.
- Manage holiday calendars and holidays.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/api/v1/departments` | List/create departments. |
| GET/PATCH/DELETE | `/api/v1/departments/{departmentId}` | Read/update/archive department. |
| GET/POST | `/api/v1/locations` | List/create locations. |
| GET/PATCH/DELETE | `/api/v1/locations/{locationId}` | Read/update/archive location. |
| GET/POST | `/api/v1/job-titles` | List/create job titles. |
| GET/PATCH/DELETE | `/api/v1/job-titles/{jobTitleId}` | Read/update/archive job title. |
| GET/POST | `/api/v1/employment-types` | List/create employment types. |
| GET/POST | `/api/v1/work-modes` | List/create work modes. |
| GET/POST | `/api/v1/client-projects` | List/create client projects. |
| GET/POST | `/api/v1/holiday-calendars` | List/create holiday calendars. |
| GET/POST | `/api/v1/holidays` | List/create holidays. |

---

## Employees

### Employee List

Route:

```text
/employees
```

Purpose:

- Main HR employee database view.

Information shown:

- Employee name.
- Employee number.
- Work email.
- Status.
- Department.
- Job title.
- Location.
- Manager.
- Employment type.
- Work mode.
- Start date.
- Client/project assignment.

Operations:

- Search employees.
- Filter by status, department, location, manager, role, employment type.
- Sort columns.
- Open employee profile.
- Create employee.
- Import employees from CSV.
- Export employees to CSV/XLSX.
- Bulk update limited fields later.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/employees` | List employees. |
| POST | `/api/v1/employees` | Create employee. |
| POST | `/api/v1/employees/import` | Import employees. |
| GET | `/api/v1/employees/export` | Export employees. |
| GET | `/api/v1/departments` | Filter options. |
| GET | `/api/v1/locations` | Filter options. |
| GET | `/api/v1/job-titles` | Filter options. |

### New Employee

Route:

```text
/employees/new
```

Purpose:

- Create an employee HR profile.

Information collected:

- Personal details.
- Work contact.
- Job assignment.
- Manager.
- Employment type.
- Work mode.
- Start date.
- Compensation if user has permission.
- Client/project assignment.
- Optional linked user account.

Operations:

- Create employee.
- Optionally invite user.
- Optionally start onboarding packet after creation.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/employees` | Create employee. |
| POST | `/api/v1/users/invitations` | Invite employee user. |
| POST | `/api/v1/onboarding-packets` | Start onboarding after creation. |

### Employee Profile

Route:

```text
/employees/[employeeId]
```

Purpose:

- Show full employee profile according to field-level permissions.

Information shown:

- Profile summary.
- Personal information.
- Contact information.
- Emergency contacts.
- Job information.
- Manager and reporting line.
- Department, location, job title.
- Employment status.
- Start date and termination data.
- Custom fields.
- Recent activity.
- Linked user account.

Operations:

- Edit profile fields.
- Change status.
- Request profile change approval if required.
- View activity history.
- Navigate to employee documents, leave, job, compensation, and history tabs.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/employees/{employeeId}` | Employee detail. |
| PATCH | `/api/v1/employees/{employeeId}` | Update employee. |
| POST | `/api/v1/employees/{employeeId}/terminate` | Terminate employee. |
| GET | `/api/v1/employees/{employeeId}/history` | Profile change history. |
| GET | `/api/v1/audit-events?resourceType=employee&resourceId={employeeId}` | Audit history. |

### Employee Job

Route:

```text
/employees/[employeeId]/job
```

Purpose:

- Manage job assignment and reporting information.

Information shown:

- Current department.
- Job title.
- Location.
- Employment type.
- Work mode.
- Manager.
- Client/project assignment.
- Assignment history.

Operations:

- Add job assignment.
- End current assignment.
- Change manager.
- Add client/project assignment.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/api/v1/employees/{employeeId}/job-assignments` | List/create job assignments. |
| GET/POST | `/api/v1/employees/{employeeId}/manager-relationships` | List/create manager relationships. |
| GET/POST | `/api/v1/employees/{employeeId}/client-assignments` | List/create client assignments. |

### Employee Compensation

Route:

```text
/employees/[employeeId]/compensation
```

Purpose:

- Manage compensation records for users with permission.

Information shown:

- Current compensation.
- Compensation history.
- Currency.
- Frequency.
- Effective dates.

Operations:

- Add compensation record.
- End compensation record.
- Export compensation history if permitted.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/api/v1/employees/{employeeId}/compensation-records` | List/create compensation records. |
| PATCH | `/api/v1/employees/{employeeId}/compensation-records/{recordId}` | Update compensation record. |

Permission note: this page requires compensation field permission.

---

## Directory And Org Chart

### Directory

Route:

```text
/directory
```

Purpose:

- Employee-facing searchable company directory.

Information shown:

- Name.
- Role/job title.
- Department.
- Location.
- Work email.
- Manager.
- Public profile fields.

Operations:

- Search people.
- Filter by department, location, job title.
- View public employee profile.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/directory/employees` | Permission-safe employee directory. |
| GET | `/api/v1/directory/employees/{employeeId}` | Public employee profile. |

### Org Chart

Route:

```text
/org-chart
```

Purpose:

- Show reporting structure by manager relationships.

Information shown:

- Employees grouped by reporting line.
- Manager/direct report relationships.
- Department and location context.

Operations:

- Search employee in chart.
- Filter by department/location.
- Navigate to employee profile if permitted.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/org-chart` | Org chart tree. |

---

## Documents

### Documents Home

Route:

```text
/documents
```

Purpose:

- Manage employee documents and company documents.

Information shown:

- Recent uploads.
- Expiring documents.
- Missing required documents.
- Document categories.
- Policy acknowledgements.

Operations:

- Upload document.
- Search documents.
- Filter by employee, category, status, expiration.
- Download document if permitted.
- Delete/archive document if permitted.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/documents` | List documents. |
| POST | `/api/v1/documents` | Create document metadata. |
| POST | `/api/v1/documents/signed-upload-url` | Create signed upload URL. |
| POST | `/api/v1/documents/{documentId}/signed-download-url` | Create signed download URL. |
| DELETE | `/api/v1/documents/{documentId}` | Archive/delete document. |

### Employee Documents

Route:

```text
/employees/[employeeId]/documents
```

Purpose:

- Show documents for one employee.

Information shown:

- Document name.
- Category.
- Upload date.
- Expiration date.
- Acknowledgement status.
- Visibility.

Operations:

- Upload employee document.
- Download document.
- Request acknowledgement.
- Mark document category requirement complete.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/employees/{employeeId}/documents` | Employee documents. |
| POST | `/api/v1/employees/{employeeId}/documents` | Create employee document metadata. |
| POST | `/api/v1/documents/{documentId}/acknowledgements` | Acknowledge document. |

### Policies

Route:

```text
/documents/policies
```

Purpose:

- Manage company policies and employee acknowledgements.

Information shown:

- Policy name.
- Version.
- Required acknowledgement.
- Acknowledgement progress.
- Published date.

Operations:

- Upload policy.
- Publish policy.
- Request acknowledgement.
- View acknowledgement list.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/api/v1/policy-documents` | List/create policies. |
| POST | `/api/v1/policy-documents/{documentId}/publish` | Publish policy. |
| GET | `/api/v1/policy-documents/{documentId}/acknowledgements` | Acknowledgement status. |

### Missing Documents

Route:

```text
/documents/missing
```

Purpose:

- Show required documents that are missing by employee.

Information shown:

- Employee.
- Required category.
- Due date if applicable.
- Status.

Operations:

- Filter by department, employee, document category.
- Open employee documents.
- Export missing document report.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/documents/missing` | Missing document report. |
| GET | `/api/v1/documents/missing/export` | Export report. |

---

## Leave And Approvals

### Leave Home

Route:

```text
/leave
```

Purpose:

- Self-service and HR leave summary.

Information shown:

- User leave balances.
- User upcoming requests.
- Team upcoming time off if manager.
- Company holidays.
- Pending approval count if manager/HR.

Operations:

- Request time off.
- Cancel own request.
- Navigate to calendar, balances, policies, requests.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/me/leave-balances` | Current user's balances. |
| GET | `/api/v1/leave-requests?scope=me` | Current user's requests. |
| POST | `/api/v1/leave-requests` | Create leave request. |
| POST | `/api/v1/leave-requests/{requestId}/cancel` | Cancel request. |
| GET | `/api/v1/holidays?upcoming=true` | Upcoming holidays. |

### Leave Requests

Route:

```text
/leave/requests
```

Purpose:

- HR and manager view of leave requests.

Information shown:

- Employee.
- Leave type.
- Dates.
- Duration.
- Status.
- Approver.
- Created date.

Operations:

- Search/filter requests.
- Approve request.
- Reject request.
- HR override.
- Export leave requests.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/leave-requests` | List leave requests. |
| POST | `/api/v1/leave-requests/{requestId}/approve` | Approve request. |
| POST | `/api/v1/leave-requests/{requestId}/reject` | Reject request. |
| POST | `/api/v1/leave-requests/{requestId}/override` | HR override. |
| GET | `/api/v1/leave-requests/export` | Export requests. |

### Leave Balances

Route:

```text
/leave/balances
```

Purpose:

- Manage employee leave balances.

Information shown:

- Employee.
- Leave type.
- Current balance.
- Last adjustment date.
- Policy.

Operations:

- Filter balances.
- Adjust balance.
- View balance transaction history.
- Export balances.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/leave-balances` | List balances. |
| POST | `/api/v1/leave-balances/{balanceId}/adjustments` | Adjust balance. |
| GET | `/api/v1/leave-balances/{balanceId}/transactions` | Balance history. |
| GET | `/api/v1/leave-balances/export` | Export balances. |

### Leave Calendar

Route:

```text
/leave/calendar
```

Purpose:

- Show team/company time-off calendar.

Information shown:

- Approved time off.
- Pending time off optionally.
- Company holidays.
- Department/location/team filters.

Operations:

- Filter calendar.
- Open leave request detail.
- Navigate by month/week.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/leave-calendar` | Calendar events. |
| GET | `/api/v1/holidays` | Holiday events. |

### Leave Policies

Route:

```text
/leave/policies
```

Purpose:

- Configure leave types and accrual policies.

Information shown:

- Leave types.
- Policy names.
- Annual allowance.
- Carryover limit.
- Approval requirement.
- Assigned employees.

Operations:

- Create/edit leave type.
- Create/edit policy.
- Assign policy to employee/group.
- Archive policy.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/api/v1/leave-types` | List/create leave types. |
| GET/PATCH | `/api/v1/leave-types/{leaveTypeId}` | Read/update leave type. |
| GET/POST | `/api/v1/leave-policies` | List/create leave policies. |
| GET/PATCH | `/api/v1/leave-policies/{policyId}` | Read/update leave policy. |
| POST | `/api/v1/leave-policies/{policyId}/assignments` | Assign policy. |

### Approvals

Route:

```text
/approvals
```

Purpose:

- One place for managers and HR to process pending approvals.

Information shown:

- Approval type.
- Requester.
- Subject.
- Status.
- Current step.
- Due date.
- Comments.

Operations:

- Approve.
- Reject.
- Comment.
- Delegate if permitted.
- Filter by request type and status.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/approval-requests` | List approval requests. |
| POST | `/api/v1/approval-requests/{approvalRequestId}/approve` | Approve. |
| POST | `/api/v1/approval-requests/{approvalRequestId}/reject` | Reject. |
| POST | `/api/v1/approval-requests/{approvalRequestId}/comments` | Add comment. |
| POST | `/api/v1/approval-requests/{approvalRequestId}/delegate` | Delegate approval. |

---

## Onboarding

### Onboarding Home

Route:

```text
/onboarding
```

Purpose:

- Overview of new-hire onboarding progress.

Information shown:

- Active packets.
- Overdue tasks.
- Completion rate.
- Upcoming starts.
- Recently completed onboarding.

Operations:

- Start onboarding.
- Open packet.
- Filter by status, owner, department, start date.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/onboarding-summary` | Onboarding metrics. |
| GET | `/api/v1/onboarding-packets` | List packets. |
| POST | `/api/v1/onboarding-packets` | Start packet. |

### Onboarding Templates

Route:

```text
/onboarding/templates
```

Purpose:

- Configure reusable onboarding templates.

Information shown:

- Template name.
- Department/job/location applicability.
- Task count.
- Active status.

Operations:

- Create template.
- Edit template.
- Add/remove tasks.
- Archive template.
- Duplicate template.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/api/v1/onboarding-templates` | List/create templates. |
| GET/PATCH/DELETE | `/api/v1/onboarding-templates/{templateId}` | Read/update/archive template. |
| POST | `/api/v1/onboarding-templates/{templateId}/tasks` | Add task. |
| PATCH/DELETE | `/api/v1/onboarding-template-tasks/{taskId}` | Update/archive task. |

### Onboarding Packet Detail

Route:

```text
/onboarding/packets/[packetId]
```

Purpose:

- Track and manage one employee onboarding packet.

Information shown:

- Employee.
- Start date.
- Template.
- Progress.
- Tasks by owner.
- Required documents.
- Policy acknowledgements.
- Activity timeline.

Operations:

- Complete task.
- Reassign task.
- Change due date.
- Add ad hoc task.
- Mark packet complete.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/onboarding-packets/{packetId}` | Packet detail. |
| PATCH | `/api/v1/onboarding-packets/{packetId}` | Update packet. |
| POST | `/api/v1/onboarding-packets/{packetId}/tasks` | Add task. |
| POST | `/api/v1/onboarding-tasks/{taskId}/complete` | Complete task. |
| PATCH | `/api/v1/onboarding-tasks/{taskId}` | Update task. |

---

## Recruiting

### Recruiting Home

Route:

```text
/recruiting
```

Purpose:

- Lightweight ATS overview.

Information shown:

- Open jobs.
- Candidate counts by status.
- Recent candidates.
- Interviews or follow-ups if added later.
- Hiring report summary.

Operations:

- Create job opening.
- Add candidate.
- Open job pipeline.
- Export candidate list.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/recruiting-summary` | Recruiting metrics. |
| GET | `/api/v1/job-openings` | Open jobs. |
| GET | `/api/v1/candidates?limit=10` | Recent candidates. |

### Job Openings

Route:

```text
/recruiting/jobs
```

Purpose:

- Manage job openings.

Information shown:

- Title.
- Department.
- Location.
- Status.
- Public slug.
- Candidate count.
- Created date.

Operations:

- Create job.
- Edit job.
- Publish/unpublish job.
- Close job.
- Copy public job link.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/api/v1/job-openings` | List/create job openings. |
| GET/PATCH | `/api/v1/job-openings/{jobOpeningId}` | Read/update job opening. |
| POST | `/api/v1/job-openings/{jobOpeningId}/publish` | Publish job. |
| POST | `/api/v1/job-openings/{jobOpeningId}/close` | Close job. |

### Job Detail And Pipeline

Route:

```text
/recruiting/jobs/[jobOpeningId]
```

Purpose:

- Manage candidates for one job.

Information shown:

- Job detail.
- Candidate pipeline by stage.
- Candidate ratings.
- Candidate source.
- Recent notes.

Operations:

- Add candidate.
- Move candidate between stages.
- Add note.
- Rate candidate.
- Generate offer letter later.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/job-openings/{jobOpeningId}` | Job detail. |
| GET | `/api/v1/job-openings/{jobOpeningId}/candidates` | Candidates for job. |
| POST | `/api/v1/candidates` | Create candidate. |
| POST | `/api/v1/candidates/{candidateId}/stage-changes` | Move candidate stage. |
| POST | `/api/v1/candidates/{candidateId}/notes` | Add note. |

### Candidate Detail

Route:

```text
/recruiting/candidates/[candidateId]
```

Purpose:

- Manage candidate record.

Information shown:

- Candidate profile.
- Resume/documents.
- Pipeline stage.
- Notes.
- Interview history.
- Offer details if available.

Operations:

- Edit candidate.
- Upload resume/document.
- Add note.
- Change stage.
- Convert candidate to employee.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/PATCH | `/api/v1/candidates/{candidateId}` | Read/update candidate. |
| POST | `/api/v1/candidates/{candidateId}/documents` | Upload candidate document metadata. |
| POST | `/api/v1/candidates/{candidateId}/notes` | Add note. |
| POST | `/api/v1/candidates/{candidateId}/convert-to-employee` | Convert to employee. |

### Public Careers Page

Route:

```text
/careers/[tenantSlug]
```

Purpose:

- Public list of open job postings for one tenant.

Information shown:

- Company name.
- Open jobs.
- Job department/location/work mode.

Operations:

- Search/filter jobs.
- Open job detail.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/public/tenants/{tenantSlug}/job-openings` | Public jobs. |

### Public Job Detail And Application

Routes:

```text
/jobs/[jobSlug]
/jobs/[jobSlug]/apply
```

Purpose:

- Show public job detail.
- Allow candidate application.

Information collected:

- Candidate name.
- Email.
- Phone.
- Resume.
- Optional cover letter/message.

Operations:

- Submit application.
- Upload resume.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/public/job-openings/{jobSlug}` | Public job detail. |
| POST | `/api/v1/public/job-openings/{jobSlug}/applications` | Submit application. |

---

## Reports

### Reports Home

Route:

```text
/reports
```

Purpose:

- Entry point for standard reports and exports.

Information shown:

- Headcount reports.
- Employee status reports.
- New hire reports.
- Termination reports.
- Leave reports.
- Missing documents.
- Onboarding progress.
- Candidate pipeline.
- Saved reports.

Operations:

- Open report.
- Save filters.
- Export CSV/XLSX.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/reports` | List available reports. |
| GET | `/api/v1/saved-reports` | List saved reports. |
| POST | `/api/v1/saved-reports` | Save report config. |

### Report Detail

Route:

```text
/reports/[reportType]
```

Purpose:

- Display one report with filters, columns, chart/table, and export action.

Information shown:

- Report-specific filters.
- Chart when useful.
- Data table.
- Export status.

Operations:

- Apply filters.
- Select columns.
- Save report.
- Export CSV/XLSX.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/reports/{reportType}` | Report data. |
| POST | `/api/v1/reports/{reportType}/exports` | Start export. |
| GET | `/api/v1/export-jobs/{exportJobId}` | Check export status. |
| POST | `/api/v1/export-jobs/{exportJobId}/signed-download-url` | Download export. |

---

## Notifications

### Notifications

Route:

```text
/notifications
```

Purpose:

- Show in-app notifications.

Information shown:

- Notification title.
- Body.
- Type.
- Created date.
- Read/unread status.
- Related resource link.

Operations:

- Mark read.
- Mark all read.
- Open related item.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/notifications` | List notifications. |
| POST | `/api/v1/notifications/{notificationId}/read` | Mark read. |
| POST | `/api/v1/notifications/read-all` | Mark all read. |

---

## Settings

### Company Settings

Route:

```text
/settings/company
```

Purpose:

- Manage tenant company profile.

Information shown:

- Company name.
- Slug.
- Default language.
- Default currency.
- Timezone.
- Status.

Operations:

- Edit company settings.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/tenants/current` | Current tenant detail. |
| PATCH | `/api/v1/tenants/current` | Update tenant settings. |

### Users

Route:

```text
/settings/users
```

Purpose:

- Manage tenant user access.

Information shown:

- User name.
- Email.
- Membership status.
- Role.
- Invited date.
- Joined date.

Operations:

- Invite user.
- Resend invitation.
- Disable membership.
- Change role.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/users` | List tenant users. |
| POST | `/api/v1/users/invitations` | Invite user. |
| POST | `/api/v1/users/invitations/{invitationId}/resend` | Resend invite. |
| PATCH | `/api/v1/tenant-memberships/{membershipId}` | Update membership. |
| POST | `/api/v1/tenant-memberships/{membershipId}/disable` | Disable membership. |

### Roles And Permissions

Routes:

```text
/settings/roles
/settings/permissions
```

Purpose:

- Manage role-based access control.

Information shown:

- Roles.
- Permission groups.
- Role permission assignments.
- System roles vs custom roles.

Operations:

- Create custom role.
- Edit role.
- Assign permissions.
- Archive role if allowed.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/api/v1/roles` | List/create roles. |
| GET/PATCH | `/api/v1/roles/{roleId}` | Read/update role. |
| GET | `/api/v1/permissions` | List permissions. |
| PUT | `/api/v1/roles/{roleId}/permissions` | Replace role permissions. |

### Audit

Route:

```text
/settings/audit
```

Purpose:

- Show audit events for sensitive actions.

Information shown:

- Actor.
- Action.
- Resource type.
- Resource ID.
- Date.
- IP address.
- Metadata summary.

Operations:

- Filter by actor, action, resource, date.
- Export audit events later.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/audit-events` | List audit events. |
| GET | `/api/v1/audit-events/export` | Export audit events later. |

### Localization

Route:

```text
/settings/localization
```

Purpose:

- Configure tenant language, timezone, currency, holidays, and regional defaults.

Information shown:

- Default language.
- Default currency.
- Timezone.
- Holiday calendars.
- Supported countries.

Operations:

- Change default language.
- Change default currency.
- Change timezone.
- Configure holiday calendars.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| PATCH | `/api/v1/tenants/current` | Update tenant localization defaults. |
| GET/POST | `/api/v1/holiday-calendars` | Manage calendars. |

### Billing

Route:

```text
/settings/billing
```

Purpose:

- Show current plan and usage. First version can be read-only/manual.

Information shown:

- Current plan.
- Subscription status.
- Employee count.
- Job opening limits.
- Usage limits.

Operations:

- View subscription.
- Request plan change manually in first version.

Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/billing/subscription` | Current subscription. |
| GET | `/api/v1/billing/usage` | Usage and limits. |

---

## Role-Based Experience

Initial roles:

- Owner.
- HR Admin.
- HR Staff.
- Manager.
- Employee.
- Finance Viewer.
- Recruiter.

Frontend rules:

- Do not rely on role names alone for access.
- Use backend-provided permissions for rendering navigation, buttons, pages, and fields.
- Still expect the backend to enforce all authorization.
- Hide sensitive fields unless permission exists.

Examples:

| Permission | Frontend Impact |
|------------|-----------------|
| `employee.read` | Can access employee list/detail. |
| `employee.write` | Can create/edit employees. |
| `employee.compensation.read` | Can view compensation fields. |
| `document.read` | Can view document metadata. |
| `document.download` | Can request signed download URL. |
| `leave.approve` | Can approve/reject leave requests. |
| `audit.read` | Can access audit events. |
| `role.manage` | Can manage roles and permissions. |

---

## Internationalization

The app should support Spanish and English from the beginning.

Frontend requirements:

- Use `next-intl`.
- Keep message files under `src/i18n/messages`.
- Do not hardcode display strings inside deeply nested feature components when they need translation.
- Format dates by locale.
- Format numbers and currency by locale.
- Support BOB and USD display.
- Store tenant default language from backend.
- Allow user preference to override tenant language if supported.

Initial locales:

```text
es
en
```

Recommended default:

```text
es
```

---

## Forms And Validation

Use React Hook Form and Zod.

Rules:

- Each create/edit form should have a Zod schema.
- Frontend validation should catch common mistakes before submit.
- Backend remains source of truth for validation.
- Use backend error codes to map field errors where possible.
- Keep form models separate from API response models when needed.

High-priority forms:

- Login.
- Accept invitation.
- Employee create/edit.
- Job assignment create.
- Compensation record create.
- Document upload metadata.
- Leave request create.
- Leave policy create/edit.
- Onboarding template create/edit.
- Onboarding task create/edit.
- Job opening create/edit.
- Candidate create/edit.
- User invite.
- Role edit.

---

## Tables And Filtering

Use TanStack Table for data-heavy views.

Table requirements:

- Server-side pagination.
- Server-side sorting.
- Server-side filtering for large data sets.
- Column visibility for reports and employee list.
- Row actions with permission checks.
- Empty, loading, and error states.

High-priority tables:

- Employees.
- Documents.
- Missing documents.
- Leave requests.
- Leave balances.
- Onboarding packets.
- Job openings.
- Candidates.
- Reports.
- Users.
- Audit events.

---

## File Upload Plan

Documents are sensitive and should use signed upload URLs.

Initial flow:

1. User selects file.
2. Frontend requests signed upload URL from backend.
3. Frontend uploads file directly to storage provider.
4. Frontend confirms or creates document metadata through backend.
5. Backend stores metadata and audit events.

The frontend must not:

- Store permanent public document URLs.
- Assume direct Supabase table/storage access for business records.
- Bypass backend authorization.

Upload-related endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/documents/signed-upload-url` | Request upload URL. |
| POST | `/api/v1/documents` | Create metadata. |
| POST | `/api/v1/documents/{documentId}/signed-download-url` | Request download URL. |

---

## Testing Plan

### Unit And Component Tests

Use Vitest and React Testing Library for:

- Permission-gated rendering.
- Form validation.
- Table filtering UI.
- Status badges.
- Data display components.
- API error rendering.

### E2E Tests

Use Playwright for critical flows:

- Login.
- Tenant selection.
- Employee list.
- Employee creation.
- Employee profile permissions.
- Document upload flow with mocked signed URL.
- Leave request creation.
- Leave approval.
- Onboarding packet creation.
- Candidate-to-employee conversion.
- Report export request.

### API Mocking

Use MSW or a similar mock layer for frontend tests and mockups before backend endpoints exist.

Mock data should represent:

- Bolivia outsourcing company.
- HR admin.
- Manager.
- Employee.
- Recruiter.
- Finance viewer.
- Departments, locations, job titles.
- Employees with different statuses.
- Leave requests and balances.
- Documents with missing and expiring statuses.
- Onboarding packets.
- Job openings and candidates.

---

## Implementation Phases

### Frontend Phase 0: Scaffold

Goal:

- Create the Next.js app and core frontend foundation.

Tasks:

- Scaffold `apps/web`.
- Add TypeScript, Tailwind, shadcn/ui, Radix, lucide-react.
- Add Redux Toolkit and RTK Query.
- Add React Hook Form and Zod.
- Add next-intl.
- Add base app layout.
- Add placeholder route groups.
- Add basic test setup.

### Frontend Phase 1: App Shell And Mock Data

Goal:

- Build a navigable application shell with mock data.

Tasks:

- Auth layout.
- Authenticated app shell.
- Sidebar navigation.
- Tenant switcher placeholder.
- Permission-aware navigation.
- Mock API fixtures.
- Dashboard mock page.
- Employees mock list.
- Directory mock page.
- Leave mock overview.

### Frontend Phase 2: Platform Integration

Goal:

- Connect to existing backend Phase 1 endpoints.

Tasks:

- Supabase login.
- `GET /api/v1/me`.
- `GET /api/v1/tenants/current`.
- `GET /api/v1/audit-events`.
- Current tenant header handling.
- Authenticated route protection.
- Permission-aware UI wiring.

### Frontend Phase 3: Organization And Employees

Goal:

- Build the first real HR system-of-record screens.

Tasks:

- Organization settings screens.
- Employee list.
- Employee create/edit.
- Employee profile.
- Directory.
- Org chart shell.
- Import/export UI.

Depends on backend:

- Organization module.
- Employees module.
- Employee permissions and field visibility.

### Frontend Phase 4: Documents And Leave

Goal:

- Build document and PTO workflows.

Tasks:

- Documents home.
- Employee documents.
- Policy documents.
- Missing documents.
- Leave home.
- Leave requests.
- Leave balances.
- Leave calendar.
- Leave policies.
- Approval dashboard.

Depends on backend:

- Documents module.
- Leave module.
- Workflow/approvals module.
- Signed upload/download endpoints.

### Frontend Phase 5: Onboarding, Recruiting, Reports

Goal:

- Complete first release feature coverage.

Tasks:

- Onboarding templates.
- Onboarding packets.
- Recruiting jobs.
- Candidate pipeline.
- Public job pages.
- Reports home.
- Report detail/export flows.

Depends on backend:

- Onboarding module.
- Recruiting module.
- Reports/export module.

### Frontend Phase 6: Pilot Readiness

Goal:

- Prepare frontend for pilot customer use.

Tasks:

- Spanish/English coverage.
- Responsive polish.
- Empty/loading/error states.
- E2E tests for critical workflows.
- Accessibility review.
- Sentry integration.
- Permission edge case review.
- Production environment config.

---

## Backend Dependencies

Existing backend endpoints:

| Endpoint | Status |
|----------|--------|
| `GET /api/v1/health` | Implemented. |
| `GET /api/v1/me` | Implemented. |
| `GET /api/v1/tenants/current` | Implemented. |
| `GET /api/v1/audit-events` | Implemented. |

Important backend gaps before deep frontend integration:

- Real or mocked Supabase auth flow for frontend development.
- User invitations.
- Role management endpoints.
- Tenant update endpoint.
- Organization module.
- Employees module.
- Documents module.
- Leave module.
- Workflow/approvals module.
- Onboarding module.
- Recruiting module.
- Reports/export module.
- Notifications module.

Frontend can still start now by using mock data and implementing architecture, navigation, and page contracts first.

---

## First Mockup Priority

When UI mockups begin, create them in this order:

1. Authenticated app shell.
2. Dashboard.
3. Employee list.
4. Employee profile.
5. Employee create/edit.
6. Directory.
7. Leave overview.
8. Leave request form.
9. Documents home.
10. Onboarding overview.
11. Recruiting job pipeline.
12. Reports home.
13. Settings users and roles.

Reason:

- The app shell defines the product navigation.
- Employee records are the core system of record.
- Leave, documents, onboarding, recruiting, and reports build on the same data model and permission patterns.

---

## Open Questions

- Should frontend auth use Supabase directly from the browser for session creation, with the NestJS API only validating tokens?
- Should the frontend support tenant selection as a dedicated page, or automatically select the first available tenant?
- Should the first UI language be Spanish by default with English available from the user menu?
- Should manager and employee self-service use the same routes with permission-filtered content, or separate simplified routes?
- Should public job pages live inside the main `apps/web` app or later move to a separate marketing/careers surface?
- Should report exports be synchronous for small files first, or always use export jobs for consistency?

---

## Final Recommendation

Start the frontend now with the Next.js app shell, Redux Toolkit, RTK Query, reusable components, route structure, permission-aware navigation, i18n, and mock data. Do not wait for all backend phases to finish.

The frontend should first establish stable application architecture and page contracts. Real integration should begin with the current platform endpoints, then expand as the backend implements organization, employees, documents, leave, onboarding, recruiting, reports, and notifications.
