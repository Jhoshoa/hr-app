# Frontend Implementation Plan

> Execution plan for implementing the HR SaaS frontend from setup through initial UI pages and later completion phases.
>
> Based on:
>
> - `docs/frontend/frontend-planning-and-structure.md`
> - `docs/frontend/ui-views-list.md`
> - `docs/brainstorm/hr-saas-landscape.md`
> - `docs/stack/recommended-technology-stack.md`
>
> Created: May 13, 2026.

---

## Purpose

This document defines how the frontend should be implemented, starting from the empty `apps/web` placeholder and moving toward a complete HR SaaS web application.

The goal is to avoid building random pages. The frontend should be implemented in layers:

1. Project setup and architecture.
2. Design system foundation.
3. Authenticated app shell.
4. Mock-data product pages.
5. Backend integration with existing Phase 1 API.
6. Core HR pages.
7. Documents, leave, onboarding, recruiting, reports, and settings.
8. Pilot readiness.

This plan is about implementation order and engineering scope. It is not a visual design document.

---

## Product Direction

The app should compete with tools like BambooHR, HiBob, Zoho People, Factorial, and Personio in the core HR operations space, but it should be localized for Bolivia and Latin American service companies.

Frontend priorities:

- Make employee records easy to scan and update.
- Make manager and employee self-service simple.
- Make HR workflows visible: approvals, documents, onboarding, leave, recruiting.
- Support Spanish and English from the beginning.
- Support permission-aware UI from the beginning.
- Keep the app dense, clear, and operational rather than marketing-oriented.
- Use mock data first where backend modules are not ready.
- Integrate real APIs incrementally as backend phases are completed.

---

## Stack To Implement

| Area | Implementation Choice |
|------|-----------------------|
| Framework | Next.js App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui, Radix UI primitives, local app components |
| Icons | lucide-react |
| State | Redux Toolkit |
| API data | RTK Query |
| Forms | React Hook Form |
| Validation | Zod |
| Tables | TanStack Table |
| Charts | Recharts |
| Calendar | React Big Calendar first, FullCalendar later if needed |
| i18n | next-intl |
| Tests | Vitest, React Testing Library, Playwright |
| Mock API | MSW or local fixture adapters |

Note: the stack document originally recommends TanStack Query for data fetching. For this project, use **RTK Query** because Redux Toolkit was chosen as the state management approach.

---

## Implementation Principles

- Build route structure early, but keep pages shallow until their data contracts are clear.
- Build reusable layout and data components before creating many individual pages.
- Use mock fixtures for modules whose backend endpoints do not exist yet.
- Use real backend integration only for stable Phase 1 endpoints at first.
- Do not expose Prisma or backend database concepts directly in frontend types.
- Treat permissions as a first-class frontend concern, while still relying on backend enforcement.
- Keep sensitive fields hidden unless permission data says they can be shown.
- Keep pages responsive, but optimize first for desktop HR admin workflows.
- Avoid implementing payroll, benefits administration, AI, mobile app, and complex workflow builders in the first frontend release.

---

## Phase Overview

| Phase | Name | Outcome |
|-------|------|---------|
| 0 | Web App Setup | Next.js app exists and can run in the monorepo. |
| 1 | Frontend Foundation | UI, state, API, i18n, and test foundations exist. |
| 2 | App Shell And Mock Data | Authenticated shell and first mock pages are navigable. |
| 3 | Platform API Integration | Login/session/tenant/audit endpoints are integrated. |
| 4 | Core HR Pages | Organization, employee list, employee profile, directory are usable with mock or real APIs. |
| 5 | Leave And Documents | PTO and document workspaces are implemented. |
| 6 | Onboarding And Recruiting | New-hire and ATS workflows are implemented. |
| 7 | Reports And Settings | Reports, users, roles, permissions, audit, billing, localization pages are implemented. |
| 8 | Pilot Readiness | App is tested, polished, localized, and production-configurable. |

---

## Phase 0: Web App Setup

Goal:

- Create a runnable `apps/web` application inside the existing pnpm/Turborepo monorepo.

Tasks:

- Replace `apps/web/.gitkeep` with a Next.js App Router application.
- Add `apps/web/package.json`.
- Add `apps/web/tsconfig.json`.
- Add `apps/web/next.config.ts`.
- Add Tailwind config and PostCSS config.
- Add `app/layout.tsx`, `app/page.tsx`, `app/globals.css`.
- Add root `dev`, `build`, `typecheck`, `lint`, and `test` scripts for the web package.
- Ensure Turborepo can discover the web app.
- Add `.env.example` entries for frontend API and Supabase config.

Initial dependencies:

- `next`
- `react`
- `react-dom`
- `@reduxjs/toolkit`
- `react-redux`
- `@supabase/supabase-js`
- `zod`
- `react-hook-form`
- `@hookform/resolvers`
- `lucide-react`
- `next-intl`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `tailwindcss-animate`

Dev dependencies:

- `tailwindcss`
- `postcss`
- `autoprefixer`
- `vitest`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- `jsdom`
- `@playwright/test`

Definition of done:

- `corepack pnpm --filter @hr-app/web dev` starts the app.
- `corepack pnpm --filter @hr-app/web typecheck` passes.
- `corepack pnpm --filter @hr-app/web build` passes.
- The app shows a temporary home page.

---

## Phase 1: Frontend Foundation

Goal:

- Establish the architecture that every page will use.

Folder structure to create:

```text
apps/web/
  app/
    layout.tsx
    page.tsx
    providers.tsx
    globals.css
    (auth)/
    (app)/
    (public)/
  src/
    components/
      app-shell/
      data-display/
      forms/
      navigation/
      ui/
    config/
    features/
      api/
      auth/
      tenants/
    hooks/
    i18n/
    lib/
      api/
      auth/
      format/
    store/
    test/
    types/
```

Core implementation:

- Add Redux store setup.
- Add typed Redux hooks.
- Add RTK Query base API.
- Add API error normalization.
- Add tenant header support.
- Add Supabase browser client helper.
- Add app providers.
- Add `next-intl` configuration.
- Add base Spanish and English message files.
- Add formatting helpers for dates, names, currency, and percentages.
- Add permission helper functions.

Reusable components to implement first:

- `Button`
- `Input`
- `Label`
- `Select`
- `Badge`
- `Card`
- `Tabs`
- `DropdownMenu`
- `Dialog`
- `Table`
- `Skeleton`
- `EmptyState`
- `ErrorState`
- `PageHeader`
- `MetricCard`
- `StatusBadge`
- `PermissionGate`

Definition of done:

- Pages can use Redux and RTK Query.
- Pages can use translated strings.
- Components follow one visual direction and shared spacing rules.
- Permission-gated rendering can be tested.

---

## Phase 2: App Shell And Mock Data

Goal:

- Build a realistic navigable app before all backend endpoints exist.

Initial design direction:

- Use the latest desktop shell direction from `docs/frontend/designs`.
- Use a desktop-first operational SaaS layout.
- Include client/tenant identity in the shell.
- Use a clear sidebar with icons and labels.
- Keep navigation permission-aware.

Pages to implement in this phase:

1. Authenticated app shell.
2. Dashboard.
3. Employee list.
4. Employee profile.
5. Directory.
6. Leave overview.
7. Documents home.
8. Onboarding overview.
9. Recruiting job pipeline.
10. Reports home.
11. Settings users and roles.

Mock data to add:

- Tenant: Bolivia service company.
- Users: Owner, HR Admin, Manager, Employee, Recruiter, Finance Viewer.
- Departments: Engineering, People Ops, Finance, Operations, Talent.
- Locations: Cochabamba, Santa Cruz, La Paz, Remote.
- Employees with statuses and managers.
- Leave balances and requests.
- Documents with missing and expiring states.
- Onboarding packets and tasks.
- Job openings and candidates.
- Reports and audit examples.

Implementation tasks:

- Create `(app)/layout.tsx`.
- Create shell navigation config.
- Create `AppShell`, `SidebarNav`, `TopBar`, `TenantIdentity`, `UserMenu`.
- Add mock fixtures under `src/test/fixtures` or `src/features/*/fixtures`.
- Create mock RTK Query handlers or fixture-backed query hooks.
- Implement first pages using the real page routes but mock data.

Definition of done:

- The user can navigate across the initial pages.
- Each page has loading, empty, and error states.
- Navigation shows the app's core modules.
- The UI works at desktop and mobile widths, with desktop being primary.

---

## Phase 3: Platform API Integration

Goal:

- Connect the frontend to the backend Phase 1 endpoints that already exist.

Existing backend endpoints:

| Endpoint | Frontend Use |
|----------|--------------|
| `GET /api/v1/health` | API status check in development. |
| `GET /api/v1/me` | Current user and tenant list. |
| `GET /api/v1/tenants/current` | Current tenant details. |
| `GET /api/v1/audit-events` | Audit page initial integration. |

Pages/features to integrate:

- Login.
- App shell current user.
- Tenant identity.
- Tenant selection or auto tenant selection.
- Audit page under settings.

Implementation tasks:

- Add Supabase login page using Supabase browser SDK.
- Store session status in Redux.
- Add token retrieval in RTK Query base query.
- Add `x-tenant-slug` header for tenant-aware requests.
- Add `authApi` or `currentUserApi`.
- Add `tenantsApi`.
- Add `auditApi`.
- Implement session loading and redirect behavior.
- Add logout.
- Add route protection for `(app)`.
- Add development fallback for mock auth if real Supabase credentials are not available.

Decision needed:

- For local development, either use real Supabase credentials or support a mock authenticated mode until the auth flow is fully configured.

Definition of done:

- Login can authenticate against Supabase or a documented mock mode.
- `GET /api/v1/me` loads user and tenants.
- Current tenant is resolved.
- Authenticated API requests include token and tenant slug.
- Audit page can read real backend data.

---

## Phase 4: Core HR Pages

Goal:

- Build the core HRIS pages that define the product's value.

Primary pages:

1. Organization Settings.
2. Employee List.
3. New Employee.
4. Employee Profile.
5. Employee Job.
6. Employee Compensation.
7. Employee History.
8. Directory.
9. Org Chart.

Backend dependency:

- Organization module.
- Employees module.
- Employee field permissions.
- Employee import/export endpoints.

If backend is not ready:

- Keep pages on mock data.
- Implement UI, forms, tables, and state contracts.
- Leave API integration behind RTK Query endpoints that can swap from fixtures to REST calls.

Implementation tasks:

- Build `DataTable` with server-style pagination/filter props.
- Build employee filters.
- Build employee summary components.
- Build employee form with React Hook Form and Zod.
- Build profile tabs.
- Build field-level permission rendering.
- Build organization lookup components: department, location, job title, manager.
- Build CSV import/export UI placeholders.

Definition of done:

- HR admin can browse employees.
- HR admin can open a profile.
- HR admin can create/edit employee in UI.
- Sensitive sections are permission-gated.
- Directory shows only public fields.

---

## Phase 5: Documents And Leave

Goal:

- Implement the two most important operational workflows after employee records.

Documents pages:

- Documents Home.
- Employee Documents.
- Policies.
- Missing Documents.

Leave pages:

- Leave Home.
- Leave Request Form.
- Leave Requests.
- Leave Balances.
- Leave Calendar.
- Leave Policies.
- Approvals.

Backend dependency:

- Documents module.
- Signed upload/download endpoints.
- Leave module.
- Workflow/approvals module.

Implementation tasks:

- Build file upload UI.
- Add signed upload/download flow abstraction.
- Build document status components.
- Build missing document report table.
- Build leave balance cards.
- Build leave request form.
- Build approval actions.
- Build calendar view.
- Build leave policy forms.

Definition of done:

- Users can create leave requests in UI.
- Managers can review requests in UI.
- HR can inspect balances and missing documents.
- Document upload flow is ready to wire to signed URLs.

---

## Phase 6: Onboarding And Recruiting

Goal:

- Implement BambooHR Core-like onboarding and lightweight ATS workflows.

Onboarding pages:

- Onboarding Home.
- Onboarding Templates.
- Onboarding Packets.
- Onboarding Packet Detail.

Recruiting pages:

- Recruiting Home.
- Job Openings.
- New Job Opening.
- Job Detail And Pipeline.
- Candidates.
- Candidate Detail.
- Public Careers Page.
- Public Job Detail.
- Public Job Application.

Backend dependency:

- Onboarding module.
- Recruiting module.
- Public job endpoints.
- Candidate document upload endpoints.

Implementation tasks:

- Build task list and ownership UI.
- Build onboarding progress UI.
- Build onboarding template builder without complex workflow builder.
- Build candidate pipeline.
- Build job opening forms.
- Build public job pages.
- Build candidate application form.
- Build candidate-to-employee action UI.

Definition of done:

- HR can manage onboarding templates and packets in UI.
- Recruiter can manage jobs and candidates in UI.
- Public candidate flow exists.

---

## Phase 7: Reports And Settings

Goal:

- Complete administrative and reporting surfaces required for pilot readiness.

Reports pages:

- Reports Home.
- Report Detail.

Settings pages:

- Settings Home.
- Company Settings.
- Users.
- Roles.
- Permissions.
- Audit.
- Localization.
- Billing.

Backend dependency:

- Reports endpoints.
- Export job endpoints.
- User invitation endpoints.
- Role and permission endpoints.
- Tenant update endpoint.
- Billing read endpoints.

Implementation tasks:

- Build report catalog.
- Build report filter panel.
- Build CSV/XLSX export request UI.
- Build export job status UI.
- Build users table.
- Build invite user form.
- Build role editor.
- Build permission assignment UI.
- Build tenant settings form.
- Build localization form.
- Build billing usage summary.

Definition of done:

- Admin can manage tenant settings and users.
- Admin can review audit events.
- HR can open reports and request exports.
- Settings are organized and permission-aware.

---

## Phase 8: Pilot Readiness

Goal:

- Make the frontend reliable enough for a first pilot.

Tasks:

- Complete Spanish and English translations for implemented screens.
- Add responsive checks for desktop, tablet, and mobile.
- Add accessibility review for forms, dialogs, tables, keyboard navigation.
- Add Playwright smoke tests.
- Add component tests for reusable components.
- Add permission edge case tests.
- Add Sentry integration.
- Add production environment config.
- Add Vercel deployment config if needed.
- Verify no secrets are committed.
- Verify no direct database or storage access bypasses backend authorization.

Critical Playwright flows:

- Login.
- Tenant loading.
- Dashboard loads.
- Employee list loads.
- Employee profile opens.
- Leave request form validates.
- Documents page loads.
- Onboarding page loads.
- Recruiting page loads.
- Reports page loads.
- Settings users page loads.

Definition of done:

- Build passes.
- Typecheck passes.
- Core tests pass.
- Main flows are smoke-tested.
- App is ready for real pilot API integration.

---

## Initial Implementation Order

Start with this exact sequence:

1. Scaffold `apps/web`.
2. Add Tailwind and base styling.
3. Add Redux Toolkit and RTK Query base setup.
4. Add app providers.
5. Add route groups: `(auth)`, `(app)`, `(public)`.
6. Add reusable UI primitives.
7. Add app shell with sidebar, top bar, tenant identity, and user menu.
8. Add mock fixtures.
9. Add dashboard page.
10. Add employee list page.
11. Add employee profile page.
12. Add leave overview and leave request form.
13. Add documents home.
14. Add settings users and roles page.
15. Add Supabase login and `GET /api/v1/me` integration.

Reason:

- The app shell and data patterns must be stable before many pages are added.
- Employee records are the core HRIS foundation.
- Leave and documents prove the main self-service/admin workflows.
- Settings/users/roles prove the permission model.

---

## First Implementation Slice

The first coding slice should be small but complete.

Scope:

- Next.js app scaffold.
- Tailwind setup.
- Redux store.
- RTK Query base API.
- App shell.
- Dashboard mock page.
- Employee list mock page.

Do not include yet:

- Supabase auth.
- Full employee forms.
- File uploads.
- Calendar library.
- Reports exports.
- Public job pages.

Definition of done:

- The app runs locally.
- The user can navigate from dashboard to employees.
- The shell has tenant identity and module navigation.
- Mock data renders through reusable components.
- Typecheck and build pass.

---

## API Strategy During Frontend Build

Use three API modes:

### Mode 1: Fixtures

Used for:

- Pages whose backend modules do not exist yet.
- UI mock development.
- Component tests.

### Mode 2: Mock Handlers

Used for:

- E2E tests before backend endpoints are complete.
- Simulating loading/error/empty states.

### Mode 3: Real API

Used for:

- `GET /api/v1/me`.
- `GET /api/v1/tenants/current`.
- `GET /api/v1/audit-events`.
- Future completed backend modules.

RTK Query should hide which mode is active from page components. Pages should call feature hooks and receive data; they should not care whether the data is fixture-backed or REST-backed.

---

## Page Completion Priority

### Priority 1: Foundation Pages

- Login.
- App Shell.
- Dashboard.
- Employee List.
- Employee Profile.
- Directory.
- Settings Users.
- Settings Roles.
- Settings Audit.

### Priority 2: Core Workflow Pages

- New Employee.
- Employee Job.
- Employee Documents.
- Leave Home.
- Leave Request Form.
- Leave Requests.
- Documents Home.
- Missing Documents.

### Priority 3: Growth Workflow Pages

- Onboarding Home.
- Onboarding Templates.
- Onboarding Packet Detail.
- Recruiting Home.
- Job Openings.
- Job Detail And Pipeline.
- Candidate Detail.
- Reports Home.

### Priority 4: Completion Pages

- Employee Compensation.
- Employee Leave.
- Employee History.
- Org Chart.
- Leave Balances.
- Leave Calendar.
- Leave Policies.
- Policies.
- Onboarding Packets.
- Candidates.
- Public Careers Page.
- Public Job Detail.
- Public Job Application.
- Report Detail.
- Notifications.
- Company Settings.
- Permissions.
- Localization.
- Billing.

---

## Risks And Mitigations

| Risk | Mitigation |
|------|------------|
| Frontend blocks on backend gaps | Use fixture-backed RTK Query and swap to REST as endpoints land. |
| Too many pages before reusable components | Build shell, table, form, state, and status components first. |
| Permissions become inconsistent | Centralize permission helpers and use `PermissionGate`. |
| Mock data drifts from backend contracts | Keep feature API types close to planned REST DTOs and update when backend endpoints land. |
| UI becomes too Bamboo-like | Use the internal design concepts as direction, not copies. |
| Reports and exports become complex early | Implement report shells and export request UI; defer heavy export behavior until backend jobs exist. |
| i18n added too late | Add `next-intl` in Phase 1, even if translations are incomplete. |

---

## Open Decisions Before Coding

- Should local frontend development require real Supabase credentials, or should mock auth be supported?
- Should tenant selection be a dedicated page or auto-select the first tenant?
- Should the sidebar use the latest expanded rail concept from `docs/frontend/designs`?
- Should mock data live under `src/test/fixtures` or under each `src/features/*` folder?
- Should we add shadcn/ui through its CLI or manually create local primitives first?
- Should public job pages be built in the first frontend milestone or deferred until recruiting backend exists?

---

## Recommended Next Step

Begin with **Phase 0 and the first implementation slice**:

1. Scaffold `apps/web`.
2. Add Tailwind.
3. Add Redux Toolkit and RTK Query.
4. Add the app shell.
5. Add dashboard and employee list using mock data.

This gives the project a working frontend foundation without waiting for later backend modules. After that, integrate the existing Phase 1 backend endpoints and expand toward employee profile, leave, documents, and settings.
