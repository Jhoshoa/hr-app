# HR App

Monorepo for the HR SaaS platform.

Current implemented backend scope:

- Monorepo foundation with pnpm workspaces and Turborepo.
- NestJS API app in `apps/api`.
- Prisma database package in `packages/database`.
- Local PostgreSQL through Docker Compose.
- Initial platform schema: tenants, users, tenant memberships, roles, permissions, audit events.
- Phase 1 modules: `identity`, `tenants`, `audit`.
- Supabase Auth provider abstraction.
- Global auth, tenant, and permission guards.
- Health endpoint.
- Unit tests for core Phase 1 use cases.

## What Is Still Missing

From `docs/backend/backend-planning-and-project-structure.md`, this has been implemented:

- Phase 0: repository/tooling foundation, mostly complete.
- Phase 1: platform foundation, partially complete and buildable.

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

- Organization module.
- Employees module.
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
DATABASE_URL=postgresql://hr_app:hr_app_password@localhost:5432/hr_app?schema=public
```

For local backend startup, the Supabase values must exist because config validation requires them. During early local work, placeholder values are acceptable unless you are testing real Supabase Auth:

```env
SUPABASE_URL=https://example.supabase.co
SUPABASE_ANON_KEY=replace-me
SUPABASE_SERVICE_ROLE_KEY=replace-me
SUPABASE_JWT_SECRET=replace-me-for-local-dev
```

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

Run local migrations:

```bash
corepack pnpm db:migrate
```

Run seed data:

```bash
corepack pnpm db:seed
```

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
corepack prepare pnpm@9.15.4 --activate
corepack pnpm install
docker compose -f docker/docker-compose.yml up -d
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:seed
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
corepack pnpm --filter @hr-app/api typecheck
corepack pnpm --filter @hr-app/api exec jest --config jest.config.ts --runInBand
corepack pnpm --filter @hr-app/api build
```

Results:

- TypeScript typecheck passed.
- Unit tests passed: 3 test suites, 5 tests.
- NestJS production build passed.

Not yet verified:

- `db:migrate` against a running local PostgreSQL container.
- `db:seed` against a running local PostgreSQL container.
- API startup with a real `.env`.
- Auth flow with real Supabase tokens.

## Current API Modules

```text
apps/api/src/modules/
  audit/
  identity/
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
```

Authenticated requests require:

```text
Authorization: Bearer <supabase-access-token>
x-tenant-slug: <tenant-slug>
```

`GET /api/v1/me` does not require `x-tenant-slug` because it lists the tenants available to the authenticated user.
