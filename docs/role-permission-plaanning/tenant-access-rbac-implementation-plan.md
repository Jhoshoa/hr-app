# Tenant Access RBAC Implementation Plan

Fecha: 2026-05-15

## Objetivo

Disenar la implementacion recomendada para administrar acceso tenant-scoped en
el proyecto:

```txt
Tenant
  Users / Memberships
  Roles
  Permissions
  Invitations
```

El plan cubre backend, base de datos, frontend, UX, validaciones de seguridad,
tests y puntos de extension para soportar mas adelante jerarquias internas como
`Employer`, `Branch`, `Department`, `Location`, scopes por unidad y overrides.

La decision central para esta fase es mantener RBAC tenant-scoped, pero
soportando multiples roles por usuario dentro del mismo tenant:

```txt
TenantMembership -> TenantMembershipRole -> Role -> RolePermission -> Permission
```

No conviene introducir todavia jerarquia organizacional ni scopes internos por
branch/employer/department. Si conviene soportar multiples roles por membership
desde ahora, porque es una necesidad realista: una misma persona puede ser
manager, supervisor, finance reviewer o HR staff dentro del mismo tenant.

## Decision Arquitectonica

### Opcion Recomendada Para V1

Mantener:

```txt
TenantMembership
  tenantId
  userId
  status

TenantMembershipRole
  membershipId
  roleId

Role
  tenantId
  key
  name
  description
  isSystemRole
  status

Permission
  key
  description
  group/module metadata

RolePermission
  roleId
  permissionId
```

Reglas:

- Un usuario puede tener varios roles por tenant.
- Los permisos efectivos salen de la union OR de todos sus roles activos.
- Los tenant admins no asignan permisos directos a usuarios en V1; asignan uno
  o mas roles. Si un usuario necesita una combinacion especial, se crea/clona
  un custom role y se le asigna.
- El backend autoriza siempre contra DB mediante `TenantGuard` y
  `PermissionsGuard`.
- El frontend usa permisos solo para experiencia de usuario, navegacion y
  acciones visibles.
- Solo usuarios con permisos administrativos del tenant pueden ver y modificar
  vistas de acceso.
- No usar claims JWT como fuente de verdad para permisos tenant-scoped.

### Por Que Esta Opcion

Es la mejor opcion para el estado actual del proyecto porque:

- Extiende el modelo actual con una tabla intermedia pequena y explicita.
- Encaja con `ResolveTenantContextUseCase`, `/me`, `TenantGuard` y
  `PermissionsGuard`.
- Evita agregar complejidad de scopes internos antes de necesitarla.
- Hace facil explicar permisos efectivos: el usuario obtiene la union de los
  permisos de todos sus roles.
- Reduce riesgos de seguridad al mantener una fuente de verdad unica en DB.
- Permite evolucionar luego a scopes internos sin reescribir todo el modulo.

## Lo Que No Se Debe Hacer Todavia

No implementar ahora:

- `Company -> Branch/Employer` dentro del modulo de acceso.
- Permisos tenant-scoped dentro de JWT claims.
- Permisos directos por usuario como comportamiento normal.
- Overrides por departamento/location/employer.
- Herencia de configuracion ligada al RBAC base.

Estas piezas son validas a futuro, pero mezclarlas ahora haria mas dificil
cerrar correctamente roles, usuarios, invitaciones y enforcement backend.

## Principios De Seguridad

1. Backend es la fuente de verdad.
2. Frontend nunca autoriza; solo oculta o muestra UI.
3. Toda query y mutation administrativa debe estar tenant-scoped.
4. Nunca se debe poder usar un `roleId`, `membershipId` o `invitationId` de
   otro tenant.
5. No se puede dejar un tenant sin owner/admin critico activo.
6. Los system roles deben tener reglas especiales.
7. Toda mutation sensible debe crear audit event.
8. Cambiar roles/permisos debe invalidar `/me` en frontend.
9. Las respuestas de error deben ser claras, pero no filtrar recursos de otros
   tenants.
10. Las futuras jerarquias deben agregarse como scope adicional, no mezclarse
    con la identidad del tenant.

## Estado Actual Aprovechable

### Backend

Ya existen:

- `AuthGuard`: valida Supabase Auth y adjunta `request.user`.
- `TenantGuard`: resuelve tenant activo via `x-tenant-slug`.
- `PermissionsGuard`: valida permisos de `request.tenant.permissions`.
- `PlatformRolesGuard`: valida roles platform.
- `@CurrentTenant()`.
- `@Permissions(...)`.
- `ResolveTenantContextUseCase`.
- `PrismaUsersRepository.findTenantMembershipContext`.
- `AuditModule`.

Cambios necesarios para multi-role:

- `TenantContext` debe dejar de depender de un unico `roleKey`.
- `ResolveTenantContextUseCase` debe cargar todos los roles activos del
  membership.
- `request.tenant.permissions` debe ser una lista unica de permisos efectivos.
- `/me` debe devolver `roles[]` y `permissions[]` por tenant.

Respuesta recomendada de tenant en `/me`:

```ts
{
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  roles: Array<{
    id: string;
    key: string;
    name: string;
    isSystemRole: boolean;
  }>;
  permissions: string[];
}
```

Para compatibilidad temporal, se puede mantener `roleKey` durante una migracion
corta apuntando al primer role o al role principal, pero la UI nueva no debe
depender de ese campo.

El orden global de guards en `apps/api/src/app.module.ts` ya es correcto:

```txt
AuthGuard
TenantGuard
PlatformRolesGuard
PermissionsGuard
```

### Frontend

Ya existen:

- `baseApi` con `authorization` y `x-tenant-slug`.
- `CurrentUser` y `/me`.
- `useCurrentTenant`.
- `PermissionGate`.
- `navigationItems` filtrado por permisos.
- `toast`.
- `ConfirmDialog`.
- `SideDrawer`.
- tablas, badges, empty states y error states usados en Organization Settings.

### Base De Datos

Ya existen:

- `TenantMembership`.
- `Role`.
- `Permission`.
- `RolePermission`.
- `PlatformUserRole`.
- `AuditEvent`.

El cambio estructural mas importante de este plan es reemplazar el uso directo
de `TenantMembership.roleId` como rol unico por una relacion many-to-many entre
membership y roles.

## Ajustes Recomendados Al Modelo

### TenantMembershipRole

Agregar tabla intermedia:

```prisma
model TenantMembershipRole {
  membershipId String           @db.Uuid
  roleId       String           @db.Uuid
  createdAt    DateTime         @default(now())
  membership   TenantMembership @relation(fields: [membershipId], references: [id], onDelete: Cascade)
  role         Role             @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([membershipId, roleId])
  @@index([roleId])
}
```

Ajustar `TenantMembership`:

```prisma
model TenantMembership {
  id        String                 @id @default(uuid()) @db.Uuid
  tenantId  String                 @db.Uuid
  userId    String                 @db.Uuid
  status    MembershipStatus       @default(INVITED)
  invitedAt DateTime               @default(now())
  joinedAt  DateTime?
  createdAt DateTime               @default(now())
  updatedAt DateTime               @updatedAt
  roles     TenantMembershipRole[]

  @@unique([tenantId, userId])
  @@index([tenantId, status])
  @@index([userId, status])
}
```

Migracion:

- Crear `TenantMembershipRole`.
- Backfill desde el `TenantMembership.roleId` actual.
- En una fase posterior, remover `TenantMembership.roleId` cuando el codigo ya
  lea roles desde la tabla intermedia.

Si se quiere reducir riesgo, la migracion puede hacerse en dos pasos:

1. Agregar `TenantMembershipRole` y mantener `TenantMembership.roleId`
   temporalmente.
2. Migrar backend/frontend para usar roles multiple.
3. Remover `roleId` despues de validar datos y tests.

Permisos efectivos:

```txt
effectivePermissions = unique(flatMap(activeMembership.roles[].role.permissions))
```

Semantica:

- La union es OR.
- Si cualquier role concede `employees.compensation.read`, el usuario lo tiene.
- `@Permissions("a", "b")` en backend sigue siendo AND sobre permisos efectivos:
  el usuario debe tener ambos, aunque vengan de roles distintos.
- Para rutas que necesiten OR entre permisos, agregar `@AnyPermission`.

### Role

Agregar `status` para soft archive:

```prisma
model Role {
  id           String       @id @default(uuid()) @db.Uuid
  tenantId     String?      @db.Uuid
  key          String
  name         String
  description  String?
  isSystemRole Boolean      @default(false)
  status       RecordStatus @default(ACTIVE)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}
```

Razon:

- No borrar roles con memberships historicos.
- Permitir ocultar roles archivados del selector.
- Mantener trazabilidad.

### Permission Metadata

Extender `Permission` para UI y ordenamiento:

```prisma
model Permission {
  id          String   @id @default(uuid()) @db.Uuid
  key         String   @unique
  description String
  module      String?
  action      String?
  sortOrder   Int      @default(0)
  isCritical  Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

Ejemplos:

```txt
users.read                module=users         action=read
users.manage              module=users         action=manage
roles.manage              module=roles         action=manage isCritical=true
tenant.manage             module=tenant        action=manage isCritical=true
employees.compensation.*  module=compensation  action=read/manage
```

Si se quiere minimizar migraciones, esta metadata tambien puede vivir primero
en un catalogo TypeScript y persistir solo `key + description`. La opcion mas
robusta para UI dinamica es persistir metadata.

### TenantInvitation

Agregar modelo nuevo:

```prisma
enum TenantInvitationStatus {
  PENDING
  ACCEPTED
  CANCELLED
  EXPIRED
}

model TenantInvitation {
  id              String                 @id @default(uuid()) @db.Uuid
  tenantId        String                 @db.Uuid
  email           String
  membershipId    String?                @db.Uuid
  status          TenantInvitationStatus @default(PENDING)
  tokenHash       String                 @unique
  invitedByUserId String?                @db.Uuid
  acceptedByUserId String?               @db.Uuid
  expiresAt       DateTime
  resendCount     Int                    @default(0)
  lastSentAt      DateTime?
  acceptedAt      DateTime?
  cancelledAt     DateTime?
  createdAt       DateTime               @default(now())
  updatedAt       DateTime               @updatedAt

  @@index([tenantId, status, createdAt])
  @@index([tenantId, email])
}
```

Agregar tabla de roles de invitacion:

```prisma
model TenantInvitationRole {
  invitationId String           @db.Uuid
  roleId       String           @db.Uuid
  createdAt    DateTime         @default(now())

  @@id([invitationId, roleId])
  @@index([roleId])
}
```

Recomendacion:

- Crear o reutilizar `User` en estado `INVITED`.
- Crear `TenantMembership` en estado `INVITED` al invitar.
- Asignar uno o mas roles iniciales a la invitacion y al membership invitado.
- Setear `expiresAt = now + invitationTtl`.
- Setear `lastSentAt = now`.
- En `resend`, rotar token, reemplazar `tokenHash`, renovar `expiresAt`,
  incrementar `resendCount` y actualizar `lastSentAt`.
- No agregar `isValid`; la validez se deriva de
  `status == PENDING && now < expiresAt`.
- Al intentar aceptar una invitacion vencida, marcar `EXPIRED` y rechazar.
- Al aceptar, pasar membership a `ACTIVE` y setear `joinedAt`.
- `/me` debe seguir devolviendo solo memberships `ACTIVE`.

Documento complementario de decisiones de expiracion, resend, link de
aceptacion y configuracion futura:

```txt
docs/role-permission-planning/phase-4-invitation-expiration-resend-and-configuration-notes.md
```

### Futuro: MembershipAccessScope

No implementarlo en V1, pero disenar nombres y servicios pensando en esto:

```prisma
model MembershipAccessScope {
  id           String @id @default(uuid()) @db.Uuid
  membershipId String @db.Uuid
  scopeType    String
  scopeId      String?
  createdAt    DateTime @default(now())

  @@index([membershipId])
  @@index([scopeType, scopeId])
}
```

Ejemplos futuros:

```txt
tenant global:      scopeType=tenant, scopeId=null
employer limitado:  scopeType=employer, scopeId=<employerId>
department limitado: scopeType=department, scopeId=<departmentId>
location limitado: scopeType=location, scopeId=<locationId>
```

Los endpoints V1 deben aceptar implicitamente `tenant` como unico scope. No
agregar campos de scope todavia en UI.

## Catalogo De Permisos Recomendado

Crear una fuente unica, idealmente en un package compartido o en database con
export consumible por seed y backend:

```txt
packages/database/src/permission-catalog.ts
```

Estructura:

```ts
export const permissionCatalog = [
  {
    key: "tenant.read",
    description: "Read tenant information",
    module: "Tenant",
    action: "Read",
    sortOrder: 10,
    isCritical: false
  }
] as const;
```

Usos:

- Seed de `Permission`.
- DTO de `GET /permissions`.
- Agrupacion visual de Permission Matrix.
- Tests para detectar permisos usados por decorators que no existan.
- Tipos compartidos para evitar strings inventados en backend/frontend.
- Validacion de que un tenant admin solo pueda asignar permisos existentes.

Aunque hoy el proyecto tenga pocos permisos, este enfoque escala bien porque
agregar un permiso nuevo debe seguir un flujo simple:

1. Agregar el permiso al catalogo con module/action/descripcion.
2. Usarlo en el endpoint backend con `@Permissions("nuevo.permiso")`.
3. Decidir si entra en algun system role/template.
4. Seedearlo o correr migracion idempotente.
5. La UI de roles lo muestra automaticamente en la matriz.
6. El frontend lo puede usar para ocultar acciones especificas cuando aplique.

No se debe agregar permisos escribiendo strings sueltos en varios archivos sin
actualizar el catalogo. Ese es el punto que mantiene facil la evolucion.

Permisos actuales a mantener:

```txt
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

Permisos opcionales a considerar cuando existan features:

```txt
invitations.read
invitations.manage
roles.read
```

Para V1 se puede mantener:

```txt
users.read -> listar usuarios e invitaciones
users.manage -> invitar, desactivar/reactivar usuarios, cambiar roles
roles.manage -> crear/editar/archivar roles y permisos de roles
```

## Roles Iniciales Recomendados

Mantener owner como system role:

```txt
owner
  all permissions
  isSystemRole=true
  protected=true por logica de aplicacion
```

Agregar role templates por tenant:

```txt
hr_admin
hr_staff
manager
employee
finance_viewer
recruiter
```

Recomendacion para V1:

- Seedear templates solo para nuevos tenants.
- Para tenants existentes, migration/backfill idempotente.
- Permitir clonar un system role a un custom role.
- No permitir editar permisos del `owner` en V1.

Matriz inicial sugerida:

```txt
owner:
  all

hr_admin:
  tenant.read
  users.read
  users.manage
  roles.manage
  organization.read
  organization.manage
  employees.read
  employees.manage
  employees.compensation.read
  employees.compensation.manage
  employees.custom-fields.manage
  audit.read

hr_staff:
  tenant.read
  users.read
  organization.read
  employees.read
  employees.manage
  employees.custom-fields.manage

manager:
  tenant.read
  employees.read
  employees.team.read

employee:
  tenant.read
  employees.self.read

finance_viewer:
  tenant.read
  employees.read
  employees.compensation.read

recruiter:
  tenant.read
  users.read
  employees.read
```

Esta matriz debe ajustarse con producto, pero es suficiente para construir UI y
validaciones.

## Backend: Modulos Recomendados

Crear un modulo separado para acceso tenant-scoped:

```txt
apps/api/src/modules/access
  access.module.ts
  domain/
    entities/
      role.entity.ts
      permission.entity.ts
      tenant-user.entity.ts
      tenant-invitation.entity.ts
    ports/
      roles.repository.port.ts
      permissions.repository.port.ts
      tenant-users.repository.port.ts
      tenant-invitations.repository.port.ts
  application/
    services/
      access-policy.service.ts
      invitation-token.service.ts
    use-cases/
      list-permissions.use-case.ts
      list-roles.use-case.ts
      get-role.use-case.ts
      create-role.use-case.ts
      update-role.use-case.ts
      update-role-permissions.use-case.ts
      archive-role.use-case.ts
      reactivate-role.use-case.ts
      list-tenant-users.use-case.ts
      update-tenant-user-roles.use-case.ts
      disable-tenant-membership.use-case.ts
      reactivate-tenant-membership.use-case.ts
      list-tenant-invitations.use-case.ts
      create-tenant-invitation.use-case.ts
      resend-tenant-invitation.use-case.ts
      cancel-tenant-invitation.use-case.ts
      accept-tenant-invitation.use-case.ts
  infrastructure/
    persistence/
      prisma-roles.repository.ts
      prisma-permissions.repository.ts
      prisma-tenant-users.repository.ts
      prisma-tenant-invitations.repository.ts
  presentation/
    controllers/
      permissions.controller.ts
      roles.controller.ts
      tenant-users.controller.ts
      tenant-invitations.controller.ts
    dto/
      role.dto.ts
      tenant-user.dto.ts
      tenant-invitation.dto.ts
```

Este formato sigue el patron ya usado por `organization`, `tenants`,
`employees` y `company-signups`.

## Backend: Endpoints

### Permissions

```txt
GET /permissions
```

Permiso:

```txt
roles.manage
```

Respuesta:

```ts
{
  permissions: Array<{
    id: string;
    key: string;
    description: string;
    module: string;
    action: string;
    sortOrder: number;
    isCritical: boolean;
  }>;
}
```

### Roles

```txt
GET /roles
POST /roles
GET /roles/:roleId
PATCH /roles/:roleId
PUT /roles/:roleId/permissions
POST /roles/:roleId/archive
POST /roles/:roleId/reactivate
```

Permisos:

```txt
GET /roles                  roles.manage
POST /roles                 roles.manage
GET /roles/:roleId          roles.manage
PATCH /roles/:roleId        roles.manage
PUT /roles/:roleId/permissions roles.manage
archive/reactivate          roles.manage
```

Respuesta de `GET /roles`:

```ts
{
  roles: Array<{
    id: string;
    key: string;
    name: string;
    description?: string;
    isSystemRole: boolean;
    status: "ACTIVE" | "ARCHIVED";
    memberCount: number;
    permissionCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
}
```

Validaciones:

- `key` normalizado: lowercase, kebab/snake simple, unico por tenant.
- `name` requerido.
- `roleId` debe pertenecer al tenant actual.
- No crear roles con `tenantId=null` desde UI tenant.
- No editar `owner` system role en V1.
- No archivar un role asignado a usuarios activos si al hacerlo algun usuario
  queda sin roles activos.
- No archivar el ultimo role que mantiene owner/admin critico activo.
- `permissionIds` deben existir.
- No permitir remover permisos criticos del ultimo admin efectivo.

Los roles custom creados por tenant admins usan el mismo modelo que los system
roles, pero con `isSystemRole=false`. Por eso cualquier permiso agregado al
catalogo queda disponible para custom roles sin cambiar el schema.

Flujo recomendado para tenant admins:

1. Crear role custom desde cero o clonar un system role/template.
2. Ajustar permisos en Permission Matrix.
3. Guardar role.
4. Asignar ese role a uno o mas usuarios.
5. El backend valida permisos efectivos por union OR en cada request.

Esto evita permisos directos dispersos por usuario y mantiene el modelo
auditable. Clonar system roles ayuda bastante porque permite partir de una
configuracion conocida, pero el resultado siempre debe ser un custom role
editable y visible para el tenant.

### Tenant Users

```txt
GET /tenant-users
GET /tenant-users/:membershipId
PUT /tenant-users/:membershipId/roles
POST /tenant-users/:membershipId/disable
POST /tenant-users/:membershipId/reactivate
```

Permisos:

```txt
GET                  users.read
PUT roles            users.manage
disable/reactivate   users.manage
```

Respuesta:

```ts
{
  users: Array<{
    membershipId: string;
    userId: string;
    email: string;
    name?: string;
    userStatus: "INVITED" | "ACTIVE" | "DISABLED";
    membershipStatus: "INVITED" | "ACTIVE" | "DISABLED";
    roles: Array<{
      id: string;
      key: string;
      name: string;
      isSystemRole: boolean;
    }>;
    effectivePermissions: string[];
    invitedAt: string;
    joinedAt?: string;
    createdAt: string;
    updatedAt: string;
  }>;
}
```

Validaciones:

- `membershipId` debe pertenecer al tenant actual.
- `roleIds` debe ser un array no vacio.
- Cada `roleId` debe pertenecer al tenant actual y estar `ACTIVE`.
- No permitir asignar role archivado.
- No permitir desactivar el ultimo owner activo.
- No permitir que el usuario actual se quite el ultimo permiso administrativo
  critico sin confirmacion fuerte de backend.
- No borrar `User` global; solo cambiar `TenantMembership.status`.
- Reemplazar roles debe hacerse como set completo dentro de transaccion:
  borrar roles removidos, insertar roles nuevos y validar supervivencia admin.

### Invitations

```txt
GET /tenant-invitations
POST /tenant-invitations
POST /tenant-invitations/:invitationId/resend
POST /tenant-invitations/:invitationId/cancel
POST /tenant-invitations/accept
```

Permisos:

```txt
GET/list       users.read
POST/create    users.manage
resend/cancel  users.manage
accept         Public o SkipTenant + AuthGuard segun flujo
```

`POST /tenant-invitations` body:

```ts
{
  email: string;
  roleIds: string[];
}
```

`POST /tenant-invitations/accept` body:

```ts
{
  token: string;
}
```

Validaciones:

- Email normalizado.
- `roleIds` debe ser no vacio.
- Todos los roles pertenecen al tenant actual y estan activos.
- No duplicar invitacion pending para el mismo email y tenant.
- Si existe membership `ACTIVE`, devolver conflicto.
- Si existe membership `DISABLED`, requerir reactivacion explicita o flujo
  controlado.
- Token se guarda hasheado, nunca en claro.
- Token expira via `expiresAt`; al aceptar se valida `now < expiresAt`.
- No usar `isValid`; usar `status + expiresAt` como fuente de validez.
- `resend` debe invalidar el token anterior reemplazando `tokenHash`.
- `resend` debe incrementar `resendCount`, setear `lastSentAt` y renovar
  `expiresAt`.
- Limite inicial recomendado: `maxResends = 3`.
- Link de aceptacion futuro:
  `https://app.example.com/invitations/accept?token=<acceptanceToken>`.
- El email del usuario autenticado debe coincidir con el email invitado.
- Al aceptar: `TenantInvitation.status=ACCEPTED`,
  `TenantMembership.status=ACTIVE`, `joinedAt=now`.
- Los roles aceptados se materializan en `TenantMembershipRole`.

## AccessPolicyService

Crear servicio central para reglas sensibles:

```txt
AccessPolicyService
  assertRoleBelongsToTenant(roleId, tenantId)
  assertRolesBelongToTenant(roleIds, tenantId)
  assertMembershipBelongsToTenant(membershipId, tenantId)
  assertCanArchiveRole(roleId, tenantId)
  assertCanUpdateRolePermissions(roleId, tenantId, permissionIds)
  assertCanChangeMembershipRoles(membershipId, newRoleIds, tenantId, actorUserId)
  assertCanDisableMembership(membershipId, tenantId, actorUserId)
  assertTenantKeepsAdministrativeAccess(tenantId)
```

Razon:

- Evitar duplicar reglas en use cases.
- Facilitar unit tests.
- Preparar extension futura con scopes internos.

La regla minima de supervivencia del tenant debe verificar que exista al menos
un membership activo cuyos roles efectivos tengan permisos administrativos
criticos:

```txt
tenant.manage OR roles.manage OR users.manage
```

Para V1, `owner` es el criterio mas simple y seguro:

```txt
Debe existir al menos un ACTIVE membership con algun role.key = "owner".
```

Mas adelante se puede cambiar a "admin efectivo" por permisos.

## Middleware / Guards

No hace falta crear un middleware nuevo para roles/permisos en V1. Ya existe la
cadena correcta:

```txt
AuthGuard -> TenantGuard -> PermissionsGuard
```

Ajustes recomendados:

1. Endurecer `TenantGuard.resolveTenantSlug`:
   - trim;
   - lowercase;
   - validar formato;
   - rechazar arrays vacios.

2. Agregar un decorator opcional para OR semantics backend si aparece una ruta
   que lo necesite:

```txt
@AnyPermission("users.manage", "roles.manage")
```

No es obligatorio para V1 si cada endpoint tiene un permiso claro.

3. Mantener `@Permissions` con semantica AND.

Importante:

- `PermissionGate` frontend usa OR.
- `@Permissions` backend usa AND.
- Documentar esto y no asumir que ambos hacen lo mismo.

## Auditoria

Cada mutation debe crear `AuditEvent`:

```txt
role.created
role.updated
role.permissions_updated
role.archived
role.reactivated
membership.roles_updated
membership.disabled
membership.reactivated
invitation.created
invitation.resent
invitation.cancelled
invitation.accepted
```

Metadata recomendada:

```ts
{
  before?: unknown;
  after?: unknown;
  targetUserId?: string;
  targetEmail?: string;
  roleId?: string;
  roleIds?: string[];
  permissionKeys?: string[];
}
```

Usar `actorUserId` desde `request.user.id` y `tenantId` desde
`@CurrentTenant`.

## Transacciones

Usar transacciones Prisma en operaciones compuestas:

- Crear role + role permissions.
- Actualizar role permissions reemplazando set completo.
- Crear invitacion + user pending + membership invited.
- Aceptar invitacion + activar membership + marcar invitation accepted.
- Reemplazar roles de membership y validar que el tenant no queda sin
  owner/admin.
- Desactivar membership y validar supervivencia del tenant.

El proyecto ya tiene `prisma-transaction.ts`; reutilizar ese patron si aplica.

## Frontend: Rutas

Agregar:

```txt
apps/web/app/(app)/settings/access/page.tsx
apps/web/app/(app)/settings/access/roles/page.tsx
apps/web/app/(app)/settings/access/users/page.tsx
apps/web/app/(app)/settings/access/invitations/page.tsx
```

Opcion UX recomendada:

```txt
/settings/access
  tabs internas:
    Users
    Roles
    Invitations
```

Si el equipo prefiere rutas separadas, mantener la misma shell y tabs con links.

Actualizar `settings/page.tsx` para mostrar card "Access" solo si:

```txt
roles.manage OR users.read OR users.manage
```

Para evitar que alguien con solo `organization.read` vea Access.

## Frontend: API Layer

Crear:

```txt
apps/web/src/features/access/access-api.ts
apps/web/src/features/access/access-types.ts
apps/web/src/features/access/access-schema.ts
apps/web/src/features/access/access-utils.ts
```

Agregar tags en `baseApi`:

```txt
Permission
Role
TenantUser
TenantInvitation
CurrentUser
```

Invalidaciones:

- Cambiar role permissions invalida `Role`, `TenantUser` y `CurrentUser`.
- Cambiar membership roles invalida `TenantUser` y `CurrentUser`.
- Desactivar/reactivar membership invalida `TenantUser` y `CurrentUser`.
- Crear/cancelar invitacion invalida `TenantInvitation` y `TenantUser`.

Usar `tenantSlug` en tags igual que `OrganizationRecord`:

```ts
{ type: "Role", id: `${tenantSlug}:list` }
```

## Frontend: Componentes

Crear:

```txt
apps/web/src/features/access/components/access-settings-page.tsx
apps/web/src/features/access/components/roles-panel.tsx
apps/web/src/features/access/components/role-editor-drawer.tsx
apps/web/src/features/access/components/permission-matrix.tsx
apps/web/src/features/access/components/users-panel.tsx
apps/web/src/features/access/components/user-role-drawer.tsx
apps/web/src/features/access/components/invitations-panel.tsx
apps/web/src/features/access/components/invitation-drawer.tsx
```

Reutilizar:

- `PageHeader`.
- `Button`.
- `Badge`.
- `Input`.
- `SideDrawer`.
- `ConfirmDialog`.
- `useToast`.
- `ErrorState`.
- `EmptyState`.

## UI/UX Recomendado

### Access Landing

Debe sentirse como una pantalla operacional, no marketing:

- Header con breadcrumbs.
- Tabs compactas: Users, Roles, Invitations.
- Contadores: active users, pending invitations, active roles.
- No usar hero ni cards decorativas innecesarias.

### Roles

Tabla:

```txt
Role
Type
Permissions
Users
Status
Updated
Actions
```

Acciones:

- Create role.
- Edit role.
- Edit permissions.
- Archive/reactivate.
- Clone system role.

Permission Matrix:

- Agrupar por module.
- Checkbox por permission.
- Indicador de critical permission.
- Search/filter si crece el catalogo.
- Botones: Cancel, Save changes.
- ConfirmDialog si se remueven permisos criticos.

Reglas UX:

- `owner` system role read-only en V1.
- System roles muestran badge `System`.
- Custom roles muestran badge `Custom`.
- Roles archivados no aparecen en selectors por defecto.
- Si un role tiene usuarios activos, archivar requiere bloquear o guiar a
  reasignar.

### Users

Tabla:

```txt
User
Email
Roles
Membership status
Joined
Actions
```

Controles:

- Search por name/email.
- Filtro por role.
- Filtro por status.
- Drawer para cambiar roles con multi-select.
- ConfirmDialog para disable/reactivate.

Reglas UX:

- No mostrar acciones que el usuario no puede ejecutar.
- Si el usuario se modifica a si mismo, mostrar confirmacion fuerte.
- Despues de cambiar el propio rol, refrescar `/me` y recalcular navegacion.
- Mostrar los roles como badges compactos; si hay muchos, usar contador
  `+N` y detalle en drawer.

### Invitations

Tabla:

```txt
Email
Role
Status
Expires
Invited
Actions
```

Acciones:

- Invite user.
- Resend.
- Cancel.

Formulario:

- Email.
- Role multi-select.
- Fecha de expiracion si se decide exponerla; si no, default backend.

Reglas UX:

- No permitir seleccionar roles archivados.
- Requerir al menos un role.
- Mostrar error de duplicate pending invitation con mensaje accionable.
- Toast success/error en create/resend/cancel.

## Control Frontend De Acceso

Crear helper para acciones:

```txt
apps/web/src/features/access/access-permissions.ts
```

Ejemplo:

```ts
export const accessPermissions = {
  viewAccess: ["users.read", "users.manage", "roles.manage"],
  manageRoles: ["roles.manage"],
  viewUsers: ["users.read", "users.manage"],
  manageUsers: ["users.manage"],
  manageInvitations: ["users.manage"]
} as const;
```

Usar:

- Navigation.
- Settings card.
- Page-level empty/forbidden state.
- Action buttons.

Recordatorio:

Esto no reemplaza backend. Solo evita mostrar UI que terminara en 403.

## Backend Tests

Unit tests:

- `AccessPolicyService`.
- `CreateRoleUseCase`.
- `UpdateRolePermissionsUseCase`.
- `ArchiveRoleUseCase`.
- `UpdateTenantUserRolesUseCase`.
- `DisableTenantMembershipUseCase`.
- `CreateTenantInvitationUseCase`.
- `AcceptTenantInvitationUseCase`.

Casos obligatorios:

- No puede listar roles sin `roles.manage`.
- No puede editar role de otro tenant.
- No puede asignar role de otro tenant.
- No puede asignar role archivado.
- No puede dejar membership activo sin roles.
- No puede archivar owner.
- No puede desactivar ultimo owner activo.
- No puede remover permisos criticos del unico admin.
- Los permisos efectivos se calculan como union OR de varios roles.
- `@Permissions("a", "b")` permite acceso si `a` viene de un role y `b` de otro.
- Invitacion no acepta token expirado.
- Invitacion no acepta email distinto.
- Invitation token se guarda hasheado.
- Membership INVITED no aparece en `/me`.
- Membership DISABLED no resuelve en `TenantGuard`.

E2E recomendado:

- Tenant A no puede ver ni modificar recursos de Tenant B.
- Admin cambia roles de usuario y ese usuario pierde/gana permisos tras refresh.
- Usuario sin `users.manage` recibe 403 aunque vea/manipule request manual.

## Frontend Tests

Vitest/Testing Library:

- Access page renderiza tabs segun permisos.
- Role table muestra system/custom/status.
- Permission matrix arma grupos correctamente.
- Save role permissions invalida queries y muestra toast.
- User roles drawer bloquea submit sin al menos un role.
- User roles drawer permite seleccionar varios roles y muestra badges.
- Disable user abre `ConfirmDialog`.
- Invitation form normaliza y maneja errores API.
- Forbidden/empty states para permisos insuficientes.

Tambien agregar tests de helpers:

- `access-utils`.
- pagination/filtering.
- permission grouping.

## Fases De Implementacion

### Fase 0: Preparacion Y Contratos

Objetivo:

Definir contratos estables antes de tocar UI pesada.

Tareas:

- Crear catalogo unico de permisos.
- Definir role templates.
- Decidir si `Permission` metadata vive en DB o TS catalog.
- Definir DTOs backend y types frontend.
- Definir contrato multi-role: `roleIds`, `roles[]` y `effectivePermissions`.
- Documentar OR frontend vs AND backend.

DoD:

- Catalogo existe.
- Seed usa catalogo.
- Tests basicos del catalogo pasan.
- No hay permisos usados por guards que no existan en catalogo.

### Fase 1: Migraciones RBAC

Objetivo:

Preparar DB para roles administrables e invitaciones.

Tareas:

- Agregar `Role.status`.
- Agregar `TenantMembershipRole`.
- Agregar metadata opcional de `Permission`.
- Agregar `TenantInvitation` y enum de status.
- Agregar `TenantInvitationRole`.
- Backfill de `TenantMembership.roleId` actual hacia `TenantMembershipRole`.
- Crear/backfill role templates por tenant.
- Mantener owner con todos los permisos.

DoD:

- `db:migrate` y `db:generate` funcionan.
- Seed local es idempotente.
- Tenants existentes quedan con owner y templates.
- Cada membership existente queda con al menos un role en
  `TenantMembershipRole`.

### Fase 2: Roles API

Objetivo:

Administrar roles y permisos de roles.

Tareas:

- Crear `AccessModule`.
- Implementar repositories de roles/permissions.
- Implementar use cases de roles.
- Implementar `AccessPolicyService`.
- Agregar audit events.
- Agregar unit tests.

DoD:

- CRUD/Archive roles tenant-scoped funcionando.
- Permission matrix puede consumir permisos y role detail.
- No se puede romper owner/admin critico.

### Fase 3: Tenant Users API

Objetivo:

Listar usuarios del tenant y administrar membership.

Tareas:

- Implementar `GET /tenant-users`.
- Implementar reemplazo de roles del membership.
- Implementar disable/reactivate membership.
- Agregar audit events.
- Agregar tests de aislamiento y ultimo owner.

DoD:

- Memberships se administran sin tocar User global.
- TenantGuard sigue rechazando `DISABLED` e `INVITED`.
- Cambiar roles recalcula permisos efectivos e invalida correctamente `/me`
  desde frontend.

### Fase 4: Invitations API

Objetivo:

Invitaciones production-ready.

Tareas:

- Crear/resend/cancel/list invitations.
- Implementar token hashing y expiration.
- Agregar `resendCount` y `lastSentAt` para controlar reenvios.
- En `resend`, rotar token, renovar expiracion y registrar ultimo envio.
- Implementar accept invitation.
- Integrar email provider cuando exista; mientras tanto exponer dev-safe link
  solo en entorno local si se necesita.
- Preparar link de aceptacion:
  `https://app.example.com/invitations/accept?token=<acceptanceToken>`.
- Agregar audit events.
- Agregar tests.

DoD:

- Invitacion crea membership INVITED.
- Aceptar activa membership.
- Token no se guarda en claro.
- Invitacion vencida no puede aceptarse.
- Reenvio invalida token anterior.
- `resendCount` y `lastSentAt` se actualizan al reenviar.
- Email/session mismatch falla.

### Fase 5: Frontend Access Settings

Objetivo:

Construir pantallas administrativas siguiendo patrones existentes.

Tareas:

- Agregar `access-api`, types y utils.
- Agregar rutas `/settings/access`.
- Agregar card Access en Settings.
- Crear panels Users/Roles/Invitations.
- Crear drawers, permission matrix y confirm dialogs.
- Usar toasts para feedback.
- Agregar tests.

DoD:

- Solo usuarios con permisos ven Access y acciones.
- Backend sigue devolviendo 403 para usuarios sin permisos.
- Cambios actualizan tablas y `/me`.
- UI queda consistente con Organization Settings.

### Fase 6: Hardening

Objetivo:

Cerrar riesgos antes de considerar jerarquias internas.

Tareas:

- Revisar todos los endpoints con `@Permissions`.
- Agregar tests e2e de tenant isolation.
- Mejorar errores normalizados.
- Agregar estados loading/skeleton.
- Verificar responsive tables.
- Revisar auditoria.

DoD:

- No hay bypass por tenant.
- No hay acciones sensibles sin audit.
- UI maneja 403/409/validation.

### Fase 7: Extension Futura A Scopes Internos

Objetivo:

Agregar access scopes solo si negocio lo requiere.

Tareas futuras:

- Definir entidad organizacional real: `Employer`, `Branch`,
  `LegalEntity`, `BusinessUnit` o combinacion.
- Crear `MembershipAccessScope`.
- Extender `TenantContext` con scopes efectivos.
- Agregar service para filtrar queries por scope.
- Agregar UI para asignar scope a membership.
- Agregar tests de tenant isolation + internal scope isolation.

DoD futuro:

- Usuario limitado a branch/employer no puede leer ni mutar datos fuera de su
  scope.
- Las reglas de fallback/overrides estan documentadas y testeadas.

## Orden De Entrega Recomendado

1. Catalogo de permisos + role templates.
2. Migracion de `TenantMembershipRole`, `Role.status`, `TenantInvitation` y
   `TenantInvitationRole`.
3. Roles API.
4. Tenant Users API.
5. Invitations API.
6. Frontend Access Settings.
7. Hardening e2e.
8. Scopes internos solo despues.

## Riesgos Principales

### Riesgo: UI Oculta Pero API Permite

Mitigacion:

- `@Permissions` obligatorio en cada endpoint.
- Tests de 403.
- Frontend `PermissionGate` solo para UX.

### Riesgo: Usuario Se Quita Su Propio Acceso

Mitigacion:

- Backend bloquea dejar tenant sin owner/admin.
- Confirmacion fuerte en UI para self-demotion.
- Refetch de `/me` tras cambios.

### Riesgo: Role De Otro Tenant

Mitigacion:

- Toda mutation usa `tenant.id` desde `@CurrentTenant`.
- Repositories usan `findFirst({ where: { id, tenantId } })`.
- Tests de cross-tenant.

### Riesgo: Permisos Stale En Frontend

Mitigacion:

- Invalidar `CurrentUser`.
- Refetch `/me` tras role/membership changes.
- Backend siempre consulta DB en TenantGuard.

### Riesgo: Permisos Excesivos Por Acumulacion De Roles

Mitigacion:

- Mostrar permisos efectivos en el drawer de usuario antes de guardar.
- Confirmar cambios que agreguen permisos criticos.
- Auditar `membership.roles_updated` con before/after.
- Mantener roles pequenos y claros; usar clone para partir de templates, pero
  revisar permisos antes de guardar.

### Riesgo: System Roles Editables Sin Politica

Mitigacion:

- `owner` read-only en V1.
- System roles clonables, no editables.
- Custom roles editables.

### Riesgo: Invitations Inseguras

Mitigacion:

- Token random fuerte.
- Hash en DB.
- Expiration con `expiresAt` validado al aceptar.
- No usar `isValid`; derivar validez de `status == PENDING && now < expiresAt`.
- Marcar `EXPIRED` cuando se intente aceptar una invitacion vencida.
- Reenvios con rotacion de token, `resendCount`, `lastSentAt` y limite
  inicial recomendado de 3 reenvios.
- Email/session match.
- Audit.

## Recomendacion Final

La implementacion inmediata debe ser RBAC tenant-scoped, no jerarquia interna:

```txt
Tenant
  Roles
  Permissions
  Users / Memberships
  Invitations
```

Dentro de ese RBAC tenant-scoped, un membership puede tener varios roles y sus
permisos efectivos son la union OR de esos roles. Esta decision cubre casos
reales como manager + supervisor + finance viewer sin introducir todavia scopes
internos por branch o department.

El backend debe concentrar la seguridad con `TenantGuard`, `PermissionsGuard`,
use cases tenant-scoped y `AccessPolicyService`. El frontend debe construir una
experiencia administrativa clara con tabs, tablas, drawers, toasts y
confirmaciones, pero siempre asumiendo que la autorizacion real vive en el
backend.

Esta version deja una base estable para agregar luego:

```txt
MembershipAccessScope
Employer/Branch/Department/Location scope
Tenant default settings + scoped overrides
authzVersion o claims livianos
```

pero evita pagar esa complejidad antes de tener roles, usuarios e invitaciones
funcionando correctamente.
