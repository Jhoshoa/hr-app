# Node 20 Migration Analysis For The Backend

Created: May 12, 2026.

## Recommendation

Move the backend development and deployment runtime from Node.js 18 to Node.js 20 LTS before the first real pilot.

The API currently works on Node 18, but `@supabase/supabase-js` prints this warning during tests and startup:

```text
Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js.
```

This is not a current blocker because tests pass, but it is a clear signal that staying on Node 18 will create avoidable upgrade pressure later.

## Current Repo State

Current runtime/tooling assumptions:

- Root package manager: `pnpm@9.15.4` through Corepack.
- API framework: NestJS 10.
- ORM: Prisma 6.
- Supabase packages:
  - `@supabase/supabase-js`
  - `@supabase/realtime-js`
- TypeScript: 5.7.
- API Node types: `@types/node` 22.

The project already uses `@types/node@22`, so the TypeScript type environment is ahead of the current Node 18 runtime. Moving to Node 20 reduces that mismatch.

## What Should Change

### Required Changes

1. Use Node 20 locally.

Recommended with nvm-windows:

```powershell
nvm install 20.11.1
nvm use 20.11.1
node --version
```

2. Re-enable pnpm through Corepack.

```powershell
corepack prepare pnpm@9.15.4 --activate
corepack pnpm install
```

3. Update documentation from `Node.js 18+` to `Node.js 20+`.

This should be changed in `README.md` when the team agrees to make Node 20 the official project runtime.

4. Use Node 20 in production.

When the API is deployed, the runtime image/service should use Node 20 LTS. Examples:

- Docker base image later: `node:20-alpine` or `node:20-bookworm-slim`.
- AWS App Runner / ECS / Elastic Beanstalk runtime: Node 20.
- Any CI runner setup: `node-version: 20`.

### Recommended Changes

Add an `engines` field to the root `package.json` after migration:

```json
{
  "engines": {
    "node": ">=20 <23",
    "pnpm": "9.15.4"
  }
}
```

This documents the expected runtime and helps catch accidental Node 18 usage.

Optionally add `.nvmrc`:

```text
20.11.1
```

For nvm-windows, `.nvmrc` is not always used automatically, but it is still useful documentation.

## Dependencies That Might Need Attention

Based on the current package files, no immediate dependency upgrade is required only to run Node 20.

Current dependency assessment:

| Dependency | Current State | Node 20 Action |
|---|---|---|
| `@supabase/supabase-js` | Warns on Node 18 | Keep version for now; Node 20 removes the warning. |
| `@supabase/realtime-js` | Used by Supabase client stack | Keep version for now. |
| `@prisma/client` / `prisma` | Prisma 6 installed | Keep version for now; regenerate client after switching Node. |
| NestJS 10 packages | Compatible with current code | Keep version for now. |
| Jest / ts-jest | Tests currently pass | Keep version for now. |
| `tsx` | Used by seed script | Keep version for now. |
| `@types/node` | Already version 22 | Acceptable, but we can later align to Node 20 types if wanted. |

Important: do not combine the Node 20 migration with a Prisma major upgrade or NestJS major upgrade. Those should be separate changes.

## Migration Checklist

Run from the repository root:

```powershell
cd D:\assuresoft-repos\hr-app
nvm install 20.11.1
nvm use 20.11.1
node --version
corepack --version
corepack prepare pnpm@9.15.4 --activate
corepack pnpm install
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm --filter @hr-app/api typecheck
corepack pnpm --filter @hr-app/api exec jest --config jest.config.ts --runInBand
corepack pnpm --filter @hr-app/api test:e2e
corepack pnpm --filter @hr-app/api build
corepack pnpm --filter @hr-app/api dev
```

Expected result:

- Supabase Node 18 warning disappears.
- Prisma client generates successfully.
- Migrations remain in sync.
- Unit tests pass.
- E2E tests pass.
- API starts normally.

## Risks

### Local PATH Confusion

The main practical risk is Windows PATH confusion with nvm-windows.

Symptoms:

- `corepack` is not recognized.
- `node --version` still shows Node 18 after `nvm use 20.11.1`.
- Different terminals show different Node versions.

Mitigation:

- Close and reopen PowerShell after `nvm use`.
- Check:

```powershell
node --version
where node
where corepack
```

### Prisma Engine Cache

Prisma may download or regenerate engine binaries after the Node switch.

Mitigation:

- Run `corepack pnpm db:generate`.
- If Prisma download fails in Codex sandbox, rerun with network permission.
- Locally, make sure the internet connection is available.

### Native Or Binary Dependencies

This repo has few native/binary concerns. Prisma engines are the main one. `esbuild` is also used indirectly by `tsx`.

Mitigation:

- Run a fresh `corepack pnpm install` after switching Node.
- If needed, remove `node_modules` and reinstall, but do that only if normal install fails.

### Deployment Runtime Drift

If local development uses Node 20 but production uses Node 18, bugs and warnings can differ.

Mitigation:

- Update deployment runtime to Node 20 at the same time the repo requirement changes.
- Add CI verification with Node 20.

### Hidden Test Differences

Node 20 can expose timing or runtime differences in tests, especially around streams, fetch, and timers.

Mitigation:

- Run unit tests and E2E tests after the migration.
- Keep the migration commit small and focused.

## Benefits

- Removes the Supabase Node 18 deprecation warning.
- Reduces future risk when Supabase eventually drops Node 18 support.
- Aligns backend runtime with the current direction of the dependency ecosystem.
- Gives better long-term production support than Node 18.
- Keeps local development closer to what we should deploy.
- Makes future dependency upgrades easier.

## What Not To Do In The Same Change

Do not combine the Node 20 migration with:

- Prisma 6 to Prisma 7 upgrade.
- NestJS 10 to NestJS 11 upgrade.
- pnpm 9 to pnpm 10 upgrade.
- TypeScript major upgrade.
- Auth provider refactor.

Those changes can be done later, separately, with their own test passes.

## Final Decision

The migration is low risk and worth doing now. The current codebase is already close to Node 20 readiness, and the main work is standardizing local, CI, and production runtime versions.

The recommended path is:

1. Switch local development to Node 20.
2. Verify Prisma, tests, build, and API startup.
3. Update README and optionally add `engines` / `.nvmrc`.
4. Use Node 20 in the first production deployment.
