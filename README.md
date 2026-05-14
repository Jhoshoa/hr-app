# HR App

Monorepo for the HR SaaS platform.

Current implemented backend scope:

- Monorepo foundation with pnpm workspaces and Turborepo.
- NestJS API app in `apps/api`.
- Prisma database package in `packages/database`.
- Local PostgreSQL through Docker Compose.
- Initial platform schema: tenants, users, tenant memberships, roles, permissions, audit events.
- Phase 1 modules: `identity`, `tenants`, `audit`.
- Phase 2 schema and modules for organization setup and employee core records.
- Organization records: departments, locations, job titles, employment types, work modes, client projects.
- Employee records: profile, job assignments, manager relationships, compensation records, custom fields, CSV import/export foundation, and role-aware response filtering.
- Supabase Auth provider abstraction.
- Global auth, tenant, and permission guards.
- Health endpoint.
- Unit tests for core Phase 1 and Phase 2 use cases and visibility rules.

## What Is Still Missing

From `docs/backend/backend-planning-and-project-structure.md`, this has been implemented:

- Phase 0: repository/tooling foundation, mostly complete.
- Phase 1: platform foundation, partially complete and buildable.
- Phase 2: organization and employee core, mostly complete and buildable.

Still pending from Phase 1:

- Real Supabase project configuration.
- End-to-end auth test with a real or mocked Supabase token.
- Tenant isolation integration tests against a real test database.
- User invitation use case and controller.
- Role management endpoints.
- More complete seed data for HR Admin, Manager, Employee, Finance Viewer, Recruiter.
- Request logging with Pino.
- Rate limiting on auth-sensitive endpoints.

Still pending after Phase 1:

- Phase 2 repository integration tests against a real test database.
- Phase 2 E2E tests for employee create/list/update flows.
- Rich CSV validation, duplicate handling, and async import jobs for larger files.
- Documents module.
- Leave and approval workflows.
- Onboarding module.
- Recruiting module.
- Reports and exports.
- Notifications and background jobs.
- Production hardening.

## Requirements

- Node.js 18+
- Corepack
- Docker Desktop
- pnpm through Corepack

Check versions:

```bash
node --version
corepack --version
```

Enable pnpm:

```bash
corepack prepare pnpm@9.15.4 --activate
```

If `pnpm` is not available directly in your shell, use `corepack pnpm` for all commands.

## Working Directory

Run setup commands from the repository root unless a section explicitly says otherwise.

Repository root:

```text
D:\assuresoft-repos\hr-app
```

Do **not** run the setup from `apps/api`. The project is a monorepo, so dependency installation, database scripts, Docker commands, and filtered workspace commands should be executed from the root.

If you are not already in the repo root:

```powershell
cd D:\assuresoft-repos\hr-app
```

## Install Dependencies

From the repo root:

```bash
corepack pnpm install
```

## Environment Variables

Create a local `.env` file from the example:

```bash
copy .env.example .env
```

On PowerShell, this also works:

```powershell
Copy-Item .env.example .env
```

Default local database URL:

```env
DATABASE_URL=postgresql://hr_app:hr_app_password@localhost:5434/hr_app?schema=public
```

For local backend startup, the Supabase values must exist because config validation requires them. During early local work, placeholder values are acceptable unless you are testing real Supabase Auth:

```env
SUPABASE_URL=https://example.supabase.co
SUPABASE_ANON_KEY=replace-me
SUPABASE_SERVICE_ROLE_KEY=replace-me
SUPABASE_JWT_SECRET=replace-me-for-local-dev
```

The API loads environment variables from the repo root `.env` first, then `.env.example` as a fallback. That means the backend can start with `.env.example` values during early local development, but real authenticated Supabase requests require real Supabase credentials.

If you see this Supabase warning on Node 18:

```text
Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js.
```

It is a warning, not the current startup failure. The backend can run on Node 18 for now, but Node 20+ should be used soon because Supabase will drop Node 18 support in future versions.

## Start Local PostgreSQL

Start Postgres:

```bash
docker compose -f docker/docker-compose.yml up -d
```

Check containers:

```bash
docker compose -f docker/docker-compose.yml ps
```

Stop Postgres:

```bash
docker compose -f docker/docker-compose.yml down
```

Stop Postgres and delete local data:

```bash
docker compose -f docker/docker-compose.yml down -v
```

## Prisma Commands

Generate Prisma client:

```bash
corepack pnpm db:generate
```

The Prisma scripts load environment variables from the repo root `.env` first, then `.env.example` as a fallback.

Run local migrations:

```bash
corepack pnpm db:migrate
```

Run seed data:

```bash
corepack pnpm db:seed
```

Seed development Supabase Auth users:

```bash
corepack pnpm auth:seed:dev
```

This creates or updates these development login accounts in Supabase Auth:

```text
platform.owner@example.test / Password123!
demo.owner@example.test / Password123!
secondary.owner@example.test / y
```

The command requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the root
`.env`. The service role key must never be exposed through `NEXT_PUBLIC_*`
variables.

Reset local database data, reapply migrations, and run seed:

```bash
corepack pnpm db:reset:local
```

Rebuild local Prisma state from scratch:

```bash
corepack pnpm db:rebuild:local
```

`db:rebuild:local` runs Prisma generate first, then resets the local database.
Both reset commands are destructive for local data. Use them only when you want
to start from a clean local database.

On Windows, stop the API dev server before running these commands. If the
backend is running, Prisma can hit file locks while replacing generated client
files.

Open Prisma Studio:

```bash
corepack pnpm --filter @hr-app/database db:studio
```

Deploy migrations in production/staging:

```bash
corepack pnpm --filter @hr-app/database db:deploy
```

## Start Backend In Development

Start only the API:

```bash
corepack pnpm --filter @hr-app/api dev
```

Expected local URL:

```text
http://localhost:3001
```

Health endpoint:

```text
GET http://localhost:3001/api/v1/health
```

Swagger/OpenAPI docs:

```text
http://localhost:3001/api/docs
```

## Build Backend

Build only the API:

```bash
corepack pnpm --filter @hr-app/api build
```

Build all workspaces:

```bash
corepack pnpm build
```

## Start Backend After Build

Build first:

```bash
corepack pnpm --filter @hr-app/api build
```

Start compiled API:

```bash
corepack pnpm --filter @hr-app/api start
```

## Tests And Type Checking

Typecheck API:

```bash
corepack pnpm --filter @hr-app/api typecheck
```

Run API unit tests:

```bash
corepack pnpm --filter @hr-app/api test
```

If Jest worker spawning fails on Windows or in a restricted shell, run tests in-band:

```bash
corepack pnpm --filter @hr-app/api exec jest --config jest.config.ts --runInBand
```

Run API build verification:

```bash
corepack pnpm --filter @hr-app/api build
```

## Full Local Backend Setup From Zero

Use this sequence for a fresh local setup:

```bash
cd D:\assuresoft-repos\hr-app
corepack prepare pnpm@9.15.4 --activate
corepack pnpm install
docker compose -f docker/docker-compose.yml up -d
corepack pnpm db:rebuild:local
corepack pnpm auth:seed:dev
corepack pnpm --filter @hr-app/api dev
```

Then open:

```text
http://localhost:3001/api/v1/health
http://localhost:3001/api/docs
```

## Verification Performed

The current backend implementation was verified with:

```bash
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm --filter @hr-app/api typecheck
corepack pnpm --filter @hr-app/api exec jest --config jest.config.ts --runInBand
corepack pnpm --filter @hr-app/api test:e2e
corepack pnpm --filter @hr-app/api build
```

Results:

- TypeScript typecheck passed.
- Local Prisma migration passed against PostgreSQL on `localhost:5434`.
- Local seed script passed.
- Unit tests passed: 6 test suites, 11 tests.
- E2E tests passed: 1 test suite, 1 test.
- NestJS production build passed.

Not yet verified:

- API startup with a real `.env`.
- Auth flow with real Supabase tokens.

On Windows, `nest build` may fail in the sandbox with an `EPERM` error while deleting old files in `apps/api/dist`. Delete the generated `apps/api/dist` folder and rerun the build from a normal terminal if that happens.

## Current API Modules

```text
apps/api/src/modules/
  audit/
  employees/
  identity/
  organization/
  tenants/
```

Current public endpoint:

```text
GET /api/v1/health
```

Current authenticated endpoints:

```text
GET /api/v1/me
GET /api/v1/tenants/current
GET /api/v1/audit-events
GET /api/v1/departments
POST /api/v1/departments
GET /api/v1/locations
POST /api/v1/locations
GET /api/v1/job-titles
POST /api/v1/job-titles
GET /api/v1/employment-types
POST /api/v1/employment-types
GET /api/v1/work-modes
POST /api/v1/work-modes
GET /api/v1/client-projects
POST /api/v1/client-projects
GET /api/v1/employees
GET /api/v1/employees/export.csv
POST /api/v1/employees/import.csv
POST /api/v1/employees
GET /api/v1/employees/:employeeId
PATCH /api/v1/employees/:employeeId
GET /api/v1/employees/:employeeId/profile
PATCH /api/v1/employees/:employeeId/profile
DELETE /api/v1/employees/:employeeId/profile
POST /api/v1/employees/:employeeId/job-assignments
POST /api/v1/employees/:employeeId/manager-relationships
POST /api/v1/employees/:employeeId/compensation-records
POST /api/v1/employee-custom-fields
PATCH /api/v1/employees/:employeeId/custom-field-values/:fieldDefinitionId
```

Authenticated requests require:

```text
Authorization: Bearer <supabase-access-token>
x-tenant-slug: <tenant-slug>
```

`GET /api/v1/me` does not require `x-tenant-slug` because it lists the tenants available to the authenticated user.
