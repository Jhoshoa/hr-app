# Company Profile Implementation Plan

Fecha: 2026-05-19

## Objetivo

Separar los datos operativos del tenant de los datos descriptivos/comerciales
de la compania.

Hoy existen dos fuentes:

```txt
CompanySignupRequest:
  solicitud previa a crear el workspace.

Tenant:
  workspace operativo usado por auth, routing, permisos y contexto.
```

`CompanySignupRequest` tiene mas datos porque captura onboarding y revision:

```txt
companyName
desiredTenantSlug
adminFirstName
adminLastName
adminEmail
companyWebsite
companySize
country
timezone
preferredLanguage
phone
message
status/review fields
```

`Tenant` debe permanecer pequeno y estable:

```txt
name
slug
status
defaultLanguage
defaultCurrency
timezone
```

## Decision

Crear una tabla separada `TenantProfile` en vez de agregar todos los campos a
`Tenant`.

Razon:

```txt
Tenant:
  identidad operativa del workspace.

TenantProfile:
  perfil editable de la compania.
```

Esto evita que los guards, tenant context, routing y permisos dependan de
campos descriptivos que no necesitan para autorizar requests.

## Modelo Propuesto

```prisma
model TenantProfile {
  id           String   @id @default(uuid()) @db.Uuid
  tenantId     String   @unique @db.Uuid
  website      String?
  companySize  String?
  country      String?
  phone        String?
  contactEmail String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  tenant       Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([country])
}
```

Campos no incluidos todavia, pero previstos:

```txt
legalName
taxId
billingEmail
industry
logoUrl
address fields
```

## Mapping Desde Signup

Al aprobar un `CompanySignupRequest`:

```txt
Tenant.name <- CompanySignupRequest.companyName
Tenant.slug <- finalTenantSlug
Tenant.defaultLanguage <- CompanySignupRequest.preferredLanguage
Tenant.timezone <- CompanySignupRequest.timezone o DEFAULT_TIME_ZONE

TenantProfile.website <- CompanySignupRequest.companyWebsite
TenantProfile.companySize <- CompanySignupRequest.companySize
TenantProfile.country <- CompanySignupRequest.country
TenantProfile.phone <- CompanySignupRequest.phone
TenantProfile.contactEmail <- CompanySignupRequest.adminEmail
```

No copiar:

```txt
adminFirstName/adminLastName:
  pertenecen al usuario owner, no al perfil de compania.

message:
  pertenece al historial de review, no al perfil operativo.
```

## Backend

### Database

1. Agregar relacion `Tenant.profile`.
2. Agregar modelo `TenantProfile`.
3. Crear migracion.
4. Backfill inicial:
   - Para signups aprobados con `approvedTenantId`, crear `TenantProfile` si no
     existe.
   - Usar datos ya normalizados de `CompanySignupRequest`.

### API

Extender `GET /api/v1/tenants/current` para devolver:

```ts
profile: {
  website: string | null;
  companySize: string | null;
  country: string | null;
  phone: string | null;
  contactEmail: string | null;
} | null;
```

Extender `PATCH /api/v1/tenants/current` para aceptar:

```ts
profile?: {
  website?: string | null;
  companySize?: string | null;
  country?: string | null;
  phone?: string | null;
}
```

### Validaciones

Backend es autoridad:

```txt
tenantId:
  siempre sale de CurrentTenant, no del body.

currentUser:
  requerido para audit.

permission:
  PATCH /tenants/current requiere tenant.manage.
  GET /tenants/current requiere tenant.read.

slug:
  no editable. No aceptar slug en DTO ni update use case.

profile.country:
  ISO alpha-2 soportado por @hr-app/geo.

profile.phone:
  E.164 valido segun libphonenumber-js y pais soportado.
  Puede usar profile.country como default country.

profile.website:
  dominio normalizado de forma consistente con signup.

profile.contactEmail:
  historico/backfill desde signup, no editable desde Company Settings.
  El email de cuenta del owner pertenece a Account Settings/Auth.

profile.companySize:
  texto opcional limitado.
```

### Audit

Actualizar audit de tenant settings para incluir cambios de `profile` en
metadata `updatedFields`.

## Frontend

### API/RTK Query

Actualizar tipos y endpoints en `features/tenants`:

```txt
TenantSettings.profile
UpdateTenantSettingsPayload.profile
```

Mantener invalidacion de `Tenant`.

### UI

En `/settings/company`, mantener tabs actuales:

```txt
Profile
Locations
Structure
```

Dentro de `Profile`, separar:

```txt
Company identity
  Company name
  Workspace slug disabled

Localization
  Default language
  Default currency
  Timezone

Company profile
  Website
  Company size
  Country
  Phone
```

Usar skeletons cuando se carga `GET /tenants/current`.

El boton debe llamarse:

```txt
Save changes
```

Y solo estar activo cuando:

```txt
tenant existe
form isDirty
mutation no esta cargando
```

Slug sigue disabled en frontend y no existe en backend update DTO.

## Tests

### Backend

1. `UpdateCurrentTenantUseCase` actualiza campos base y profile.
2. Rechaza timezone fuera de catalogo soportado.
3. Normaliza country/phone.
4. Rechaza phone invalido.
5. `ApproveCompanySignupRequestUseCase` crea `TenantProfile`.
6. No permite editar slug.
7. Rechaza updates de `profile.contactEmail`.

### Frontend

1. Company settings renderiza datos de `profile`.
2. Muestra skeletons durante carga inicial.
3. `Save changes` esta disabled sin cambios.
4. `Save changes` se habilita con cambios.
5. Slug esta disabled.
6. Envia payload con `profile`.

## Rollout

1. Crear migracion y aplicar en local.
2. Ejecutar tests backend/frontend.
3. En staging/prod:
   ```bash
   corepack pnpm --filter @hr-app/database db:deploy
   ```
4. Verificar que signups aprobados existentes tienen `TenantProfile`.

## Implementacion 2026-05-19

Se implemento la primera fase completa:

```txt
Database:
  - Modelo TenantProfile.
  - Relacion Tenant.profile.
  - Migracion 20260519143000_tenant_profile.
  - Backfill desde CompanySignupRequest aprobados.

Backend:
  - GET /tenants/current devuelve profile.
  - PATCH /tenants/current acepta profile anidado.
  - Slug sigue fuera del DTO y no se actualiza.
  - tenantId sale de CurrentTenant.
  - actorUserId sale de CurrentUser para audit.
  - PATCH mantiene permiso tenant.manage.
  - GET mantiene permiso tenant.read.
  - country se normaliza contra @hr-app/geo.
  - phone se normaliza a E.164 con libphonenumber-js via @hr-app/geo.
  - contactEmail queda como lectura/historico y no se acepta en PATCH.
  - approval de CompanySignupRequest crea TenantProfile para tenants nuevos.

Frontend:
  - RTK Query conoce TenantSettings.profile.
  - Company settings muestra Company profile.
  - Usa CountrySelect, PhoneInput y skeletons.
  - Save changes solo se habilita cuando el formulario esta dirty.
  - Workspace slug queda disabled.
  - Contact email no se muestra ni se envia desde Company Settings.
  - El payload envia profile anidado.

Tests:
  - UpdateCurrentTenantUseCase cubre normalizacion profile y phone invalido.
  - UpdateCurrentTenantDto rechaza profile.contactEmail con ValidationPipe.
  - ApproveCompanySignupRequestUseCase cubre creacion de TenantProfile.
  - CompanySettingsPage cubre slug disabled, dirty state, payload profile y que contactEmail no se expone.
```

Verificacion ejecutada:

```bash
corepack pnpm --filter @hr-app/database db:generate
corepack pnpm --filter @hr-app/database typecheck
corepack pnpm --filter @hr-app/api typecheck
corepack pnpm --filter @hr-app/web typecheck
corepack pnpm --filter @hr-app/api test -- approve-company-signup-request.use-case.spec.ts update-current-tenant.use-case.spec.ts create-organization-record.use-case.spec.ts
corepack pnpm --filter @hr-app/web test -- company-settings-structure.test.tsx
```

Nota local:

```txt
db:migrate quedo bloqueado tras timeout y el proceso colgado fue detenido.
db:deploy luego reporto que localhost:5434 no estaba disponible.
Antes de probar manualmente en local, levantar Postgres/Docker y ejecutar:

corepack pnpm --filter @hr-app/database db:deploy
```

## Fuera De Alcance

No implementar todavia:

```txt
legalName
taxId
billing fields
logo upload
address normalization
industry catalog
```
