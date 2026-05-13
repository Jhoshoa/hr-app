# Supabase Google Auth Configuration

Created: May 13, 2026.

## Purpose

This document explains how to get the Supabase environment values needed by the backend and frontend, and what URLs must be configured so Google login works locally on the web app.

Current local frontend URL:

```text
http://localhost:3000
```

Use only port `3000` for the frontend unless there is a specific reason to test another port.

## Environment Variables

Backend variables:

```env
SUPABASE_URL=https://example.supabase.co
SUPABASE_ANON_KEY=replace-me
SUPABASE_SERVICE_ROLE_KEY=replace-me
SUPABASE_JWT_SECRET=replace-me-for-local-dev
```

Frontend variables:

```env
NEXT_PUBLIC_AUTH_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=replace-me
```

For local mock mode, keep:

```env
NEXT_PUBLIC_AUTH_MODE=mock
```

For real Supabase Google login, change it to:

```env
NEXT_PUBLIC_AUTH_MODE=supabase
```

## Where To Get Supabase Values

Open the Supabase dashboard:

```text
https://supabase.com/dashboard
```

Select the project for this app.

### `SUPABASE_URL`

Location:

```text
Supabase Dashboard -> Project Settings -> API
```

Use the project API URL.

It usually looks like:

```text
https://<project-ref>.supabase.co
```

Set the same value in:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
```

### `SUPABASE_ANON_KEY`

Location:

```text
Supabase Dashboard -> Project Settings -> API Keys
```

Use either:

- the legacy `anon` key, or
- the newer publishable key if we later rename the env var.

For the current codebase, keep the env var name as:

```env
SUPABASE_ANON_KEY=<anon-or-publishable-key>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<same-anon-or-publishable-key>
```

This key is safe to expose to the browser. It is the only Supabase key that should be used in `NEXT_PUBLIC_*` variables.

### `SUPABASE_SERVICE_ROLE_KEY`

Location:

```text
Supabase Dashboard -> Project Settings -> API Keys
```

Use either:

- the legacy `service_role` key, or
- the newer secret key if we later rename the env var.

For the current codebase, keep:

```env
SUPABASE_SERVICE_ROLE_KEY=<service-role-or-secret-key>
```

Important:

- Never put this value in `NEXT_PUBLIC_*`.
- Never use this value in browser code.
- Only the backend should use it.

The backend currently uses this key in `SupabaseAuthProvider` to call Supabase Auth admin/user APIs.

### `SUPABASE_JWT_SECRET`

Location for legacy projects:

```text
Supabase Dashboard -> Project Settings -> JWT Keys -> Legacy JWT Secret
```

Current status in this repo:

- The backend env schema requires `SUPABASE_JWT_SECRET`.
- The current backend code does not directly verify JWTs with this secret.
- Token validation currently happens through Supabase using `supabase.auth.getUser(token)`.

So this value is required by config validation today, but it is not the main auth mechanism in the current backend implementation.

If the project has migrated to Supabase's newer JWT signing keys, prefer Supabase SDK verification methods or JWKS-based verification instead of relying directly on the legacy JWT secret.

## Google OAuth Setup

Google login needs configuration in two places:

1. Google Cloud / Google Auth Platform.
2. Supabase Auth provider settings.

## Step 1: Configure Google Cloud

Open:

```text
https://console.cloud.google.com
```

Create or select a Google Cloud project.

Then configure OAuth consent and OAuth client credentials:

```text
Google Auth Platform / APIs & Services -> Credentials
```

Create an OAuth client:

```text
Application type: Web application
```

### Authorized JavaScript Origins

For local development, add:

```text
http://localhost:3000
```

Optional, only if you intentionally test with 127.0.0.1:

```text
http://127.0.0.1:3000
```

For production later, add the real app origin:

```text
https://app.your-domain.com
```

### Authorized Redirect URIs

This one is not the frontend callback route. It is Supabase's OAuth callback URL.

Add:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

You can also copy this exact callback URL from:

```text
Supabase Dashboard -> Authentication -> Providers -> Google
```

After creating the Google OAuth client, copy:

```text
Google Client ID
Google Client Secret
```

## Step 2: Configure Supabase Google Provider

Open:

```text
Supabase Dashboard -> Authentication -> Providers -> Google
```

Enable Google.

Paste:

```text
Client ID=<Google OAuth Client ID>
Client Secret=<Google OAuth Client Secret>
```

Save the provider configuration.

## Step 3: Configure Supabase URL Settings

Open:

```text
Supabase Dashboard -> Authentication -> URL Configuration
```

Set Site URL:

```text
http://localhost:3000
```

Add Redirect URLs:

```text
http://localhost:3000/auth/callback
```

Optional, only if testing with 127.0.0.1:

```text
http://127.0.0.1:3000/auth/callback
```

For production later, add exact production URLs:

```text
https://app.your-domain.com/auth/callback
```

Avoid broad wildcard redirect URLs in production. Exact callback URLs are safer.

## Frontend Login Flow

The frontend should call Supabase from the browser with Google as provider.

Expected local redirect target:

```text
http://localhost:3000/auth/callback
```

Expected frontend behavior:

```text
/login
  -> user clicks Continue with Google
  -> Supabase redirects to Google
  -> Google redirects back to Supabase callback
  -> Supabase redirects to http://localhost:3000/auth/callback
  -> frontend reads the Supabase session
  -> frontend calls backend GET /api/v1/me with Authorization: Bearer <access_token>
```

The callback route does not exist yet in the current frontend slice. It should be added before switching local development from mock auth to real Supabase auth.

## Backend Behavior

The backend should not receive Google credentials directly.

The backend receives only:

```http
Authorization: Bearer <supabase-access-token>
```

Then:

1. `AuthGuard` extracts the bearer token.
2. `SupabaseAuthProvider` verifies the token with Supabase.
3. Backend maps the Supabase user id into local `User.externalAuthUserId`.
4. Backend resolves tenant memberships and permissions from local Postgres.

## Recommended Local `.env` Example

Use this for real Supabase Auth plus local Docker Postgres:

```env
NODE_ENV=development
PORT=3001
API_PREFIX=api
DATABASE_URL=postgresql://hr_app:hr_app_password@localhost:5434/hr_app?schema=public

SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-or-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-or-secret-key>
SUPABASE_JWT_SECRET=<legacy-jwt-secret-if-required-by-config>
DEFAULT_TENANT_SLUG=assuresoft-demo

NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_AUTH_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>
```

## Security Rules

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` can be exposed in the frontend.
- `SUPABASE_SERVICE_ROLE_KEY` must only exist on the backend.
- Do not commit real `.env` values.
- Do not paste service role or secret keys into frontend code.
- Do not use the service role key in browser requests, even on localhost.

## Checklist

Supabase:

- Project URL copied.
- Anon or publishable key copied.
- Service role or secret key copied for backend only.
- Google provider enabled.
- Google Client ID configured.
- Google Client Secret configured.
- Site URL set to `http://localhost:3000`.
- Redirect URL includes `http://localhost:3000/auth/callback`.

Google:

- OAuth consent screen configured.
- OAuth client type is Web application.
- Authorized JavaScript origin includes `http://localhost:3000`.
- Authorized redirect URI includes `https://<project-ref>.supabase.co/auth/v1/callback`.

Frontend:

- `NEXT_PUBLIC_AUTH_MODE=supabase`.
- `NEXT_PUBLIC_SUPABASE_URL` set.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` set.
- `/auth/callback` route implemented.
- `/login` calls `signInWithOAuth({ provider: "google" })`.

Backend:

- `SUPABASE_URL` set.
- `SUPABASE_SERVICE_ROLE_KEY` set.
- `SUPABASE_ANON_KEY` set for config completeness.
- `SUPABASE_JWT_SECRET` set if env validation still requires it.
- API receives `Authorization: Bearer <access_token>`.

## References

- Supabase Auth overview: https://supabase.com/docs/guides/auth
- Supabase API keys: https://supabase.com/docs/guides/api/api-keys
- Supabase Google login: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Supabase JWTs and signing keys: https://supabase.com/docs/guides/auth/jwts and https://supabase.com/docs/guides/auth/signing-keys

