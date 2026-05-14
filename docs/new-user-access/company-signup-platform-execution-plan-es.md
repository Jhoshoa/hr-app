# Plan De Ejecucion: Company Signup, Platform Owner Y Aprobacion De Acceso

Creado: 13 de mayo de 2026.

Documentos base:

```text
docs/new-user-access/company-signup-and-access-approval-plan.md
docs/new-user-access/platform-owner-bootstrap-and-auth-es.md
```

## Objetivo

Implementar el flujo completo, por fases pequenas y verificables:

```text
public company signup
platform admin approval
tenant provisioning
first tenant owner access
platform owner bootstrap
```

Regla central:

```text
Supabase Auth autentica identidad.
La base de datos de la app autoriza acceso.
```

Rutas tenant-scoped:

```text
Supabase identity -> User -> TenantMembership -> permissions
```

Rutas platform:

```text
Supabase identity -> User -> PlatformUserRole
```

No crear un tenant falso llamado `platform`.

## Estado Actual Del Codigo

### Backend

El backend usa NestJS con modulos por dominio:

```text
apps/api/src/modules/identity
apps/api/src/modules/tenants
apps/api/src/modules/organization
apps/api/src/modules/audit
```

Guards globales actuales:

```text
AuthGuard
TenantGuard
PermissionsGuard
```

Patron actual:

```text
AuthGuard resuelve User desde Supabase.
TenantGuard requiere x-tenant-slug salvo @SkipTenant().
PermissionsGuard revisa request.tenant.permissions.
```

Ya existe:

```text
@Public()
@SkipTenant()
@Permissions()
@CurrentUser()
@CurrentTenant()
```

El modelo actual de `User` todavia requiere:

```prisma
externalAuthProvider String @default("supabase")
externalAuthUserId   String @unique
```

Esto bloquea usuarios pendientes creados por aprobacion de company signup. Debe cambiar
a nullable.

### Frontend

El frontend usa Next.js App Router, Redux Toolkit y RTK Query.

Patrones importantes:

```text
baseApi.injectEndpoints()
react-hook-form + zod
useToast()
Skeleton
ErrorState
EmptyState
Button/Input/Card/SideDrawer/ConfirmDialog
```

`baseApi` agrega automaticamente:

```text
Authorization: Bearer <token>
x-tenant-slug: <currentTenantSlug>
```

Para rutas `/platform`, el backend debe usar `@SkipTenant()` para ignorar tenant context.

Riesgo actual:

```text
AppAccessGate redirige a /no-access si data.tenants.length === 0.
```

Eso debe cambiar porque un platform owner podria tener `PlatformUserRole` sin
`TenantMembership`.

## Principios De Implementacion

1. Mantener los patrones existentes.
2. No mezclar roles de tenant con roles de plataforma.
3. No crear tenant falso `platform`.
4. Validar en frontend solo para UX; validar siempre en backend.
5. Usar constraints de base de datos para unicidad final.
6. Hacer aprobacion dentro de transaccion.
7. No depender de emails ni jobs para el estado critico de acceso.
8. No permitir doble submit desde UI.
9. Manejar `409 Conflict` con mensajes claros.
10. Agregar tests por fase antes de ampliar superficie.

## Phase 0: Preparacion Y Decisiones Cerradas

### Decisiones

Usar estos defaults para v1:

```text
tenant access por x-tenant-slug por ahora
slug no editable despues de approval
signup requests no expiran en v1
companyWebsite solo warning, no bloqueo hard
primer owner membership ACTIVE al aprobar
PLATFORM_SUPPORT puede ver, no aprobar
```

Para admin email:

```text
User.email es unico global.
Un mismo User puede tener varios TenantMembership.
No bloquear automaticamente si adminEmail ya existe como User.
Bloquear solo pending duplicate si decidimos evitar solicitudes simultaneas del mismo email.
```

### Archivos A Revisar Antes De Cambiar

```text
packages/database/prisma/schema.prisma
packages/database/prisma/seed.ts
apps/api/src/common/guards/*
apps/api/src/modules/identity/*
apps/api/src/modules/tenants/*
apps/web/src/features/api/base-api.ts
apps/web/src/components/auth/app-access-gate.tsx
apps/web/src/components/app-shell/*
```

## Phase 1: Base De Datos Y Prisma

### Objetivo

Permitir usuarios pendientes, registrar signup requests y roles globales de plataforma.

### Cambios Prisma

Actualizar `User`:

```prisma
model User {
  id                   String             @id @default(uuid()) @db.Uuid
  email                String             @unique
  name                 String?
  status               UserStatus         @default(INVITED)
  externalAuthProvider String?
  externalAuthUserId   String?            @unique
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
  memberships          TenantMembership[]
  platformRoles        PlatformUserRole[]
  reviewedSignups      CompanySignupRequest[] @relation("CompanySignupReviewedBy")
  auditEvents          AuditEvent[]
  employees            Employee[]

  @@index([email])
  @@index([externalAuthProvider, externalAuthUserId])
}
```

Agregar enums:

```prisma
enum CompanySignupStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

enum PlatformRoleKey {
  PLATFORM_OWNER
  PLATFORM_ADMIN
  PLATFORM_SUPPORT
}
```

Agregar `CompanySignupRequest`:

```prisma
model CompanySignupRequest {
  id                 String              @id @default(uuid()) @db.Uuid
  companyName        String
  desiredTenantSlug  String
  adminFirstName     String
  adminLastName      String
  adminEmail         String
  companyWebsite     String?
  companySize        String?
  country            String?
  timezone           String?
  preferredLanguage  String              @default("es")
  phone              String?
  message            String?
  status             CompanySignupStatus @default(PENDING)
  approvedTenantId   String?             @db.Uuid
  reviewedByUserId   String?             @db.Uuid
  reviewedAt         DateTime?
  rejectionReason    String?
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt

  approvedTenant     Tenant?             @relation("CompanySignupApprovedTenant", fields: [approvedTenantId], references: [id], onDelete: SetNull)
  reviewedBy         User?               @relation("CompanySignupReviewedBy", fields: [reviewedByUserId], references: [id], onDelete: SetNull)

  @@index([status, createdAt])
  @@index([adminEmail])
  @@index([desiredTenantSlug])
}
```

Tambien agregar el lado inverso en `Tenant`:

```prisma
approvedCompanySignups CompanySignupRequest[] @relation("CompanySignupApprovedTenant")
```

Agregar `PlatformUserRole`:

```prisma
model PlatformUserRole {
  id        String          @id @default(uuid()) @db.Uuid
  userId    String          @db.Uuid
  roleKey   PlatformRoleKey
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
  user      User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, roleKey])
  @@index([roleKey])
}
```

### Migracion

Crear migracion Prisma:

```text
pnpm db:migrate
pnpm db:generate
```

Precaucion:

```text
externalAuthUserId pasa de required a nullable.
Verificar que la migracion no pierda datos existentes.
```

### Tests/Verificacion

```text
pnpm --filter @hr-app/database typecheck
pnpm --filter @hr-app/api typecheck
```

## Phase 2: Identity Pending Users Y Platform Roles

### Objetivo

Permitir que el login con Google conecte con un `User` creado previamente por email.

### Backend

Actualizar entidades y tipos:

```text
apps/api/src/modules/identity/domain/entities/authenticated-user.entity.ts
apps/api/src/common/types/request-context.ts
apps/api/src/modules/identity/domain/ports/users.repository.port.ts
apps/api/src/modules/identity/infrastructure/persistence/prisma-users.repository.ts
apps/api/src/modules/identity/application/use-cases/resolve-authenticated-user.use-case.ts
```

### Logica De Resolucion

Nuevo orden:

```text
1. Buscar por externalAuthProvider + externalAuthUserId.
2. Si existe, sincronizar email/name y retornar.
3. Si no existe, buscar por email normalizado.
4. Si existe por email y no tiene externalAuthUserId, vincular provider + providerUserId.
5. Si existe por email y ya tiene otro externalAuthUserId, rechazar o auditar conflicto.
6. Si no existe, crear User ACTIVE sin tenant access.
```

Repositorio requerido:

```ts
findByExternalAuthId(provider, providerUserId)
findByEmail(email)
linkExternalAuthUser(userId, externalUser)
createFromExternalUser(externalUser)
syncExternalUserProfile(userId, externalUser)
findPlatformRolesByUserId(userId)
```

`AuthenticatedUserContext` debe incluir platform roles:

```ts
platformRoles: PlatformRoleKey[];
```

`/me` debe devolver:

```ts
{
  user,
  tenants,
  platformRoles
}
```

### Validacion Google

Si `ExternalAuthUser` puede exponer email verified, exigirlo para vincular usuarios
pendientes. Si Supabase provider actual no lo expone, dejar TODO explicito en el provider
y validar lo disponible en metadata.

### Tests

Unit tests:

```text
resolve user by external auth id
link pending user by email
create new user with no tenant access
do not auto-grant tenant access
return platform roles in /me
```

## Phase 3: Platform Authorization

### Objetivo

Crear autorizacion global para rutas `/platform`.

### Backend

Agregar decorator:

```text
apps/api/src/common/decorators/platform-roles.decorator.ts
```

Ejemplo:

```ts
@PlatformRoles("PLATFORM_OWNER", "PLATFORM_ADMIN")
```

Agregar guard:

```text
apps/api/src/common/guards/platform-roles.guard.ts
```

Orden recomendado de guards globales:

```text
AuthGuard
TenantGuard
PlatformRolesGuard
PermissionsGuard
```

Tambien puede registrarse `PlatformRolesGuard` antes de `PermissionsGuard`; lo importante
es que `AuthGuard` ya haya resuelto `request.user`.

Las rutas platform deben usar:

```ts
@SkipTenant()
@PlatformRoles("PLATFORM_OWNER", "PLATFORM_ADMIN")
```

`PLATFORM_SUPPORT`:

```text
permitir GET/list/detail
denegar approve/reject
```

### Tests

```text
platform route sin token -> 401
platform route con tenant owner pero sin platform role -> 403
platform route con PLATFORM_SUPPORT en approve -> 403
platform route con PLATFORM_ADMIN en approve -> 200/expected use case
```

## Phase 4: Seeders Y Bootstrap Local

### Objetivo

Crear el primer platform owner por email sin crear password.

### Env

Agregar a `.env.example`:

```env
PLATFORM_OWNER_EMAIL=
SEED_SAMPLE_COMPANY_SIGNUPS=true
```

Actualizar backend env schema/config si el API necesita leerlo. Para `packages/database`
seed puede leer `process.env.PLATFORM_OWNER_EMAIL` directamente.

### Seeder

Actualizar:

```text
packages/database/prisma/seed.ts
```

Logica:

```text
1. Seed assuresoft-demo.
2. Seed permissions.
3. Seed owner role y role permissions.
4. Si PLATFORM_OWNER_EMAIL existe:
   - upsert User por email.
   - status ACTIVE o INVITED.
   - externalAuthProvider/externalAuthUserId null.
   - upsert PlatformUserRole PLATFORM_OWNER.
   - opcional: upsert TenantMembership owner de assuresoft-demo solo en development.
5. Si SEED_SAMPLE_COMPANY_SIGNUPS=true:
   - crear 2-3 CompanySignupRequest PENDING.
   - crear 1 REJECTED/APPROVED solo si ayuda para UI.
```

Precaucion:

```text
El seeder no debe crear passwords.
El seeder no debe correr privilegios permanentes en produccion.
```

### Produccion

Planear comando futuro:

```text
pnpm platform:grant-owner --email admin@empresa.com
```

No implementarlo en el primer slice si retrasa el flujo principal.

## Phase 5: Backend Public Company Signup

### Objetivo

Crear endpoint publico para recibir solicitudes sin crear tenant ni acceso inmediato.

### Modulo Nuevo

Crear modulo:

```text
apps/api/src/modules/company-signups/company-signups.module.ts
apps/api/src/modules/company-signups/presentation/controllers/company-signup-requests.controller.ts
apps/api/src/modules/company-signups/presentation/dto/*
apps/api/src/modules/company-signups/application/use-cases/*
apps/api/src/modules/company-signups/domain/entities/*
apps/api/src/modules/company-signups/domain/ports/company-signup-requests.repository.port.ts
apps/api/src/modules/company-signups/infrastructure/persistence/prisma-company-signup-requests.repository.ts
```

Seguir el estilo de `organization` y `tenants`: use cases pequenos, repository port,
Prisma repository.

### Endpoints Publicos

```text
POST /api/v1/company-signup-requests
GET /api/v1/company-signup-requests/availability/tenant-slug?value=<slug>
GET /api/v1/company-signup-requests/availability/admin-email?value=<email>
GET /api/v1/company-signup-requests/availability/company-website?value=<url>
```

Decorators:

```ts
@Public()
@SkipTenant()
```

### DTO: CreateCompanySignupRequestDto

Validaciones:

```text
companyName: required, 2-160
desiredTenantSlug: required, 3-63, lowercase/url-safe
adminFirstName: required, 1-80
adminLastName: required, 1-80
adminEmail: required, email, normalized lowercase
companyWebsite: optional, url/domain, max 200
companySize: optional enum/string allowed
country: optional, max 80
timezone: optional, max 80
preferredLanguage: es/en
phone: optional, max 40
message: optional, max 1000
```

Reserved slugs:

```text
www, api, admin, app, login, signup, support, help, docs, platform
```

### Create Use Case

Logica:

```text
1. Normalizar email y slug.
2. Validar formato slug y reserved slugs.
3. Verificar Tenant.slug existente.
4. Verificar CompanySignupRequest PENDING con desiredTenantSlug.
5. Verificar CompanySignupRequest PENDING con adminEmail si se decide bloquear pending simultaneo.
6. Detectar website/domain duplicado como warning o metadata, no bloquear por defecto.
7. Crear request PENDING.
8. Publicar CompanySignupRequestSubmitted en EventBus.
```

Errores:

```text
409 TENANT_SLUG_UNAVAILABLE: slug ya existe como tenant.
409 SIGNUP_REQUEST_PENDING_FOR_SLUG: ya existe solicitud pendiente para ese slug.
409 SIGNUP_REQUEST_PENDING_FOR_EMAIL: ya existe solicitud pendiente para ese email, si se habilita esa regla.
400 VALIDATION_FAILED: datos invalidos.
```

Respuesta recomendada:

```ts
{
  id: string;
  status: "PENDING";
  companyName: string;
  desiredTenantSlug: string;
  adminEmail: string;
  createdAt: string;
}
```

### Availability Responses

Tenant slug:

```ts
{
  value: string;
  available: boolean;
  reason?: "INVALID_FORMAT" | "RESERVED" | "TENANT_EXISTS" | "PENDING_REQUEST_EXISTS";
}
```

Admin email:

```ts
{
  value: string;
  available: boolean;
  reason?: "PENDING_REQUEST_EXISTS";
  existingUser: boolean;
  canReuseExistingUser: boolean;
}
```

Website:

```ts
{
  value: string;
  duplicateWarning: boolean;
  matchingPendingRequestCount: number;
}
```

### Tests

```text
create pending signup
reject reserved slug
reject existing tenant slug
reject duplicate pending slug
reject duplicate pending admin email if rule enabled
do not create tenant on public signup
do not require auth on public signup
availability endpoints return expected status
```

## Phase 6: Backend Platform Approval

### Objetivo

Permitir a platform admins listar, revisar, aprobar y rechazar solicitudes.

### Endpoints Platform

```text
GET /api/v1/platform/company-signup-requests
GET /api/v1/platform/company-signup-requests/:id
POST /api/v1/platform/company-signup-requests/:id/approve
POST /api/v1/platform/company-signup-requests/:id/reject
```

Decorators:

```ts
@SkipTenant()
@PlatformRoles("PLATFORM_OWNER", "PLATFORM_ADMIN", "PLATFORM_SUPPORT") // list/detail
@PlatformRoles("PLATFORM_OWNER", "PLATFORM_ADMIN") // approve/reject
```

### List Query

Filtros v1:

```text
status=PENDING|APPROVED|REJECTED|CANCELLED
search=company/adminEmail/slug
page
pageSize
```

Respuesta:

```ts
{
  items: CompanySignupRequestListItem[];
  page: number;
  pageSize: number;
  total: number;
}
```

### Approve DTO

```ts
{
  finalTenantSlug?: string;
  initialAdminRoleKey?: "owner";
}
```

### Approve Use Case

Debe correr en transaccion:

```text
1. Fetch request.
2. Confirmar status PENDING.
3. Normalizar finalTenantSlug o usar desiredTenantSlug.
4. Verificar slug final disponible.
5. Crear Tenant.
6. Crear roles default del tenant.
7. Adjuntar permisos default al owner role.
8. Upsert User por adminEmail:
   - si existe, actualizar name si corresponde.
   - si no existe, crear INVITED con externalAuth null.
9. Upsert TenantMembership ACTIVE owner.
10. Marcar CompanySignupRequest APPROVED.
11. Guardar approvedTenantId, reviewedByUserId, reviewedAt.
12. Crear AuditEvent con tenantId null o approvedTenantId segun consulta deseada.
13. Publicar CompanySignupRequestApproved, TenantProvisioned, TenantOwnerGranted.
```

Precauciones:

```text
Si request no esta PENDING -> 409.
Si slug final ya existe -> 409.
Si tenant se crea pero membership falla, rollback completo.
No enviar emails dentro de la transaccion.
```

### Reject DTO

```ts
{
  rejectionReason: string;
}
```

Validacion:

```text
required, 3-1000
```

Logica:

```text
1. Confirmar PENDING.
2. Set status REJECTED.
3. Set reviewedByUserId, reviewedAt, rejectionReason.
4. AuditEvent.
5. EventBus CompanySignupRequestRejected.
```

### Default Tenant Roles

Evitar duplicar logica dispersa. Crear helper o use case reusable:

```text
CreateDefaultTenantAccessUseCase
```

Debe crear al menos:

```text
owner
```

Puede agregar luego:

```text
hr_admin
manager
employee
```

En v1, owner recibe todos los permissions existentes como hace `seed.ts`.

### Tests

```text
list requires platform role
support can list/detail
support cannot approve/reject
approve creates tenant
approve creates owner role permissions
approve creates pending User when not exists
approve links existing User by email without creating duplicate
approve creates ACTIVE TenantMembership
approve marks request APPROVED
approve cannot run twice
reject marks request REJECTED
reject cannot run after approve
tenant owner without platform role cannot access /platform endpoints
```

## Phase 7: Frontend Auth Gate Y Platform Access

### Objetivo

Permitir que un platform owner sin tenants entre a `/platform`.

### Types

Actualizar:

```text
apps/web/src/types/identity.ts
apps/web/src/features/auth/current-user-api.ts
```

`MeResponse` debe incluir:

```ts
platformRoles: PlatformRoleKey[];
```

### AppAccessGate

Cambiar logica:

```text
si tenants.length === 0 y platformRoles.length === 0 -> /no-access
si tenants.length === 0 y platformRoles.length > 0 -> permitir rutas /platform
si esta en ruta tenant app sin tenant -> redirigir a /platform/company-signups o selector futuro
```

Implementacion cautelosa:

```text
No romper cache actual de tenants.
Agregar platformRoles a workspace-cache o separar platform-access-cache.
No seleccionar tenant fake.
```

### Platform Route Group

Crear ruta separada:

```text
apps/web/app/(platform)/platform/company-signups/page.tsx
```

O, si se quiere compartir `AuthGuard`, crear layout:

```text
apps/web/app/(platform)/layout.tsx
```

Layout platform:

```text
AuthGuard
PlatformAccessGate
PlatformShell
```

No usar `AppShell` tenant-scoped si requiere `TenantIdentity` o current tenant.

### Platform Shell

Crear UI simple siguiendo estilos existentes:

```text
apps/web/src/components/platform-shell/platform-shell.tsx
apps/web/src/components/platform-shell/platform-sidebar-nav.tsx
apps/web/src/components/platform-shell/platform-top-bar.tsx
```

Nav inicial:

```text
Company signups
Tenants (placeholder/futuro)
Platform users (placeholder/futuro)
```

## Phase 8: Frontend Public Company Signup

### Objetivo

Crear formulario publico con validacion, debounce y doble-submit protection.

### Rutas Y Archivos

```text
apps/web/app/company-signup/page.tsx
apps/web/src/features/company-signup/company-signup-api.ts
apps/web/src/features/company-signup/company-signup-schema.ts
apps/web/src/features/company-signup/components/company-signup-page.tsx
```

Usar:

```text
baseApi.injectEndpoints()
react-hook-form
zod
useToast()
Button disabled={isSubmitting || mutation.isLoading}
```

Agregar tags:

```text
CompanySignupRequest
CompanySignupAvailability
```

### UI

Campos:

```text
company name
desired tenant slug
admin first name
admin last name
admin email
company website
company size
country
timezone
preferred language
phone number
optional message
```

Skeleton:

```text
No se necesita initial skeleton para formulario publico estatico.
Si se cargan options desde API en el futuro, skeleton por select.
```

Estados visuales:

```text
slug checking
slug available
slug unavailable
admin email checking
admin email has pending request
website possible duplicate warning
submit loading
submit success
submit conflict
```

### Debounce

Implementar hook local o util:

```text
400ms a 700ms
```

Solo consultar availability si:

```text
campo touched
valor pasa validacion local
valor cambio desde ultima consulta
```

### Doble Submit

Reglas:

```text
Deshabilitar boton mientras create mutation esta loading.
Ignorar submit si isSubmitting true.
No limpiar formulario hasta que el backend confirme success.
Mostrar toast success y estado de confirmacion.
```

### Manejo De Errores

Usar `normalizeApiError`.

Mensajes:

```text
SIGNUP_REQUEST_PENDING_FOR_SLUG:
Ya existe una solicitud pendiente para este workspace.

SIGNUP_REQUEST_PENDING_FOR_EMAIL:
Ya existe una solicitud pendiente para este email y esta en proceso de aprobacion.

TENANT_SLUG_UNAVAILABLE:
Este workspace ya esta registrado.

VALIDATION_FAILED:
Revisa los datos del formulario.
```

Toasts:

```text
success: Solicitud enviada
error conflict: Solicitud ya existe o esta pendiente
error generic: No se pudo enviar la solicitud
```

## Phase 9: Frontend Platform Company Signups

### Objetivo

Crear dashboard interno para revisar y aprobar/rechazar requests.

### Archivos

```text
apps/web/src/features/platform/company-signups/platform-company-signups-api.ts
apps/web/src/features/platform/company-signups/platform-company-signups-types.ts
apps/web/src/features/platform/company-signups/components/platform-company-signups-page.tsx
apps/web/src/features/platform/company-signups/components/company-signup-detail-drawer.tsx
apps/web/src/features/platform/company-signups/components/approve-company-signup-dialog.tsx
apps/web/src/features/platform/company-signups/components/reject-company-signup-dialog.tsx
```

### RTK Query

Endpoints:

```ts
listPlatformCompanySignups
getPlatformCompanySignup
approvePlatformCompanySignup
rejectPlatformCompanySignup
```

Tags:

```text
CompanySignupRequest LIST
CompanySignupRequest <id>
Tenant LIST/current invalidation optional after approval
CurrentUser optional invalidation if approving current user's own email in local dev
```

### List UI

Usar estilo de tablas existentes.

Columnas:

```text
Company
Desired slug
Admin email
Website
Status
Submitted
Reviewed
Actions
```

Filtros:

```text
status tabs: Pending, Approved, Rejected, All
search input
```

Skeleton inicial:

```text
PageHeader skeleton opcional
filter row skeleton
table skeleton con 6-8 rows
```

Estados:

```text
isLoading -> skeleton
isError -> ErrorState
empty -> EmptyState
isFetching con data -> mantener tabla y mostrar loading sutil
```

### Detail Drawer

Mostrar:

```text
company details
admin details
website/phone/message
availability signals
review metadata
approved tenant id si existe
```

Skeleton:

```text
field label skeleton + value skeleton
message block skeleton
```

### Approve Dialog

Campos:

```text
finalTenantSlug
initialAdminRoleKey = owner
```

Validaciones:

```text
slug required, lowercase, url-safe
availability check antes de habilitar approve
```

Doble submit:

```text
disabled mientras approve mutation loading
ConfirmDialog isWorking
```

Success:

```text
toast success: Company approved
invalidar list/detail
cerrar dialog/drawer
```

Conflict:

```text
toast error: This request was already reviewed or the slug is no longer available.
refetch detail
```

### Reject Dialog

Campos:

```text
rejectionReason
```

Validaciones:

```text
required 3-1000
```

Success:

```text
toast success: Signup rejected
invalidar list/detail
```

## Phase 10: Navigation Y Permisos Frontend

### Objetivo

Separar navegacion tenant y navegacion platform.

### Tenant App

Mantener:

```text
src/config/navigation.ts
PermissionGate
TenantMembership permissions
```

### Platform App

Crear helpers:

```text
src/config/platform-roles.ts
src/hooks/use-platform-roles.ts
src/components/platform-shell/platform-role-gate.tsx
```

Helper:

```ts
hasAnyPlatformRole(platformRoles, ["PLATFORM_OWNER", "PLATFORM_ADMIN"])
```

No reutilizar `PermissionGate` para platform porque ese gate depende de tenant
permissions.

## Phase 11: Auditoria Y Eventos

### Objetivo

Registrar acciones importantes sin bloquear flujo en jobs secundarios.

### Audit Events

Acciones recomendadas:

```text
company_signup_request.created
company_signup_request.approved
company_signup_request.rejected
tenant.provisioned
tenant_owner.granted
platform_role.granted
```

Para eventos platform:

```text
tenantId: null cuando la accion ocurre antes de tenant
actorUserId: platform admin user id cuando existe
resourceType: CompanySignupRequest
resourceId: request.id
metadata: slug, adminEmail, approvedTenantId
```

### EventBus

Usar `InMemoryEventBus` actual para publicar eventos. No depender de esto para crear
tenant/membership.

## Phase 12: Pruebas End-To-End Y Criterios De Aceptacion

### Backend Typecheck/Test

```text
pnpm --filter @hr-app/api typecheck
pnpm --filter @hr-app/api test
pnpm --filter @hr-app/database typecheck
```

### Frontend Typecheck/Test

```text
pnpm --filter @hr-app/web typecheck
pnpm --filter @hr-app/web test
```

### Flujo Manual Minimo

1. Seed con `PLATFORM_OWNER_EMAIL`.
2. Login con Google usando ese email.
3. Entrar a `/platform/company-signups` sin tenant membership.
4. Abrir `/company-signup`.
5. Enviar solicitud publica.
6. Ver la solicitud como PENDING en dashboard platform.
7. Aprobar solicitud.
8. Confirmar que se creo Tenant.
9. Confirmar que se creo o reutilizo User por adminEmail.
10. Confirmar `TenantMembership` ACTIVE owner.
11. Login con Google como first owner.
12. Confirmar `/me` devuelve tenant access.

### Casos De Error Obligatorios

```text
doble submit del mismo formulario no crea duplicado
slug existente devuelve 409
slug con pending request devuelve 409
pending email devuelve 409 si regla habilitada
tenant owner sin platform role no puede aprobar
platform support no puede aprobar
approval doble devuelve 409
reject doble devuelve 409
```

## Orden Recomendado De Implementacion

1. Phase 1: Prisma schema + migration.
2. Phase 2: pending users + `/me` platformRoles.
3. Phase 3: platform roles guard/decorator.
4. Phase 4: seed `PLATFORM_OWNER_EMAIL`.
5. Phase 5: public signup endpoint + tests.
6. Phase 6: platform approval endpoints + tests.
7. Phase 7: frontend auth/platform gate.
8. Phase 8: public signup UI.
9. Phase 9: platform dashboard UI.
10. Phase 10: navigation gates.
11. Phase 11: audit/events polish.
12. Phase 12: e2e/manual verification.

## Riesgos Y Precauciones

### Riesgo: Platform Owner Sin Tenant

Hoy la app asume que usuario autenticado sin tenants no tiene acceso. Esto debe cambiar
antes de probar platform dashboard.

Solucion:

```text
/me devuelve platformRoles.
AppAccessGate permite acceso si platformRoles.length > 0.
PlatformShell no depende de currentTenant.
```

### Riesgo: baseApi Envia x-tenant-slug A Platform

No es critico si backend usa `@SkipTenant()`, pero los endpoints platform no deben leer
tenant context.

### Riesgo: Usuario Pendiente Y Login Google

Si `externalAuthUserId` sigue required, approval no puede crear User pendiente.

Solucion:

```text
hacer externalAuthProvider/externalAuthUserId nullable antes de approval.
```

### Riesgo: Race Conditions

Dos aprobaciones pueden intentar crear el mismo tenant slug.

Solucion:

```text
Tenant.slug @unique.
Transaccion.
Capturar Prisma unique error y devolver 409.
Verificar status PENDING dentro de transaccion.
```

### Riesgo: Doble Submit Frontend

El frontend debe prevenir doble submit, pero backend debe ser idempotente/seguro.

Solucion:

```text
Boton disabled mientras loading.
Backend bloquea duplicate pending slug/email.
DB unique final para tenant slug.
```

### Riesgo: Mezclar PlatformRole Con Permissions

No agregar permissions tipo `platform.approve` a roles tenant en v1.

Solucion:

```text
PlatformUserRole separado.
PlatformRolesGuard separado.
PermissionGate solo tenant.
PlatformRoleGate solo platform.
```

## Definition Of Done

El feature esta listo cuando:

```text
public signup crea solo CompanySignupRequest PENDING
availability endpoints funcionan con debounce desde UI
platform owner puede entrar sin tenant
platform dashboard lista PENDING requests
approve crea tenant + roles + first admin user + membership en una transaccion
reject deja audit trail
first admin puede logearse con Google y recibir tenant access
tenant owner no puede acceder a /platform
platform roles no dependen de TenantMembership
frontend muestra skeletons, empty states, errors y toasts
submit y approve/reject no se ejecutan dos veces desde UI
tests cubren duplicados, roles, approve/reject y pending user linking
```
