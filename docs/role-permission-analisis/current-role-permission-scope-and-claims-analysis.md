# Current Role, Permission, Scope And Claims Analysis

Fecha: 2026-05-14

## Objetivo

Analizar el estado actual de roles, permisos, scopes y claims en frontend,
backend y base de datos para planear la implementacion futura de:

```text
Settings / Access / Roles
Settings / Access / Users
Settings / Access / Invitations
```

Tambien evaluar si conviene agregar roles/permisos como claims en tokens JWT.

## Resumen Ejecutivo

El proyecto ya tiene una base correcta para RBAC multi-tenant:

```text
TenantMembership -> Role -> RolePermission -> Permission
```

Tambien existe un modelo separado para permisos platform:

```text
PlatformUserRole
```

Esto es una buena decision. Los permisos tenant-scoped y los roles platform no
deben mezclarse.

Estado actual:

```text
Backend:
  AuthGuard valida Supabase Auth.
  TenantGuard resuelve tenant por x-tenant-slug.
  PermissionsGuard valida permisos tenant-scoped.
  PlatformRolesGuard valida roles platform.
  /me devuelve tenants con roleKey + permissions.

Frontend:
  currentTenant contiene roleKey + permissions.
  PermissionGate oculta UI tenant-scoped segun permissions.
  usePlatformRoles y helpers controlan acciones platform.
  Sidebar tenant filtra navegacion por permissions.

DB:
  Role, Permission, RolePermission, TenantMembership ya existen.
  PlatformUserRole ya existe.
```

Lo que falta:

```text
No existe modulo/API para administrar roles.
No existe modulo/API para asignar roles a usuarios.
No existe modulo/API de invitations production-ready.
No existen role templates para HR Admin, Manager, Employee, etc.
No existe UI Settings / Access / Roles.
No existe UI Settings / Access / Users.
No existe UI Settings / Access / Invitations.
No existe versionado o invalidacion fina cuando cambian permisos.
No existen roles/permisos en claims JWT.
```

Recomendacion principal:

```text
No usar JWT claims como fuente de verdad para roles/permisos tenant-scoped.
Mantener la app DB como source of truth.
Usar /me y TenantGuard para autorizacion real.
Claims pueden agregarse mas adelante solo como optimizacion o metadata no critica.
```

## 1. Modelo Actual En Base De Datos

Archivo:

```text
packages/database/prisma/schema.prisma
```

### TenantMembership

```prisma
model TenantMembership {
  id        String
  tenantId  String
  userId    String
  roleId    String
  status    MembershipStatus
  invitedAt DateTime
  joinedAt  DateTime?
}
```

Reglas actuales:

```text
Un usuario puede tener un membership por tenant.
Cada membership apunta a un solo Role.
El status controla acceso: INVITED, ACTIVE, DISABLED.
```

Implicacion:

```text
Hoy un usuario tiene un solo rol por tenant.
```

Esto es simple y suficiente para v1. Si mas adelante se necesitan multiples
roles por usuario dentro del mismo tenant, habria que cambiar a una tabla
intermedia:

```text
TenantMembershipRole
```

No recomiendo hacerlo ahora salvo que exista una necesidad real.

### Role

```prisma
model Role {
  id           String
  tenantId     String?
  key          String
  name         String
  description  String?
  isSystemRole Boolean
}
```

Reglas actuales:

```text
Role puede ser tenant-scoped porque tenantId existe.
tenantId nullable permite roles globales/templates, aunque hoy no esta formalizado.
Role key es unico por tenant.
```

Constraint:

```prisma
@@unique([tenantId, key])
```

### Permission

```prisma
model Permission {
  id          String
  key         String @unique
  description String
}
```

Permisos son globales y no tenant-scoped. Eso es correcto: el catalogo de
permisos pertenece al producto, no a cada tenant.

### RolePermission

```prisma
model RolePermission {
  roleId       String
  permissionId String
}
```

Asigna permisos a roles.

### PlatformUserRole

```prisma
model PlatformUserRole {
  userId  String
  roleKey PlatformRoleKey
}
```

Roles platform actuales:

```text
PLATFORM_OWNER
PLATFORM_ADMIN
PLATFORM_SUPPORT
```

Esto esta separado de TenantMembership. Correcto.

## 2. Permisos Seeded Actualmente

Archivo:

```text
packages/database/prisma/seed.ts
```

Permisos actuales:

```text
tenant.read
tenant.manage
users.read
users.manage
roles.manage
audit.read
organization.read
organization.manage
employees.read
employees.self.read
employees.team.read
employees.manage
employees.compensation.read
employees.compensation.manage
employees.custom-fields.manage
```

Estado:

```text
El seed crea Permission globales.
El seed crea role owner por tenant.
El role owner recibe todos los permisos.
```

Gaps:

```text
No se crean roles iniciales como hr_admin, hr_staff, manager, employee, recruiter, finance_viewer.
No hay grupos/categorias de permisos para UI.
No hay orden/display metadata para permisos.
No hay permission dependencies.
```

## 3. Backend Authorization Actual

### AuthGuard

Archivo:

```text
apps/api/src/common/guards/auth.guard.ts
```

Responsabilidad:

```text
1. Extrae Bearer token.
2. Verifica token con AuthProvider/Supabase.
3. Resuelve o crea User local.
4. Adjunta request.user.
```

Punto importante:

```text
El JWT identifica identidad.
No autoriza tenant access.
```

### ResolveAuthenticatedUserUseCase

Archivo:

```text
apps/api/src/modules/identity/application/use-cases/resolve-authenticated-user.use-case.ts
```

Responsabilidad:

```text
1. Buscar User por externalAuthProvider + externalAuthUserId.
2. Si no existe, buscar por email.
3. Linkear pending user si email verificado.
4. Crear user local si no existe.
5. Cargar platformRoles.
```

Devuelve:

```ts
AuthenticatedUserContext {
  id
  email
  name
  externalAuthProvider
  externalAuthUserId
  platformRoles
}
```

No devuelve permisos tenant-scoped. Correcto, porque dependen del tenant actual.

### TenantGuard

Archivo:

```text
apps/api/src/common/guards/tenant.guard.ts
```

Responsabilidad:

```text
1. Ignora rutas @Public.
2. Ignora rutas @SkipTenant.
3. Lee x-tenant-slug.
4. ResolveTenantContextUseCase valida acceso.
5. Adjunta request.tenant.
```

Gap:

```text
No valida formato de x-tenant-slug dentro del guard.
La validacion real ocurre al buscar membership/tenant, pero conviene endurecerlo.
```

### ResolveTenantContextUseCase

Archivo:

```text
apps/api/src/modules/identity/application/use-cases/resolve-tenant-context.use-case.ts
```

Responsabilidad:

```text
Busca membership ACTIVE del user en tenantSlug ACTIVE.
Devuelve tenantId, tenantSlug, tenantName, roleKey y permissions.
```

La query real incluye:

```text
membership.status = ACTIVE
tenant.status = ACTIVE
role.permissions.permission
```

Esto es la fuente de autorizacion tenant-scoped actual.

### PermissionsGuard

Archivo:

```text
apps/api/src/common/guards/permissions.guard.ts
```

Responsabilidad:

```text
Lee @Permissions(...)
Compara contra request.tenant.permissions
Exige que esten todos los permisos requeridos
```

Comportamiento:

```text
AND semantics: requiredPermissions.every(...)
```

Esto significa:

```text
@Permissions("a", "b") requiere a Y b.
```

Si mas adelante necesitamos OR semantics, habria que agregar otro decorator:

```text
@AnyPermission("a", "b")
```

### PlatformRolesGuard

Archivo:

```text
apps/api/src/common/guards/platform-roles.guard.ts
```

Responsabilidad:

```text
Lee @PlatformRoles(...)
Compara contra request.user.platformRoles
Exige al menos uno
```

Comportamiento:

```text
OR semantics: requiredRoles.some(...)
```

Esto es correcto para platform access.

## 4. Endpoint /me Actual

Archivo:

```text
apps/api/src/modules/identity/presentation/controllers/me.controller.ts
```

Respuesta actual:

```ts
{
  user,
  tenants: [
    {
      tenantId,
      tenantSlug,
      tenantName,
      roleKey,
      permissions
    }
  ],
  platformRoles
}
```

Frontend consume esto en:

```text
apps/web/src/features/auth/current-user-api.ts
```

Fortalezas:

```text
El frontend sabe que tenants tiene el usuario.
El frontend sabe roleKey y permissions por tenant.
El frontend puede filtrar navegacion y acciones.
El backend sigue siendo la fuente de autorizacion real.
```

Gaps:

```text
No devuelve roleId.
No devuelve roleName.
No devuelve membershipId.
No devuelve membershipStatus porque solo devuelve ACTIVE.
No devuelve permission metadata/categorias.
```

Para UI de usuarios/roles, probablemente necesitaremos endpoints separados,
no inflar `/me` demasiado.

## 5. Frontend Actual

### TenantSummary

Archivo:

```text
apps/web/src/types/identity.ts
```

Actual:

```ts
interface TenantSummary {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  roleKey: string;
  permissions: string[];
}
```

### PermissionGate

Archivo:

```text
apps/web/src/components/app-shell/permission-gate.tsx
```

Funcion:

```text
Oculta children si currentTenant.permissions no tiene alguno de los permisos requeridos.
```

Usa:

```ts
hasAnyPermission
```

Comportamiento:

```text
OR semantics en frontend.
```

Nota:

```text
Backend @Permissions usa AND semantics.
Frontend PermissionGate usa OR semantics.
```

Esto no es necesariamente malo, pero debe documentarse y usarse con cuidado.

### Sidebar Tenant

Archivo:

```text
apps/web/src/config/navigation.ts
```

Ejemplo:

```ts
Settings permissions: [
  "roles.manage",
  "organization.read",
  "organization.manage",
  "users.manage",
  "audit.read"
]
```

La navegacion se filtra por `hasAnyPermission`, entonces basta tener uno de esos
permisos para ver Settings.

### Platform Roles En Frontend

Archivos:

```text
apps/web/src/hooks/use-platform-roles.ts
apps/web/src/features/company-signup/platform-company-signups-utils.ts
```

Actual:

```ts
hasAnyPlatformRole(platformRoles, requiredRoles)
```

Se usa para platform UI. Correcto.

Gap:

```text
No existe PlatformRoleGate reusable.
No existe config central de permisos por action platform.
```

## 6. Scopes

Hoy no existe un modelo formal de `scope`.

Lo que el proyecto llama permisos son keys como:

```text
employees.read
organization.manage
roles.manage
```

Estos funcionan como scopes de aplicacion, pero estan modelados como
`Permission`.

Recomendacion:

```text
No crear otra entidad Scope ahora.
Usar Permission como capability/scope interno.
```

Si en el futuro integramos OAuth scopes externos, mantenerlos separados:

```text
OAuth scopes: permisos concedidos a third-party apps.
App permissions: permisos internos de usuarios dentro de tenants.
```

## 7. Claims En JWT

### Estado Actual

Supabase JWT contiene identidad Supabase. El backend usa Supabase AuthProvider
para verificar access token y luego resuelve autorizacion en DB local.

No hay roles/permisos tenant-scoped en JWT claims.

### Pregunta Clave

¿Deberiamos agregar roles/permisos del usuario al token como claims?

Respuesta recomendada:

```text
No como fuente de verdad para autorizacion.
```

Razones:

```text
1. Los roles/permisos cambian dinamicamente.
2. JWT puede seguir vivo hasta expirar.
3. Un usuario puede pertenecer a multiples tenants.
4. Claims de todos los tenants pueden crecer demasiado.
5. Revocar permisos seria dificil si el token sigue vigente.
6. La app ya tiene TenantGuard + PermissionsGuard resolviendo desde DB.
```

### Cuando Si Podria Tener Sentido

Claims pueden servir como optimizacion o metadata ligera:

```text
user_app_id
platform_roles
tenant_slugs resumidos
token_version
```

Pero no deberian reemplazar:

```text
TenantMembership
RolePermission
PermissionsGuard
```

### Multi-Tenant Claims Son Peligrosos

Ejemplo problematico:

```json
{
  "tenants": {
    "acme": {
      "role": "owner",
      "permissions": ["tenant.manage", "users.manage"]
    },
    "globex": {
      "role": "employee",
      "permissions": ["employees.self.read"]
    }
  }
}
```

Problemas:

```text
Token grande.
Permisos stale.
Revocacion lenta.
Complejidad para mantener claims sincronizados.
Riesgo de usar claims sin validar tenant activo.
```

### Recomendacion Para Este Proyecto

Para v1:

```text
No agregar roles/permisos tenant-scoped al JWT.
Mantener /me como snapshot frontend.
Mantener backend DB como source of truth.
```

Para futuro:

```text
Agregar tokenVersion o authzVersion si necesitamos invalidar sesiones.
Agregar claims solo para datos no sensibles o optimizacion.
```

## 8. Gaps Para Modulo De Roles Y Usuarios

### Backend Faltante

No existen modulos/endpoints para:

```text
GET /roles
POST /roles
GET /roles/:id
PATCH /roles/:id
POST /roles/:id/archive
POST /roles/:id/reactivate
PUT /roles/:id/permissions

GET /permissions
GET /users
GET /users/:id
PATCH /users/:id/membership
POST /users/:id/disable
POST /users/:id/reactivate

POST /invitations
GET /invitations
POST /invitations/:id/resend
POST /invitations/:id/cancel
POST /invitations/:token/accept
```

No hay:

```text
RolesModule
UsersAccessModule
InvitationsModule
```

### Frontend Faltante

No existen pantallas:

```text
/settings/roles
/settings/users
/settings/invitations
/settings/access
```

No existen componentes:

```text
Role list
Role editor
Permission matrix
User list
User role assignment drawer
Invitation form
Invitation status table
```

### Data Model Faltante

Para roles:

```text
Role.status
Role.isEditable?
Role.isArchived?
```

Actualmente Role no tiene status. Si se quiere soft delete/archive de roles, se
debe agregar:

```prisma
status RecordStatus @default(ACTIVE)
```

Para invitations:

```text
Invitation no existe todavia.
```

Modelo recomendado:

```prisma
TenantInvitation {
  id
  tenantId
  email
  roleId
  status PENDING/ACCEPTED/CANCELLED/EXPIRED
  invitedByUserId
  tokenHash
  expiresAt
  acceptedAt
  createdAt
  updatedAt
}
```

## 9. Diseño Recomendado Para Roles Dinamicos

### Role Types

Mantener:

```text
owner system role
custom tenant roles
```

Agregar templates seeded:

```text
owner
hr_admin
hr_staff
manager
employee
finance_viewer
recruiter
```

Decision:

```text
owner debe ser system role y no debe poder perder permisos criticos.
```

### Role Permissions

Una UI de matriz debe agrupar permisos por modulo:

```text
Tenant
Users
Roles
Organization
Employees
Compensation
Documents
Leave
Audit
```

Para eso conviene extender Permission:

```prisma
module String?
action String?
description String
```

No es obligatorio para v1, pero facilita UX.

### Constraints De Seguridad

Reglas:

```text
No permitir borrar/archive el ultimo owner activo del tenant.
No permitir quitar roles.manage al ultimo owner.
No permitir editar system roles peligrosos sin reglas especiales.
No permitir asignar un role de tenant A a membership de tenant B.
No permitir que un usuario se quite a si mismo el ultimo acceso admin critico sin confirmacion fuerte.
```

### Single Role Vs Multiple Roles

Actual:

```text
1 membership -> 1 role
```

Recomendacion v1:

```text
Mantener un rol por usuario por tenant.
```

Ventajas:

```text
UI mas simple.
Modelo actual ya lo soporta.
Menos ambiguedad.
Permisos efectivos son faciles de explicar.
```

Futuro:

```text
Si necesitamos multiples roles, agregar TenantMembershipRole.
No hacerlo ahora.
```

## 10. Diseño Recomendado Para Users + Role Assignment

### List Users

Endpoint tenant-scoped:

```text
GET /tenant-users
```

Devuelve:

```ts
{
  id: string;
  email: string;
  name?: string;
  membershipId: string;
  membershipStatus: "INVITED" | "ACTIVE" | "DISABLED";
  role: {
    id: string;
    key: string;
    name: string;
    isSystemRole: boolean;
  };
  joinedAt?: string;
}
```

Permiso:

```text
users.read
```

### Update User Role

Endpoint:

```text
PATCH /tenant-users/:membershipId/role
```

Body:

```ts
{ roleId: string }
```

Permiso:

```text
users.manage
```

Validaciones:

```text
role.tenantId == currentTenant.id
membership.tenantId == currentTenant.id
no romper ultimo owner
```

### Disable/Reactivate Membership

Endpoints:

```text
POST /tenant-users/:membershipId/disable
POST /tenant-users/:membershipId/reactivate
```

Permiso:

```text
users.manage
```

No borrar User global; desactivar membership por tenant.

## 11. Diseño Recomendado Para Invitations

### Create Invitation

Endpoint:

```text
POST /tenant-invitations
```

Body:

```ts
{
  email: string;
  roleId: string;
}
```

Permiso:

```text
users.manage
```

Logica:

```text
normalizar email
validar roleId pertenece al tenant actual
crear o reutilizar User INVITED
crear TenantInvitation PENDING
opcional crear TenantMembership INVITED o crearlo al aceptar
enviar email con token
```

Recomendacion:

```text
Crear TenantMembership INVITED al invitar.
Al aceptar, pasar a ACTIVE y joinedAt.
```

Esto permite que `/me` no devuelva access activo hasta aceptar.

### Accept Invitation

Flow:

```text
usuario abre link
login Supabase si no esta autenticado
backend valida tokenHash
backend valida email del token/session
membership pasa a ACTIVE
invitation pasa a ACCEPTED
```

## 12. Claims Strategy Recomendada

### V1

No agregar roles/permisos tenant al JWT.

Usar:

```text
/me para frontend snapshot
TenantGuard para backend source of truth
PermissionsGuard para enforcement
```

### V1.5 Opcional

Agregar authz version:

```text
User.authzVersion
TenantMembership.authzVersion
```

Pero solo si aparece necesidad real de invalidar cache/sesiones.

### Futuro

Si se agregan claims:

```text
custom claims deben ser pequenos
no deben incluir permiso completo por tenant
deben incluir tokenVersion/authzVersion para invalidacion
backend debe seguir validando DB en acciones sensibles
```

Claims posibles:

```json
{
  "app_user_id": "uuid",
  "platform_roles": ["PLATFORM_OWNER"],
  "authz_version": 12
}
```

No recomendado:

```json
{
  "permissions": ["tenant.manage", "users.manage", "..."]
}
```

## 13. Frontend Plan Para Access Settings

Settings structure ya esta planeada:

```text
/settings
  Access
    /settings/users
    /settings/invitations
    /settings/roles
    /settings/access
```

### Roles UI

Features:

```text
tabla de roles
badge system/custom
cantidad de usuarios asignados
acciones edit/archive/reactivate
drawer o full page para editar role
permission matrix agrupada por modulo
confirmacion para cambios sensibles
toast success/error
```

Permisos:

```text
roles.manage para create/update/archive
roles.manage o users.read para read, segun decision
```

### Users UI

Features:

```text
tabla de usuarios
search por email/name
filtro por status/role
drawer de detalle
selector de role
disable/reactivate membership
```

Permisos:

```text
users.read para listar
users.manage para modificar
```

### Invitations UI

Features:

```text
crear invitacion con email + role
tabla pending/accepted/cancelled/expired
resend/cancel
empty states
toasts
```

Permiso:

```text
users.manage
```

## 14. Backend Plan Por Fases

### Fase 1: Permission Catalog Hardening

Objetivo:

```text
Formalizar catalogo de permisos para UI.
```

Tareas:

```text
crear permission catalog TS compartido en database/backend o package comun
agregar module/group/action metadata si se decide
seed desde catalogo unico
tests de seed/catalogo
```

DoD:

```text
Todos los permisos usados por @Permissions existen en seed/catalogo.
```

### Fase 2: Roles API

Objetivo:

```text
Administrar roles tenant-scoped.
```

Endpoints:

```text
GET /roles
POST /roles
GET /roles/:id
PATCH /roles/:id
PUT /roles/:id/permissions
POST /roles/:id/archive
POST /roles/:id/reactivate
```

Permisos:

```text
roles.manage
```

Tests:

```text
tenant isolation
cannot edit role from another tenant
cannot remove critical owner permissions
permission ids must exist
```

### Fase 3: Tenant Users API

Objetivo:

```text
Listar usuarios del tenant y cambiar roles/membership status.
```

Endpoints:

```text
GET /tenant-users
PATCH /tenant-users/:membershipId/role
POST /tenant-users/:membershipId/disable
POST /tenant-users/:membershipId/reactivate
```

Permisos:

```text
users.read
users.manage
```

Tests:

```text
cannot assign role from another tenant
cannot disable last owner
membership status controls access
```

### Fase 4: Invitations API

Objetivo:

```text
Invitar usuarios a tenants de forma production-ready.
```

Endpoints:

```text
POST /tenant-invitations
GET /tenant-invitations
POST /tenant-invitations/:id/resend
POST /tenant-invitations/:id/cancel
POST /tenant-invitations/accept
```

Tests:

```text
token hashing
email/session match
expiration
duplicate pending invitation
membership activation
```

### Fase 5: Frontend Access Settings

Objetivo:

```text
Implementar pantallas /settings/users, /settings/roles, /settings/invitations.
```

Incluir:

```text
RTK Query tenantSlug-aware
breadcrumbs
tables paginated >10
drawers/forms
confirm dialogs
toasts
permission-aware actions
tests
```

### Fase 6: Claims / Authz Version Opcional

Objetivo:

```text
Evaluar si necesitamos claims o versionado de autorizacion.
```

Implementar solo si:

```text
necesitamos invalidar cache/sessions ante cambios de permisos
necesitamos optimizar /me
necesitamos platform claims para middleware o edge checks
```

## 15. Riesgos Y Recomendaciones

### Riesgo: Permisos En JWT Quedan Stale

Mitigacion:

```text
No usar JWT claims como source of truth.
Refrescar /me despues de cambios de rol.
Backend consulta DB en TenantGuard.
```

### Riesgo: Usuario Se Quita Su Propio Acceso

Mitigacion:

```text
Bloquear cambios que dejen al tenant sin owner activo.
Confirmacion fuerte para self-demotion.
```

### Riesgo: Role De Otro Tenant

Mitigacion:

```text
Toda mutation valida role.tenantId == request.tenant.id.
```

### Riesgo: UI Oculta Accion Pero API Permite

Mitigacion:

```text
Frontend PermissionGate solo es UX.
Backend PermissionsGuard es enforcement real.
```

### Riesgo: System Roles Editables Sin Control

Mitigacion:

```text
owner system role protegido.
otros system roles pueden ser read-only o clonables.
custom roles editables.
```

## 16. Recomendacion De Prioridad

Orden recomendado:

```text
1. Permission catalog hardening.
2. Roles API + role templates.
3. Tenant Users API.
4. Invitations API.
5. Frontend Access Settings.
6. Claims/authzVersion solo si aparece necesidad real.
```

Antes de implementar claims, implementar bien:

```text
roles.manage
users.manage
TenantMembership updates
/me invalidation
tenant-aware RTK cache
audit events
```

## 17. Conclusion

El proyecto ya tiene la base correcta:

```text
Supabase Auth = identidad
App DB = autorizacion
TenantMembership = acceso tenant
Role/Permission = RBAC tenant-scoped
PlatformUserRole = acceso platform
```

La siguiente capa no deberia ser meter permisos en JWT. La siguiente capa debe
ser construir el modulo de administracion de Access:

```text
Roles
Users
Invitations
```

JWT claims pueden venir despues como optimizacion controlada, pero no deben ser
el mecanismo principal de autorizacion en un SaaS multi-tenant con permisos
dinamicos.

