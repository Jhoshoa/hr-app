# HR App

Monorepo for the HR SaaS platform.

## Stack

- pnpm workspaces with Turborepo
- NestJS API in `apps/api`
- Next.js web app in `apps/web`
- Prisma/PostgreSQL database package in `packages/database`
- Shared geo and timezone packages in `packages/geo` and `packages/timezones`
- Supabase Auth for real sessions

## Requirements

- Node.js 20+
- Corepack
- Docker Desktop
- pnpm through Corepack

Enable the repo pnpm version:

```bash
corepack prepare pnpm@9.15.4 --activate
```

Run commands from the repository root:

```powershell
cd C:\Users\josoe\Documents\hr-app
```

## Install

```bash
corepack pnpm install
```

## Environment

Create `.env` from `.env.example`:

```powershell
Copy-Item .env.example .env
```

For the full app, configure real Supabase values and use Supabase auth mode:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...

NEXT_PUBLIC_AUTH_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
```

The API loads env values from the repo root `.env` first, then `.env.example`.
Do not expose `SUPABASE_SERVICE_ROLE_KEY` through any `NEXT_PUBLIC_*` variable.

## Local Database

Start PostgreSQL:

```bash
docker compose -f docker/docker-compose.yml up -d
```

Stop PostgreSQL:

```bash
docker compose -f docker/docker-compose.yml down
```

Stop and delete local data:

```bash
docker compose -f docker/docker-compose.yml down -v
```

## Database Commands

Generate Prisma client:

```bash
corepack pnpm db:generate
```

Run local migrations:

```bash
corepack pnpm db:migrate
```

Seed local app data:

```bash
corepack pnpm db:seed
```

Seed Supabase Auth development users:

```bash
corepack pnpm auth:seed:dev
```

Default dev users:

```text
platform.owner@example.test / Password123!
demo.owner@example.test / Password123!
secondary.owner@example.test / Password123!
```

Reset local DB, apply migrations, and seed:

```bash
corepack pnpm db:reset:local
```

Rebuild local Prisma state from scratch:

```bash
corepack pnpm db:rebuild:local
```

Deploy migrations in staging/production:

```bash
corepack pnpm --filter @hr-app/database db:deploy
```

## Geo/Timezone Legacy Audit

The geo/timezone backfill migration normalizes legacy country, timezone,
subdivision, and signup phone data. The audit script checks whether any invalid
legacy data remains.

For local development:

```bash
corepack pnpm db:migrate
corepack pnpm --filter @hr-app/database audit:geo-timezone
```

For staging/production:

```bash
corepack pnpm --filter @hr-app/database db:deploy
corepack pnpm --filter @hr-app/database audit:geo-timezone
```

The audit should return `totalFindings: 0` before building sensitive modules
that depend on tenant/location timezones, location country/subdivision, payroll
reporting, time tracking, leave, or employee location behavior.

## Run Apps

Start API:

```bash
corepack pnpm --filter @hr-app/api dev
```

API URLs:

```text
http://localhost:3001/api/v1/health
http://localhost:3001/api/docs
```

Start web:

```bash
corepack pnpm --filter @hr-app/web dev
```

Web URL:

```text
http://localhost:3000
```

Run all dev apps through Turbo:

```bash
corepack pnpm dev
```

## Verification

Typecheck:

```bash
corepack pnpm --filter @hr-app/api typecheck
corepack pnpm --filter @hr-app/web typecheck
corepack pnpm --filter @hr-app/database typecheck
corepack pnpm --filter @hr-app/geo typecheck
```

Tests:

```bash
corepack pnpm --filter @hr-app/api test
corepack pnpm --filter @hr-app/web test
corepack pnpm --filter @hr-app/database test
corepack pnpm --filter @hr-app/geo test
corepack pnpm --filter @hr-app/timezones test
```

Build:

```bash
corepack pnpm build
```

## Current Backend Scope

Implemented areas include:

- Identity, tenant context, auth guards, permission guards, platform role guards
- Tenant settings and audit events
- Company signup requests and platform review flow
- Country, subdivision, phone, and timezone validation helpers
- Geo/timezone legacy backfill and audit
- Organization setup: departments, locations, job titles, employment types, work modes, client projects
- Organization units and organization unit types
- Employee core records, profiles, job assignments, manager relationships, compensation records, custom fields
- Employee CSV import/export foundation
- Role, tenant user, and tenant invitation management
- Tenant feature gating

Current important authenticated endpoints:

```text
GET /api/v1/me
GET /api/v1/tenants/current
PATCH /api/v1/tenants/current
GET /api/v1/audit-events
GET /api/v1/company-signup-requests/*
GET /api/v1/platform/company-signup-requests
GET /api/v1/tenant-users
GET /api/v1/roles
GET /api/v1/organization-unit-types
GET /api/v1/organization-units
GET /api/v1/employees
GET /api/v1/employees/export.csv
POST /api/v1/employees
GET /api/v1/employees/:employeeId
PATCH /api/v1/employees/:employeeId
```

Authenticated requests require:

```text
Authorization: Bearer <supabase-access-token>
x-tenant-slug: <tenant-slug>
```

`GET /api/v1/me` does not require `x-tenant-slug` because it returns the
available tenants for the authenticated user.

## Next Critical Work

Before expanding employee-facing modules such as time tracking, leave, payroll,
or richer employee workflows, implement the access-scope foundation described in:

```text
docs/role-tenant-hierarchy-scope/membership-access-scope-implementation-plan.md
docs/role-tenant-hierarchy-scope/access-filter-and-self-team-authorization-pattern.md
```

The key rule is:

```text
tenantId is isolation, not full authorization.
self actions require ownership checks.
team/admin actions require permissions plus an access filter.
```
