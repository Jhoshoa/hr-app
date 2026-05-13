# HR App Web

Frontend web application for the HR SaaS product.

This app is built with:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Redux Toolkit
- RTK Query
- next-intl
- Supabase browser client for auth integration

The current implementation is the first frontend slice: app scaffold, shared providers, Redux setup, RTK Query foundation, app shell, dashboard, employee list, mock fixtures, and a basic login screen.

## Requirements

- Node.js 20
- pnpm 9.15.4 through Corepack

On this Windows setup, prefer adding the local Node 20 path for the current PowerShell session instead of running `nvm use`, because `nvm use` can require admin permissions:

```powershell
$env:Path = "C:\Users\josoe.ichuta\AppData\Local\nvm\v20.18.1;$env:Path"
```

Verify:

```powershell
node --version
corepack --version
```

## Environment

Frontend variables are documented in the repo root `.env.example`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_AUTH_MODE=mock
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

For now, `NEXT_PUBLIC_AUTH_MODE=mock` is the default development mode. Real Supabase Auth integration will use `NEXT_PUBLIC_AUTH_MODE=supabase` plus real Supabase URL and anon key.

## Install Dependencies

From the repo root:

```powershell
$env:Path = "C:\Users\josoe.ichuta\AppData\Local\nvm\v20.18.1;$env:Path"
corepack pnpm install
```

## Run The Frontend

Default command:

```powershell
$env:Path = "C:\Users\josoe.ichuta\AppData\Local\nvm\v20.18.1;$env:Path"
corepack pnpm --filter @hr-app/web dev
```

This starts Next.js on port `3000`.

If port `3000` is already in use, run:

```powershell
$env:Path = "C:\Users\josoe.ichuta\AppData\Local\nvm\v20.18.1;$env:Path"
corepack pnpm --filter @hr-app/web exec next dev --port 3002
```

Then open:

```text
http://127.0.0.1:3002/dashboard
```

## Verification Commands

Run typecheck:

```powershell
$env:Path = "C:\Users\josoe.ichuta\AppData\Local\nvm\v20.18.1;$env:Path"
corepack pnpm --filter @hr-app/web typecheck
```

Run production build:

```powershell
$env:Path = "C:\Users\josoe.ichuta\AppData\Local\nvm\v20.18.1;$env:Path"
corepack pnpm --filter @hr-app/web build
```

Run tests:

```powershell
$env:Path = "C:\Users\josoe.ichuta\AppData\Local\nvm\v20.18.1;$env:Path"
corepack pnpm --filter @hr-app/web test
```

## Current Routes

```text
/dashboard
/employees
/login
```

The root route redirects to `/dashboard`.

## Next Implementation Steps

Recommended next steps:

1. Add real Supabase login and auth callback routes.
2. Connect `GET /api/v1/me`.
3. Resolve current tenant from backend data.
4. Add route protection for authenticated app routes.
5. Expand mock pages: employee profile, directory, leave, documents, settings users and roles.

