# Recommended Technology Stack

> Stack recommendation for implementing the HR SaaS described in `docs/first-approach/hr-saas-first-approach.md`.
>
> Created: May 12, 2026.

---

## Recommendation Summary

Build the first version as a modular monolith, not microservices.

Recommended stack:

| Layer | Recommendation |
|-------|----------------|
| Frontend | Next.js, React, TypeScript |
| UI | Tailwind CSS, shadcn/ui, Radix UI, lucide-react |
| Backend | NestJS, TypeScript |
| API | REST first, OpenAPI documentation |
| Database | PostgreSQL locally, Supabase Postgres in production |
| ORM | Prisma |
| Cache / queues | Redis, but only when background jobs and rate limits are needed |
| Background jobs | BullMQ with Redis |
| File storage | Supabase Storage first; S3-compatible object storage abstraction |
| Search | PostgreSQL full-text search first; OpenSearch later only if needed |
| Auth | Supabase Auth first, abstracted so Clerk/WorkOS/Auth0 can replace it later |
| Email | Resend first; Amazon SES later if volume or cost requires it |
| Observability | Sentry, OpenTelemetry-ready logging, uptime monitoring |
| Infrastructure | Docker, managed PostgreSQL, object storage, CI/CD |
| Deployment | Vercel for frontend, Render or Fly.io for backend |

The key architecture decision is to keep one deployable backend application with strict domain modules: identity, tenants, organization, employees, documents, leave, workflows, onboarding, recruiting, reports, notifications, audit, and integrations.

---

## Why Modular Monolith First

The first product must move quickly while handling sensitive HR data correctly. Microservices would add deployment, networking, data consistency, tracing, and operational complexity too early.

A modular monolith gives the right tradeoff:

- Fast development.
- Simple deployment.
- Lower infrastructure cost.
- Easier debugging.
- Shared transactions where needed.
- Clear module boundaries for future extraction.
- Good enough scale for the first several customers.

Use microservices later only when a specific module has independent scale, security, or team ownership needs. Possible future candidates are documents, notifications, reporting, AI, and integrations.

---

## Backend Recommendation

### Primary Choice: NestJS With TypeScript

NestJS is a strong fit for this product because it supports structured backend architecture, dependency injection, modules, guards, interceptors, validation, background jobs, and clear separation of concerns.

Why it fits:

- TypeScript end to end with the frontend.
- Good modular architecture.
- Good for REST APIs.
- Good support for validation and guards.
- Familiar to teams coming from Angular, Java, or .NET-style architecture.
- Works well with Prisma, PostgreSQL, Redis, queues, and OpenAPI.

Recommended backend libraries:

| Need | Library |
|------|---------|
| API framework | NestJS |
| Validation | class-validator + class-transformer, or Zod |
| ORM | Prisma |
| Auth/session integration | Passport.js, Auth.js adapter, or Better Auth integration |
| OpenAPI docs | `@nestjs/swagger` |
| Background jobs | BullMQ |
| Logging | Pino |
| Testing | Jest, Supertest |
| File uploads | Multer or direct-to-S3 signed uploads |
| Dates | date-fns or Luxon |
| CSV/XLSX import/export | fast-csv, exceljs |

### Backend Module Structure

Recommended structure:

```text
apps/
  api/
    src/
      main.ts
      app.module.ts
      common/
      config/
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
```

Each module should own:

- Controllers.
- Services.
- Domain rules.
- DTOs.
- Prisma repository access.
- Background jobs.
- Published domain events.
- Consumed domain events.

Avoid creating one giant `users.service.ts` or `employees.service.ts` that does everything. The first version should already enforce module boundaries.

---

## Frontend Recommendation

### Primary Choice: Next.js With React And TypeScript

Next.js is the recommended frontend because the product will need authenticated dashboards, HR admin screens, public job pages, responsive employee self-service, and later marketing/pricing pages.

Why it fits:

- Strong React ecosystem.
- Great route organization.
- Server rendering where useful.
- Good for public job pages and authenticated app views.
- Strong TypeScript support.
- Easy deployment options.

Recommended frontend libraries:

| Need | Library |
|------|---------|
| Framework | Next.js |
| UI components | shadcn/ui + Radix UI |
| Styling | Tailwind CSS |
| Icons | lucide-react |
| Forms | React Hook Form |
| Validation | Zod |
| Tables | TanStack Table |
| Data fetching | TanStack Query |
| Charts | Recharts or Tremor |
| Calendar UI | FullCalendar or React Big Calendar |
| i18n | next-intl |
| File upload UI | Uppy or custom direct-upload components |
| Testing | Playwright, Vitest, React Testing Library |

### Frontend App Areas

Recommended route groups:

```text
apps/
  web/
    app/
      (auth)/
      (app)/
        dashboard/
        employees/
        directory/
        documents/
        leave/
        onboarding/
        recruiting/
        reports/
        settings/
      (public)/
        jobs/
        careers/
```

Use responsive web first. Do not build native mobile apps in the first version. The employee and manager workflows must work well on mobile browsers.

---

## Database Recommendation

### Primary Choice: PostgreSQL

PostgreSQL should be the core database.

Why it fits:

- Reliable relational model for HR data.
- Strong constraints and transactions.
- Good JSON support for custom fields.
- Good full-text search for the first version.
- Works well with multi-tenant SaaS.
- Easy to host as a managed database.

Use PostgreSQL for:

- Tenants.
- Users and roles.
- Employee profiles.
- Organization structure.
- Leave policies and balances.
- Workflows.
- Documents metadata.
- Onboarding.
- Recruiting.
- Audit events.
- Reports.
- Billing metadata.

### Multi-Tenant Database Strategy

Start with a shared database and `tenant_id` on every tenant-owned table.

Recommended:

- Add `tenant_id` to all business records.
- Index `tenant_id` on every tenant-owned table.
- Use composite unique constraints like `(tenant_id, email)` where appropriate.
- Enforce tenant scoping in service/repository helpers.
- Consider PostgreSQL Row Level Security later if the team can operate it correctly.

Avoid separate databases per customer in the first version. It increases operational complexity and slows product development.

### ORM Choice: Prisma

Prisma is recommended for speed, type safety, migrations, and developer experience.

Use Prisma for:

- Schema definition.
- Migrations.
- Query type safety.
- Seed scripts.
- Basic repository layer.

Important rule: keep business logic out of Prisma model calls. Put business rules in domain/application services.

---

## Cache And Background Jobs

### Redis

Redis is useful, but it is not mandatory for the earliest prototype. Add Redis when the product needs queues, rate limits, sessions, or caching.

Use Redis for:

- BullMQ background jobs.
- Email notification queues.
- Document expiration reminders.
- Onboarding reminders.
- Report export jobs.
- Import processing jobs.
- Rate limiting.
- Short-lived cache for expensive dashboard queries.

Do not overuse Redis as a primary data store. PostgreSQL remains the source of truth.

### Background Jobs

Use BullMQ for background jobs once notifications, imports, exports, or reminders exist.

Initial jobs:

- Send email notification.
- Process employee import.
- Generate report export.
- Check document expirations.
- Send onboarding reminders.
- Send leave approval reminders.

---

## File Storage

Use S3-compatible object storage for documents.

Options:

- AWS S3.
- Cloudflare R2.
- DigitalOcean Spaces.
- MinIO for local development.

Recommended approach:

- Store file metadata in PostgreSQL.
- Store file content in object storage.
- Use signed upload URLs.
- Use signed download URLs.
- Never expose public document URLs.
- Store checksum, size, MIME type, owner, tenant, and document category.
- Audit sensitive document downloads.

This is required because employee documents, contracts, IDs, policies, and certificates are sensitive.

---

## Authentication And Authorization

### Auth

For the first product, use managed auth. The recommended first choice is **Supabase Auth** because the production database is already planned on Supabase, and Auth is included in the same platform.

Primary option:

- Supabase Auth.

Alternative managed providers:

- Clerk.
- Auth0.
- WorkOS.

App-owned auth options:

- Auth.js.
- Better Auth.
- NestJS auth with Passport.js.

Recommended first choice: **Supabase Auth for MVP and pilot**. App-owned auth should be avoided initially because the product stores sensitive HR data and auth mistakes are expensive. Clerk is the best later upgrade if the app needs better SaaS organization UX. WorkOS is a strong later add-on for enterprise SSO/SCIM.

Important architecture rule: keep tenant membership, roles, permissions, field-level access, and audit logs inside the application database. Supabase Auth should only prove identity; it should not own the HR authorization model.

Must-have auth features:

- Email/password.
- Password reset.
- Email verification.
- Session management.
- Tenant membership.
- Role assignment per tenant.

Later:

- MFA.
- SSO/SAML.
- SCIM.

### Authorization

Use role-based access control from the beginning.

Initial roles:

- Owner.
- HR Admin.
- HR Staff.
- Manager.
- Employee.
- Finance Viewer.
- Recruiter.

Also support field-level permissions for sensitive fields:

- Compensation.
- Personal identifiers.
- Emergency contacts.
- Documents.
- Termination details.
- Private HR notes.

---

## API Style

Use REST first.

Reasons:

- Simple for the team.
- Easy to document.
- Easy to debug.
- Works well for CRUD-heavy HR workflows.
- Easier for future external customers than a tightly coupled RPC API.

Use OpenAPI documentation from the start.

Recommended conventions:

- `/api/v1/employees`
- `/api/v1/leave-requests`
- `/api/v1/documents`
- `/api/v1/onboarding-packets`
- `/api/v1/job-openings`
- `/api/v1/reports`

GraphQL is not necessary for the first version. It can add complexity without solving the main product risk.

---

## Internationalization

The product should support Spanish and English from the beginning.

Recommended:

- Store tenant default language.
- Store user preferred language.
- Use `next-intl` on frontend.
- Keep backend error codes stable and translate on frontend where possible.
- Support date, number, and currency formatting by locale.
- Support USD and BOB initially.

Do not hardcode Bolivia-only assumptions into the database model. Use configurable country, currency, holidays, leave types, and document types.

---

## Reporting And Search

### Reporting

Start with PostgreSQL queries and read models.

Initial report approach:

- Predefined dashboard queries.
- Saved filters.
- CSV/XLSX export.
- Background export jobs for large files.
- Materialized views only if dashboard queries become slow.

Avoid a separate analytics warehouse in the first version.

### Search

Start with PostgreSQL:

- ILIKE for simple filters.
- Trigram indexes for fuzzy name/email search if needed.
- Full-text search for policies, job openings, and candidate notes.

Add OpenSearch or Meilisearch later only if PostgreSQL search becomes insufficient.

---

## Deployment Recommendation

### Best Practical Starting Deployment

For a small team, use the low-ops managed MVP path:

- Web app: Vercel.
- API: Render or Fly.io.
- PostgreSQL: Supabase Pro.
- Auth: Supabase Auth.
- Object storage: Supabase Storage first.
- Email: Resend first.
- Redis: none initially; Upstash Redis when queues/caching are needed.
- Monitoring: Sentry free tier first.

Recommended MVP option:

- Vercel for Next.js frontend.
- Render or Fly.io for NestJS API.
- Supabase Pro for production PostgreSQL.
- Supabase Auth for authentication.
- Supabase Storage for documents.
- Resend for transactional email.
- Upstash Redis when queues/caching are introduced.
- Sentry for error monitoring.

AWS option:

- AWS scheduled EC2, S3, SES, Route 53, and CloudWatch can be cheaper in a narrow early usage window.
- Use this only if the team accepts extra deployment and operations work.

Recommended production-mature AWS option later:

- AWS ECS/Fargate for API.
- AWS RDS PostgreSQL.
- AWS S3.
- AWS ElastiCache Redis.
- CloudFront.
- Route 53.
- SES for email.

Use the managed MVP option first. The scheduled AWS option is valid, but it adds operational complexity around server setup, TLS, start/stop schedules, patching, logs, downtime handling, and recovery. For the first pilot, product validation matters more than saving a small amount on infrastructure.

---

## Monorepo Recommendation

Use a monorepo.

Recommended tooling:

- pnpm workspaces.
- Turborepo.
- TypeScript project references where helpful.

Suggested structure:

```text
apps/
  web/
  api/
packages/
  config/
  database/
  eslint-config/
  types/
  ui/
  utils/
docker/
docs/
```

Shared packages should stay small. Avoid creating shared abstractions too early unless both frontend and backend truly need them.

---

## Testing Strategy

Recommended from the start:

- Unit tests for domain services.
- Integration tests for API endpoints.
- Repository/database tests for complex queries.
- Playwright end-to-end tests for critical flows.

Critical flows to test:

- Login.
- Tenant selection.
- Employee creation/import.
- Employee permissions.
- Document upload/download permissions.
- PTO request and approval.
- Leave balance adjustment.
- Onboarding template and packet creation.
- Candidate-to-employee conversion.
- Report export.

Use seed data that represents a Bolivia outsourcing company with HR admins, managers, employees, and candidates.

---

## Security And Compliance Baseline

Required before pilot:

- Tenant isolation tests.
- RBAC tests.
- Field-level permission tests.
- Secure password handling.
- Rate limiting on auth endpoints.
- Audit log for sensitive actions.
- Encrypted database and storage at rest.
- TLS in production.
- Signed document URLs.
- Backups and restore process.
- Environment variable management.
- No secrets in repository.
- Dependency vulnerability scanning.

Useful tools:

- Sentry for errors.
- Dependabot or Renovate for dependency updates.
- GitHub Actions for CI.
- Trivy or Snyk for container/dependency scanning.

---

## What To Defer

Do not implement these in the first version unless a pilot customer demands them:

- Microservices.
- Kubernetes.
- Event streaming with Kafka.
- Separate database per tenant.
- Elasticsearch/OpenSearch.
- Data warehouse.
- Native mobile apps.
- Full payroll engine.
- Benefits administration.
- AI assistant.
- SSO/SAML.
- SCIM.
- Complex workflow engine with visual builder.

These can be added later after product-market fit and real usage data.

---

## Alternative Stacks

### Alternative 1: .NET Backend

Use if the team is stronger in C#.

| Layer | Choice |
|-------|--------|
| Backend | ASP.NET Core |
| ORM | Entity Framework Core |
| Jobs | Hangfire |
| DB | PostgreSQL |
| Frontend | Next.js |

This is a strong enterprise backend choice, but it creates two language ecosystems if the frontend is TypeScript.

### Alternative 2: Django Backend

Use if the team is stronger in Python.

| Layer | Choice |
|-------|--------|
| Backend | Django + Django REST Framework |
| Jobs | Celery |
| DB | PostgreSQL |
| Frontend | Next.js |

Django is productive and mature, but TypeScript end-to-end is lost.

### Alternative 3: Ruby On Rails

Use if the goal is fastest CRUD-heavy SaaS delivery and the team knows Rails.

| Layer | Choice |
|-------|--------|
| Backend + web | Ruby on Rails |
| Jobs | Sidekiq |
| DB | PostgreSQL |
| Frontend | Hotwire or React |

Rails is excellent for SaaS speed, but hiring and frontend-rich app development may be easier with TypeScript/React.

---

## Final Stack Decision

Recommended final decision for this project:

- Monorepo with pnpm and Turborepo.
- Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Radix UI.
- NestJS, TypeScript, REST API, OpenAPI.
- PostgreSQL with Prisma.
- Local PostgreSQL in Docker for development.
- Supabase Pro Postgres for production.
- Supabase Auth for MVP authentication, behind an internal auth provider abstraction.
- Shared database multi-tenancy using `tenant_id`.
- Supabase Storage for first document storage, behind an internal object storage abstraction.
- Resend for first transactional email provider.
- Redis and BullMQ once background jobs are needed.
- PostgreSQL search and reporting first.
- Modular monolith architecture.
- Vercel for frontend and Render or Fly.io for backend during MVP/pilot.
- AWS migration path documented separately for later infrastructure control.

This stack is practical for a small team, strong enough for a serious SaaS, and flexible enough to add payroll exports, integrations, AI, advanced reports, SSO, and future module extraction when the product grows.
