# Backend Planning And Project Structure

> Backend implementation plan for the HR SaaS based on:
>
> - `docs/first-approach/hr-saas-first-approach.md`
> - `docs/stack/recommended-technology-stack.md`
> - `docs/stack/production-cost-analysis.md`
> - NestJS best-practices skill: `.agents/skills/nestjs-best-practices`
>
> Created: May 12, 2026.

---

## Stack Decisions

The backend will be implemented as a **NestJS modular monolith** using clean architecture boundaries.

Selected stack:

| Area | Decision |
|------|----------|
| Monorepo | pnpm workspaces + Turborepo |
| Backend | NestJS + TypeScript |
| Frontend | Next.js + React + TypeScript |
| Future mobile | React Native / Expo, inside same repo later |
| API | REST first, OpenAPI docs |
| ORM | Prisma |
| Local DB | PostgreSQL in Docker |
| Production DB | Supabase Postgres |
| Auth | Supabase Auth first, behind internal auth provider abstraction |
| Authorization | Application-owned RBAC and field permissions |
| Storage | Supabase Storage first, behind internal object storage abstraction |
| Email | Resend first, behind internal email provider abstraction |
| Background jobs | None at first; BullMQ + Redis later |
| Testing | Jest, Supertest, Testcontainers or Docker Postgres, Playwright later |

Key architectural decision:

> The first version is one deployable backend application with strong internal module boundaries. Do not build microservices yet.

---

## NestJS Best-Practices Applied

The installed NestJS skill recommends these rules, which this plan applies:

- Organize by feature modules, not technical layers.
- Avoid circular module dependencies.
- Keep services focused and avoid god services.
- Use repository pattern to keep Prisma/database logic out of business services.
- Use constructor injection.
- Use injection tokens or abstract classes for replaceable providers.
- Use guards for authentication and authorization.
- Validate all input with DTOs and validation pipes.
- Use exception filters for consistent errors.
- Use migrations for schema changes.
- Use transactions for multi-write business operations.
- Use events to decouple modules.
- Mock external services in tests.

---

## Whole Project Folder Structure

The repo should support backend, frontend, shared packages, infrastructure, docs, and future mobile without needing a repo split.

Recommended top-level structure:

```text
hr-app/
  apps/
    api/
    web/
    mobile/
  packages/
    config/
    database/
    eslint-config/
    types/
    ui/
    utils/
  docker/
  infra/
  scripts/
  docs/
    backend/
    brainstorm/
    first-approach/
    stack/
  .github/
    workflows/
  .agents/
    skills/
  package.json
  pnpm-workspace.yaml
  turbo.json
  tsconfig.base.json
  .env.example
  README.md
```

### Folder Responsibilities

| Folder | Purpose |
|--------|---------|
| `apps/api` | NestJS backend application. |
| `apps/web` | Next.js web application. |
| `apps/mobile` | Future mobile app. Keep empty or absent until needed. |
| `packages/config` | Shared config helpers and environment schemas if needed. |
| `packages/database` | Prisma schema, migrations, seed scripts, generated client wrapper. |
| `packages/types` | Shared TypeScript types that are safe to share across apps. |
| `packages/ui` | Shared frontend UI components for web/mobile later. |
| `packages/utils` | Small shared utilities with no product business logic. |
| `docker` | Local Docker Compose files for Postgres, Redis later, MinIO if needed. |
| `infra` | Deployment/IaC notes or Terraform/Pulumi later. |
| `scripts` | Repo automation scripts. |
| `docs` | Product, architecture, planning, and stack documentation. |

Important rule:

> Do not put backend business logic in `packages/*`. Business rules belong in `apps/api/src/modules/*`.

Shared packages should stay boring and stable.

---

## Backend Folder Structure

The backend should use clean architecture inside each feature module.

Recommended structure:

```text
apps/api/
  src/
    main.ts
    app.module.ts
    common/
      constants/
      decorators/
      errors/
      filters/
      guards/
      interceptors/
      middleware/
      pagination/
      pipes/
      types/
    config/
      app-config.module.ts
      env.schema.ts
      configuration.ts
    database/
      prisma/
        prisma.module.ts
        prisma.service.ts
        prisma-transaction.ts
      repositories/
        base.repository.ts
    events/
      domain-event.interface.ts
      event-bus.module.ts
      event-bus.port.ts
      in-memory-event-bus.adapter.ts
    modules/
      identity/
      tenants/
      organization/
      employees/
      documents/
      leave/
      workflows/
      onboarding/
      recruiting/
      reports/
      notifications/
      audit/
      integrations/
      billing/
    health/
      health.controller.ts
      health.module.ts
    bootstrap/
      seed-dev-data.ts
  test/
    setup-e2e.ts
    factories/
    fixtures/
    helpers/
  nest-cli.json
  package.json
  tsconfig.json
  tsconfig.build.json
```

### Standard Module Structure

Each feature module should follow this pattern:

```text
modules/<module-name>/
  <module-name>.module.ts
  application/
    commands/
    queries/
    services/
    use-cases/
  domain/
    entities/
    events/
    policies/
    value-objects/
    ports/
  infrastructure/
    persistence/
      prisma-<entity>.repository.ts
    providers/
  presentation/
    controllers/
    dto/
    serializers/
  tests/
    unit/
    integration/
```

Use this structure for complex modules like employees, leave, documents, onboarding, recruiting, identity, and workflows.

For small modules, it is acceptable to start simpler:

```text
modules/audit/
  audit.module.ts
  application/
  infrastructure/
  presentation/
```

But avoid dumping everything into one `audit.service.ts` forever.

---

## Clean Architecture Layers

### Presentation Layer

Owns:

- REST controllers.
- Request DTOs.
- Response DTOs / serializers.
- Route-level decorators.
- Swagger/OpenAPI annotations.

Should not contain:

- Business rules.
- Prisma queries.
- Tenant permission logic beyond declarative guards/decorators.

Example:

```text
presentation/
  controllers/employees.controller.ts
  dto/create-employee.dto.ts
  dto/update-employee.dto.ts
  serializers/employee-response.dto.ts
```

### Application Layer

Owns:

- Use cases.
- Application services.
- Transaction orchestration.
- Calls to repositories and domain policies.
- Publishing domain events.

Should not contain:

- Raw Prisma client calls.
- HTTP-specific request/response details.
- Vendor SDK details.

Example:

```text
application/
  use-cases/create-employee.use-case.ts
  use-cases/update-employee-profile.use-case.ts
  use-cases/import-employees.use-case.ts
  services/employee-permissions.service.ts
```

### Domain Layer

Owns:

- Business entities.
- Value objects.
- Domain policies.
- Domain events.
- Repository/provider ports.
- Business invariants.

Should not depend on:

- NestJS.
- Prisma.
- Supabase.
- Resend.
- Storage SDKs.

Example:

```text
domain/
  entities/employee.entity.ts
  value-objects/employment-status.vo.ts
  policies/can-view-employee.policy.ts
  events/employee-created.event.ts
  ports/employees.repository.port.ts
```

### Infrastructure Layer

Owns:

- Prisma repository implementations.
- Supabase Auth adapter.
- Supabase Storage adapter.
- Resend email adapter.
- External integrations.
- Queue adapters later.

Should not contain:

- Core HR business rules.

Example:

```text
infrastructure/
  persistence/prisma-employees.repository.ts
  providers/supabase-auth.provider.ts
  providers/resend-email.provider.ts
```

---

## Provider Abstraction Rules

Every replaceable external service must be behind an internal interface/port.

Use symbols or abstract classes as injection tokens because TypeScript interfaces do not exist at runtime.

Required provider ports:

```text
AuthProvider
- verifyAccessToken(token)
- getExternalUser(externalUserId)
- inviteUser(email, tenantId)
- disableUser(externalUserId)

ObjectStorageProvider
- createSignedUploadUrl(input)
- createSignedDownloadUrl(input)
- deleteObject(input)
- getObjectMetadata(input)

EmailProvider
- sendTransactionalEmail(input)
- sendTemplateEmail(input)

EventBus
- publish(event)
- publishMany(events)

JobQueue
- enqueue(job)
- schedule(job)
```

Initial implementations:

| Port | First Implementation | Future Replacements |
|------|----------------------|---------------------|
| AuthProvider | Supabase Auth | Clerk, WorkOS, Auth0, app-owned auth |
| ObjectStorageProvider | Supabase Storage | S3, R2, MinIO |
| EmailProvider | Resend | SES, Postmark, SendGrid |
| EventBus | In-process event bus | BullMQ, SQS, EventBridge |
| JobQueue | No-op or in-process | BullMQ + Redis, SQS |

---

## Backend Modules

### 1. Identity Module

Purpose:

- Authenticate requests.
- Resolve external auth users to internal users.
- Manage tenant memberships.
- Expose current-user context.

Owns:

- Internal `User`.
- Auth provider mapping.
- Tenant memberships.
- Session/user context resolution.
- Auth guards.

Does not own:

- Employee HR profile data.

Key files:

```text
modules/identity/
  identity.module.ts
  domain/
    entities/user.entity.ts
    entities/tenant-membership.entity.ts
    ports/auth-provider.port.ts
  application/
    use-cases/invite-user.use-case.ts
    use-cases/resolve-authenticated-user.use-case.ts
  infrastructure/
    providers/supabase-auth.provider.ts
    persistence/prisma-users.repository.ts
  presentation/
    controllers/me.controller.ts
```

### 2. Tenants Module

Purpose:

- Manage customer companies as tenants.
- Store tenant-level settings and plan limits.

Owns:

- Tenant.
- Tenant settings.
- Plan limits.

### 3. Organization Module

Purpose:

- Company structure and configuration.

Owns:

- Departments.
- Locations.
- Job titles.
- Employment types.
- Work modes.
- Holiday calendars.
- Client/project references.

### 4. Employees Module

Purpose:

- Core HR employee system of record.

Owns:

- Employee profile.
- Employment status.
- Job assignment.
- Manager relationship.
- Compensation records.
- Custom fields.
- Employee import/export.

### 5. Documents Module

Purpose:

- Store employee and company document metadata.
- Manage signed uploads/downloads.
- Track acknowledgements and expiration.

Owns:

- Documents.
- Document categories.
- Acknowledgements.
- Document access audit events.

Does not own:

- Raw file storage provider implementation details outside its storage adapter.

### 6. Leave Module

Purpose:

- PTO and absence management.

Owns:

- Leave types.
- Leave policies.
- Accrual rules.
- Leave balances.
- Balance transactions.
- Leave requests.
- Leave approval actions.

### 7. Workflows Module

Purpose:

- Generic approval infrastructure.

Owns:

- Workflow definitions.
- Approval steps.
- Approval requests.
- Approval actions.

Important:

- Workflows must not own module-specific business state.
- Leave owns leave requests; workflows can own approval state and history.

### 8. Onboarding Module

Purpose:

- New-hire checklists and task tracking.

Owns:

- Onboarding templates.
- Onboarding packets.
- Onboarding tasks.
- Required documents checklist.

### 9. Recruiting Module

Purpose:

- Lightweight ATS.

Owns:

- Job openings.
- Candidate records.
- Candidate stages.
- Interview notes.
- Offer templates.
- Candidate-to-employee conversion trigger.

### 10. Reports Module

Purpose:

- Dashboard and report read models.

Owns:

- Report definitions.
- Saved filters.
- Export jobs.

Does not own:

- Source-of-truth writes.

### 11. Notifications Module

Purpose:

- In-app and email notifications.

Owns:

- Notification records.
- Email templates.
- Delivery status.

Uses:

- EmailProvider port.
- EventBus subscriptions.

### 12. Audit Module

Purpose:

- Append-only audit logs.

Owns:

- Audit events.
- Sensitive action history.
- Document access events.

Important:

- Other modules publish audit events.
- Audit records should not be edited after creation.

### 13. Integrations Module

Purpose:

- Future external integrations.

Initial scope:

- Keep module placeholder only.
- Do not implement integrations until core modules are stable.

### 14. Billing Module

Purpose:

- Tenant plan and subscription tracking.

Initial scope:

- Plan metadata and limits.
- Manual subscription state.

Later:

- Stripe or local billing integration.

---

## Core Database Entities

These are the first-pass entities for Prisma/PostgreSQL. They will be refined when creating the Prisma schema.

### Identity And Tenancy

| Entity | Key Fields |
|--------|------------|
| Tenant | id, name, slug, status, defaultLanguage, defaultCurrency, timezone, createdAt |
| User | id, email, name, status, externalAuthProvider, externalAuthUserId, createdAt |
| TenantMembership | id, tenantId, userId, roleId, status, invitedAt, joinedAt |
| Role | id, tenantId, key, name, isSystemRole |
| Permission | id, key, description |
| RolePermission | roleId, permissionId |

### Organization

| Entity | Key Fields |
|--------|------------|
| Department | id, tenantId, name, parentDepartmentId, status |
| Location | id, tenantId, name, country, city, timezone, status |
| JobTitle | id, tenantId, name, level, status |
| EmploymentType | id, tenantId, name, category, status |
| WorkMode | id, tenantId, name, type |
| ClientProject | id, tenantId, name, code, status |
| HolidayCalendar | id, tenantId, name, country, locationId |
| Holiday | id, tenantId, calendarId, name, date, isRecurring |

### Employees

| Entity | Key Fields |
|--------|------------|
| Employee | id, tenantId, userId, employeeNumber, status, firstName, lastName, workEmail, personalEmail, startDate, terminationDate |
| EmployeeProfile | employeeId, birthDate, phone, address, emergencyContactName, emergencyContactPhone |
| EmployeeJobAssignment | id, tenantId, employeeId, departmentId, jobTitleId, locationId, employmentTypeId, workModeId, effectiveFrom, effectiveTo |
| ManagerRelationship | id, tenantId, employeeId, managerEmployeeId, effectiveFrom, effectiveTo |
| CompensationRecord | id, tenantId, employeeId, amount, currency, frequency, effectiveFrom, effectiveTo, visibility |
| EmployeeCustomFieldDefinition | id, tenantId, key, label, type, isRequired, visibility |
| EmployeeCustomFieldValue | id, tenantId, employeeId, fieldDefinitionId, value |
| ClientAssignment | id, tenantId, employeeId, clientProjectId, role, startDate, endDate |

### Documents

| Entity | Key Fields |
|--------|------------|
| DocumentCategory | id, tenantId, name, appliesTo, requiresAcknowledgement |
| Document | id, tenantId, employeeId, categoryId, name, storageProvider, bucket, objectKey, mimeType, size, checksum, expiresAt, uploadedByUserId |
| DocumentAcknowledgement | id, tenantId, documentId, employeeId, acknowledgedAt, userId |
| DocumentAccessLog | id, tenantId, documentId, userId, action, ipAddress, createdAt |

### Leave

| Entity | Key Fields |
|--------|------------|
| LeaveType | id, tenantId, name, code, isPaid, status |
| LeavePolicy | id, tenantId, leaveTypeId, name, accrualMethod, annualAllowance, carryoverLimit, requiresApproval |
| EmployeeLeavePolicy | id, tenantId, employeeId, leavePolicyId, effectiveFrom, effectiveTo |
| LeaveBalance | id, tenantId, employeeId, leaveTypeId, currentBalance, asOfDate |
| LeaveBalanceTransaction | id, tenantId, employeeId, leaveTypeId, amount, reason, sourceType, sourceId, createdByUserId |
| LeaveRequest | id, tenantId, employeeId, leaveTypeId, startDate, endDate, duration, reason, status |
| LeaveRequestAction | id, tenantId, leaveRequestId, action, actorUserId, comment, createdAt |

### Workflows

| Entity | Key Fields |
|--------|------------|
| WorkflowDefinition | id, tenantId, key, name, requestType, isActive |
| ApprovalStep | id, tenantId, workflowDefinitionId, order, approverType, approverRoleId |
| ApprovalRequest | id, tenantId, workflowDefinitionId, sourceType, sourceId, status, requestedByUserId |
| ApprovalAction | id, tenantId, approvalRequestId, stepId, action, actorUserId, comment |

### Onboarding

| Entity | Key Fields |
|--------|------------|
| OnboardingTemplate | id, tenantId, name, departmentId, jobTitleId, locationId, workModeId, isActive |
| OnboardingTemplateTask | id, tenantId, templateId, title, description, ownerType, dueOffsetDays |
| OnboardingPacket | id, tenantId, employeeId, templateId, status, startDate |
| OnboardingTask | id, tenantId, packetId, title, description, ownerUserId, ownerType, dueDate, status |

### Recruiting

| Entity | Key Fields |
|--------|------------|
| JobOpening | id, tenantId, title, departmentId, locationId, status, publicSlug, description |
| Candidate | id, tenantId, jobOpeningId, firstName, lastName, email, phone, source, status |
| CandidateDocument | id, tenantId, candidateId, documentId, type |
| CandidateStage | id, tenantId, jobOpeningId, name, order |
| CandidateStageHistory | id, tenantId, candidateId, fromStageId, toStageId, changedByUserId |
| InterviewNote | id, tenantId, candidateId, authorUserId, note, createdAt |
| OfferTemplate | id, tenantId, name, content, language |

### Reports, Notifications, Audit, Billing

| Entity | Key Fields |
|--------|------------|
| SavedReport | id, tenantId, name, reportType, filters, columns, createdByUserId |
| ExportJob | id, tenantId, reportType, status, storageObjectKey, requestedByUserId |
| Notification | id, tenantId, userId, type, title, body, readAt |
| EmailDelivery | id, tenantId, provider, templateKey, recipient, status, providerMessageId |
| AuditEvent | id, tenantId, actorUserId, action, resourceType, resourceId, metadata, ipAddress, createdAt |
| BillingPlan | id, key, name, monthlyBasePrice, perEmployeePrice, limits |
| Subscription | id, tenantId, billingPlanId, status, startedAt, endedAt |

---

## API Design Standards

Use REST with versioned routes:

```text
/api/v1/me
/api/v1/tenants
/api/v1/employees
/api/v1/departments
/api/v1/documents
/api/v1/leave-requests
/api/v1/onboarding-templates
/api/v1/job-openings
/api/v1/reports
```

Standards:

- Use DTOs for every request body.
- Use response DTOs/serializers for every response that exposes HR data.
- Use pagination for list endpoints.
- Use filtering and sorting consistently.
- Use OpenAPI decorators.
- Use global validation pipe.
- Use consistent error shape.
- Do not expose Prisma models directly.

Recommended response error shape:

```json
{
  "error": {
    "code": "EMPLOYEE_NOT_FOUND",
    "message": "Employee was not found.",
    "details": {}
  }
}
```

---

## Security Standards

Required from Phase 1:

- Global auth guard.
- `@Public()` decorator for public endpoints only.
- Tenant guard to require tenant context for tenant-owned resources.
- Role/permission guards.
- Field-level authorization service for sensitive employee fields.
- Input validation on all DTOs.
- Rate limiting on auth-sensitive endpoints.
- Audit events for sensitive actions.
- Signed URLs for document access.
- No direct Supabase table access from frontend.
- No permanent public document URLs.
- No business authorization in Supabase Auth alone.

Sensitive fields:

- Compensation.
- Personal identifiers.
- Emergency contacts.
- Private documents.
- Termination data.
- Private HR notes.

---

## Testing Structure

### Backend Test Folder Structure

```text
apps/api/
  src/
    modules/
      employees/
        tests/
          unit/
          integration/
      leave/
        tests/
          unit/
          integration/
  test/
    e2e/
      auth.e2e-spec.ts
      employees.e2e-spec.ts
      leave.e2e-spec.ts
      documents.e2e-spec.ts
    factories/
      tenant.factory.ts
      user.factory.ts
      employee.factory.ts
    fixtures/
      bolivia-company.fixture.ts
    helpers/
      auth-test.helper.ts
      database-test.helper.ts
```

### Test Types

| Test Type | Purpose |
|-----------|---------|
| Unit tests | Domain policies, use cases, value objects. |
| Integration tests | Repositories, Prisma queries, transactions. |
| E2E tests | API behavior through Nest app + test database. |
| Contract tests later | Provider adapters like Supabase Auth, Storage, Resend. |

### Critical Backend Tests

Phase 1 critical tests:

- User resolves from Supabase external identity.
- Tenant membership controls access.
- User cannot access another tenant.
- Role permissions are enforced.
- Employee can be created.
- Employee list is tenant-scoped.
- Sensitive fields are hidden without permission.
- Audit events are written for sensitive changes.

Phase 2 critical tests:

- Document upload creates metadata.
- Signed download requires permission.
- Document access is audited.
- Employee directory respects field visibility.

Phase 3 critical tests:

- Leave policy creates balances.
- Leave request approval updates status.
- Balance transaction is created.
- Manager can approve direct report leave.
- Non-manager cannot approve.

---

## Implementation Phases

### Phase 0: Repository And Tooling Foundation

Goal: create a working monorepo foundation.

Tasks:

- Create pnpm workspace.
- Add Turborepo.
- Add `apps/api`.
- Add `apps/web` placeholder or scaffold.
- Add `packages/database`.
- Add Docker Compose for local Postgres.
- Add shared TypeScript config.
- Add ESLint/Prettier.
- Add `.env.example`.
- Add GitHub Actions for lint/test later.

Backend output:

- NestJS app starts.
- Health endpoint works.
- Prisma connects to local Postgres.

### Phase 1: Platform Foundation

Goal: create secure multi-tenant foundation.

Tasks:

- Prisma schema base setup.
- Tenants module.
- Identity module.
- Supabase Auth provider adapter.
- Internal users and tenant memberships.
- RBAC roles and permissions.
- Global auth guard.
- Tenant context guard.
- Permission guard.
- Audit module.
- Seed data for one Bolivia company.

Deliverables:

- User can authenticate.
- API resolves tenant membership.
- Protected routes enforce tenant and role access.
- Audit events can be written.

### Phase 2: Organization And Employee Core

Goal: create the HR system of record.

Tasks:

- Organization module: departments, locations, job titles, employment types, work modes.
- Employees module.
- Employee profile CRUD.
- Employee job assignment.
- Manager relationship.
- Compensation record with permissions.
- Custom field definitions and values.
- CSV import/export foundation.
- Employee list filters.

Deliverables:

- HR admin can create and update employees.
- Managers can view team members.
- Employees can view their own profile.
- Sensitive fields respect permissions.

### Phase 3: Documents

Goal: centralize employee and company documents.

Tasks:

- Documents module.
- Supabase Storage provider adapter.
- Document categories.
- Signed upload/download URLs.
- Employee document metadata.
- Company policy documents.
- Document acknowledgements.
- Expiration dates.
- Missing document report.
- Document access audit.

Deliverables:

- HR can upload documents.
- Employees can acknowledge policies.
- Users only access documents they are allowed to see.

### Phase 4: Leave And Approval Workflows

Goal: replace PTO spreadsheets and chat approvals.

Tasks:

- Leave module.
- Leave types.
- Leave policies.
- Leave balances and balance transactions.
- Leave requests.
- Manager approvals.
- HR override.
- Team time-off calendar API.
- Workflow module minimal approval infrastructure.

Deliverables:

- Employees request PTO.
- Managers approve/reject.
- HR can adjust balances.
- Leave reports are available.

### Phase 5: Onboarding

Goal: make new-hire setup repeatable.

Tasks:

- Onboarding module.
- Templates.
- Template tasks.
- Onboarding packets.
- Assigned tasks.
- Required documents.
- Progress dashboard API.
- Notifications for task reminders.

Deliverables:

- HR can create onboarding templates.
- HR can start onboarding for an employee.
- Task owners can complete tasks.

### Phase 6: Lightweight Recruiting

Goal: provide BambooHR Core-like lightweight ATS.

Tasks:

- Recruiting module.
- Job openings.
- Public job page API.
- Candidate records.
- Candidate stages.
- Candidate documents.
- Interview notes.
- Email templates.
- Offer templates.
- Candidate-to-employee conversion.

Deliverables:

- HR can manage job openings and candidates.
- Candidate can be converted into employee.

### Phase 7: Reports And Exports

Goal: provide HR visibility.

Tasks:

- Reports module.
- Headcount reports.
- Employee status reports.
- Missing document reports.
- Leave reports.
- Onboarding reports.
- Candidate pipeline reports.
- CSV/XLSX exports.

Deliverables:

- HR can export core data.
- Dashboard APIs support web app views.

### Phase 8: Notifications And Background Jobs

Goal: automate reminders and communication.

Tasks:

- Notifications module.
- Resend email provider.
- In-app notifications.
- Email templates.
- Add Redis + BullMQ if needed.
- Reminder jobs.
- Export jobs.

Deliverables:

- Users receive email/in-app notifications.
- Reminder flows work.

### Phase 9: Production Hardening

Goal: prepare for pilot.

Tasks:

- Security review.
- Tenant isolation test suite.
- Field-level permission tests.
- Rate limiting.
- Request logging with Pino.
- Sentry integration.
- OpenAPI docs.
- Backup/restore procedure.
- Seed/migration verification.
- Basic load testing.

Deliverables:

- Backend is ready for first pilot customer.

---

## First Implementation Order

Start with this exact order:

1. Monorepo foundation.
2. NestJS API scaffold.
3. Prisma + local Postgres.
4. Config module and environment validation.
5. Health endpoint.
6. Tenants schema and module.
7. Identity schema and module.
8. Supabase Auth provider abstraction.
9. RBAC and tenant guards.
10. Audit module.
11. Organization module.
12. Employees module.

Reason:

- Every later module needs tenant isolation, identity, permissions, and audit.
- Building leave/documents/onboarding before this foundation would create rework.

---

## Definition Of Done For Backend Phases

A backend phase is done only when:

- Prisma migration exists.
- Module follows clean architecture folder structure.
- DTO validation exists.
- Permissions are enforced.
- Tenant isolation is tested.
- Unit tests cover domain rules.
- Integration tests cover repositories.
- E2E tests cover core API flow.
- OpenAPI docs are updated.
- Audit events are added for sensitive actions.
- Errors use consistent error codes.
- No module reaches directly into another module's database tables without an application service or repository boundary.

---

## Main Risks

| Risk | Mitigation |
|------|------------|
| Modules become tangled | Use feature modules, ports, events, and avoid circular imports. |
| Supabase lock-in | Keep Supabase behind AuthProvider and use Prisma/Postgres for DB access. |
| Security gaps | Build guards, RBAC, field permissions, and audit from Phase 1. |
| HR permissions become complex | Centralize authorization policies and test them heavily. |
| Prisma models leak into API | Use response DTOs/serializers. |
| Reports slow down core APIs | Keep reports read-oriented and add materialized views later only if needed. |
| Background jobs added too early | Start without Redis; add BullMQ when reminders/imports/exports require it. |

---

## Final Backend Recommendation

Build the backend as a NestJS modular monolith with clean architecture inside each feature module. Start with platform foundations: tenants, identity, RBAC, audit, Prisma, and local Postgres. Then build organization and employees before documents, leave, onboarding, recruiting, reports, and notifications.

The backend should own business logic, authorization, tenant isolation, and audit. Supabase Auth should only authenticate users, Supabase Postgres should only store data, and Supabase Storage should only store files. All external services must sit behind internal provider interfaces so they can be replaced later without rewriting product modules.
