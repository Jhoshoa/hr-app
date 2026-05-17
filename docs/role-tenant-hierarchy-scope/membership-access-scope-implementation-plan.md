# MembershipAccessScope Implementation Plan

Fecha: 2026-05-17

## Objetivo

Planificar la implementacion de `MembershipAccessScope` para limitar lo que un
usuario puede ver o administrar dentro de un tenant.

Este documento asume que primero se implementa:

```txt
OrganizationUnit
OrganizationUnitType
EmployeeJobAssignment.organizationUnitId
```

`MembershipAccessScope` no reemplaza roles ni permisos. Extiende la
autorizacion para responder:

```txt
Donde o sobre quienes puede ejercer este usuario sus permisos?
```

## Principio Central

Separar:

```txt
Role + Permission:
  que puede hacer.

MembershipAccessScope:
  donde/sobre quienes puede hacerlo cuando actua sobre otros.

Ownership:
  si actua sobre su propio registro.

EmployeeJobAssignment:
  donde trabaja el empleado.
```

Ejemplo:

```txt
Ana tiene roles employee + manager.
employee le permite usar sus propias vistas.
manager le permite ver/aprobar datos de otros.
MembershipAccessScope limita esos otros a DIRECT_REPORTS o OrganizationUnit.
```

## Estado Actual Relevante

### Backend

El backend ya tiene:

```txt
TenantGuard -> ResolveTenantContextUseCase
PermissionsGuard -> valida permisos en request.tenant.permissions
TenantContext -> id, slug, roles, permissions
EmployeeVisibilityService -> self/team/all
ListEmployeesUseCase -> employees.read, employees.team.read, employees.self.read
PrismaUsersRepository -> resuelve roles/permisos por membership
PrismaTenantUsersRepository -> lista usuarios y roles efectivos
```

`EmployeeVisibilityService` ya es el punto natural para evolucionar reglas de
visibilidad.

### Frontend

`AccessSettingsPage` ya maneja:

```txt
Users
Roles
Invitations
```

La UI actual permite editar roles de un tenant user. No existe UI para scopes.

### Permisos Existentes

Ya existen:

```txt
employees.read
employees.self.read
employees.team.read
employees.manage
users.read
users.manage
roles.manage
organization.read
organization.manage
```

No hace falta crear permisos nuevos para la primera version de scopes.

## Para Que Sirve MembershipAccessScope

Casos:

```txt
HR staff solo de Santa Cruz.
Manager que ve solo direct reports.
Manager que ve toda una OrganizationUnit.
Finance viewer solo de Subsidiaria Peru.
Recruiter solo de una unidad de negocio.
Approver de vacaciones de una oficina.
Owner/admin tenant-wide.
```

No se debe usar para:

```txt
employee normal viendo su propio perfil;
employee normal enviando su propio timesheet;
employee normal solicitando sus propias vacaciones.
```

Esos casos usan permisos `self` + ownership:

```txt
employee.userId = currentUser.id
```

## Modelo De Datos Propuesto

### Enum

```prisma
enum AccessScopeType {
  TENANT
  ORGANIZATION_UNIT
  DIRECT_REPORTS
}
```

Para v1, no agregar mas de lo necesario.

Opciones futuras:

```txt
DEPARTMENT
LOCATION
SELF
```

Pero no recomendadas para v1.

### MembershipAccessScope

```prisma
model MembershipAccessScope {
  id           String          @id @default(uuid()) @db.Uuid
  tenantId     String          @db.Uuid
  membershipId String          @db.Uuid
  scopeType    AccessScopeType
  scopeId      String?         @db.Uuid
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  tenant       Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  membership   TenantMembership @relation(fields: [membershipId], references: [id], onDelete: Cascade)

  @@unique([membershipId, scopeType, scopeId])
  @@index([tenantId, scopeType])
  @@index([tenantId, scopeId])
  @@index([membershipId])
}
```

Limitacion:

```txt
scopeId es polimorfico.
Para ORGANIZATION_UNIT apunta a OrganizationUnit.id.
Para TENANT y DIRECT_REPORTS debe ser null.
```

Prisma no garantiza FK polimorfica. Validar en application service.

Si se quiere FK estricta para OrganizationUnit en v1:

```txt
agregar organizationUnitId especifico en vez de scopeId generico.
```

Pero eso hace mas dificil extender a Department/Location despues.

Recomendacion:

```txt
usar scopeType + scopeId;
validar scopeId por scopeType en backend;
mantener indices.
```

## Reglas De Datos

```txt
TENANT:
  scopeId debe ser null.

DIRECT_REPORTS:
  scopeId debe ser null.

ORGANIZATION_UNIT:
  scopeId requerido.
  scopeId debe existir como OrganizationUnit ACTIVE del mismo tenant.
```

Regla de owner:

```txt
todo membership con role owner debe tener scope efectivo TENANT.
```

Esto puede implementarse como:

```txt
1. crear fila TENANT para owner, o
2. resolver TENANT implicitamente si tiene role owner.
```

Recomendacion v1:

```txt
Resolver TENANT implicitamente para owner para evitar romper tenants existentes.
Permitir guardar explicitamente TENANT para usuarios administrativos.
```

## Backend: Cambios De Contexto

Actualizar:

```txt
TenantContext
TenantMembershipContext
PrismaUsersRepository.toMembershipContext()
ResolveTenantContextUseCase
```

Agregar a `TenantContext`:

```ts
accessScopes?: readonly {
  readonly id: string;
  readonly scopeType: "TENANT" | "ORGANIZATION_UNIT" | "DIRECT_REPORTS";
  readonly scopeId?: string | null;
}[];
```

Tambien conviene agregar:

```txt
membershipId
```

al `TenantContext`, porque scopes pertenecen a membership.

Nuevo TenantContext conceptual:

```ts
interface TenantContext {
  id: string;
  slug: string;
  name?: string;
  membershipId: string;
  roleKey: string;
  roles?: RoleSummary[];
  permissions: string[];
  accessScopes: AccessScopeSummary[];
}
```

Impacto:

```txt
frontend CurrentUser/TenantSummary tambien puede recibir accessScopes.
```

No usar accessScopes en navigation todavia. Son para backend enforcement y UI
de access settings.

## Backend: Repositorios

Agregar port:

```txt
membership-access-scopes.repository.port.ts
```

Funciones:

```txt
listByMembership(tenantId, membershipId)
replaceForMembership(input)
findEffectiveScopesForMembership(tenantId, membershipId)
```

Input:

```txt
tenantId
membershipId
scopes: [{ scopeType, scopeId }]
```

Validaciones dentro del use case:

```txt
1. membership existe y pertenece al tenant.
2. scope values validos.
3. ORGANIZATION_UNIT scopeId pertenece al tenant y esta ACTIVE.
4. no permitir scopes vacios si usuario tiene permisos sobre otros, salvo que
   se defina fallback.
5. no permitir quitar TENANT efectivo al ultimo owner.
```

## Backend: Modulo Access

`MembershipAccessScope` pertenece naturalmente al modulo `access`, porque se
asigna a tenant users/memberships.

Agregar:

```txt
domain/entities/membership-access-scope.entity.ts
domain/ports/membership-access-scopes.repository.port.ts
infrastructure/persistence/prisma-membership-access-scopes.repository.ts
application/use-cases/list-membership-access-scopes.use-case.ts
application/use-cases/update-membership-access-scopes.use-case.ts
presentation/dto/membership-access-scope.dto.ts
```

Endpoints:

```txt
GET /api/v1/tenant-users/:membershipId/access-scopes
PUT /api/v1/tenant-users/:membershipId/access-scopes
```

Permiso:

```txt
users.manage
```

Por que no `roles.manage`:

```txt
los scopes se asignan a usuarios/memberships, no a roles.
```

## Backend: Integracion Con Tenant Users

Actualizar `TenantUserEntity`:

```txt
accessScopes: AccessScopeEntity[]
```

Actualizar `PrismaTenantUsersRepository.membershipInclude` para incluir scopes.

List users debe devolver:

```txt
roles
effectivePermissions
accessScopes
```

Esto permite que AccessSettingsPage muestre roles + scopes.

## Backend: EmployeeVisibilityService

Estado actual:

```txt
canReadAll -> employees.read
canReadTeam -> employees.team.read
canReadSelf -> employees.self.read
```

Evolucion:

```txt
employees.read:
  no siempre significa todo el tenant si el usuario tiene scopes limitados.

employees.team.read:
  puede significar DIRECT_REPORTS y/o ORGANIZATION_UNIT dependiendo scopes.

employees.self.read:
  ownership.
```

Nueva interfaz:

```ts
interface EmployeeAccessContext {
  userId: string;
  permissions: string[];
  currentEmployeeId?: string | null;
  accessScopes: AccessScopeSummary[];
}
```

Reglas:

```txt
1. Si tiene scope TENANT y permission employees.read:
   puede listar/ver todo el tenant.

2. Si tiene permission employees.read o employees.team.read y scope ORGANIZATION_UNIT:
   puede listar/ver empleados con current job assignment en esas units.

3. Si tiene permission employees.team.read y scope DIRECT_REPORTS:
   puede listar/ver direct reports.

4. Si tiene employees.self.read:
   puede ver su propio employee por ownership.

5. Si no tiene scopes y no es self/direct report:
   denegar.
```

Compatibilidad:

```txt
Durante rollout, roles owner/hr_admin existentes pueden recibir scope TENANT
implicitamente si no hay scopes guardados.
```

Sin compatibilidad, se puede romper `employees.read` para todos los tenants
existentes.

## Backend: Employees Repository

Agregar metodos o filtros:

```txt
EmployeeListFilters.organizationUnitId?: string
EmployeeListFilters.allowedOrganizationUnitIds?: string[]
EmployeeListFilters.directReportsOfEmployeeId?: string
```

Recomendacion:

```txt
No mezclar filtros externos de UI con filtros de seguridad en el mismo objeto
sin nombrarlos claramente.
```

Ejemplo:

```ts
interface EmployeeListFilters {
  status?: EmployeeStatus;
  search?: string;
  departmentId?: string;
  locationId?: string;
  organizationUnitId?: string;
}

interface EmployeeAccessFilter {
  canAccessTenant: boolean;
  allowedOrganizationUnitIds: string[];
  directReportsOfEmployeeId?: string;
  includeSelfEmployeeId?: string;
}
```

El use case combina ambos.

Repositorio puede exponer:

```txt
listWithAccess(tenantId, filters, accessFilter)
```

O mantener metodos separados:

```txt
list()
listByOrganizationUnits()
listDirectReportsByManagerUserId()
```

Para menor refactor v1:

```txt
mantener list() y listDirectReportsByManagerUserId();
agregar listByOrganizationUnitIds();
combinar resultados en use case y deduplicar por employee.id.
```

## Backend: ListEmployeesUseCase V1

Flujo recomendado:

```txt
1. Resolver currentEmployee.
2. Construir accessContext con scopes.
3. Si self allowed, incluir currentEmployee.
4. Si TENANT + employees.read, usar repository.list().
5. Si ORGANIZATION_UNIT scope + employees.read/team.read, usar listByOrganizationUnitIds().
6. Si DIRECT_REPORTS + employees.team.read, usar listDirectReportsByManagerUserId().
7. Deduplicar employees.
8. Pasar por EmployeeVisibilityService.filterEmployees().
```

Esto conserva la logica self/team actual y agrega OrganizationUnit.

## Backend: GetEmployeeUseCase

Debe validar el empleado objetivo contra scopes:

```txt
1. buscar employee por tenant/id.
2. EmployeeVisibilityService.assertCanViewEmployee(employee, accessContext).
3. assert revisa self, direct reports, org unit, tenant.
```

Para org unit:

```txt
employee.jobAssignments.some(current assignment organizationUnitId in allowed ids)
```

## Backend: Export/Import/Manage

No olvidar endpoints no-list:

```txt
GET /employees/export.csv
POST /employees/import.csv
PATCH /employees/:id
PATCH /employees/:id/profile
POST /employees/:id/job-assignments
POST /employees/:id/manager-relationships
POST /employees/:id/compensation-records
PATCH /employees/:id/custom-field-values/:fieldDefinitionId
```

Decidir por fase:

```txt
Fase inicial:
  aplicar scopes solo a read/list/get/export.

Fase siguiente:
  aplicar scopes a manage/update/create operations.
```

Riesgo:

```txt
Si users with limited scope can still PATCH any employee with employees.manage,
scope enforcement queda incompleto.
```

Recomendacion:

```txt
Si se introduce MembershipAccessScope, aplicar al menos a read y manage de
employees en la misma entrega piloto.
```

## Frontend: Access Settings

La UI actual de access settings edita roles de un usuario.

Agregar scopes en el mismo flujo:

```txt
Edit user roles and access
```

O en una accion separada:

```txt
Edit access scope
```

Recomendacion v1:

```txt
accion separada para reducir riesgo:
  Edit roles
  Edit access scope
```

Panel de scopes:

```txt
Scope type:
  Tenant-wide
  Organization units
  Direct reports

Organization units:
  multi-select de active OrganizationUnits
```

Validaciones frontend:

```txt
1. TENANT no permite organization units seleccionadas.
2. DIRECT_REPORTS no permite scopeId.
3. ORGANIZATION_UNIT requiere al menos una unit.
4. owner debe mostrar tenant-wide bloqueado o recomendado.
```

Pero el backend debe repetir todas.

## Frontend: Current User

Actualizar tipos:

```txt
TenantSummary.accessScopes?
```

No usar para ocultar navegacion inicialmente, porque la navegacion sigue siendo
permission-based. Los scopes limitan datos, no necesariamente rutas.

Ejemplo:

```txt
Un HR limitado a Santa Cruz puede ver /employees.
La lista solo devuelve Santa Cruz.
```

## Frontend: Employees

Cuando backend aplica scopes:

```txt
1. Employees page no necesita saber todos los scopes para ser segura.
2. Puede mostrar filtros disponibles.
3. Si backend devuelve solo empleados permitidos, la UI no debe intentar
   re-expandir acceso.
```

Mejoras:

```txt
- filtro OrganizationUnit solo muestra active units;
- si usuario no tiene TENANT scope, UI podria mostrar "Limited access" si
  current user incluye scopes;
- no depender de esa UI para seguridad.
```

## Seed / Backfill

Problema:

```txt
tenants existentes no tienen MembershipAccessScope.
```

Opciones:

### Opcion A: Scopes Implicitos Por Rol

```txt
owner -> TENANT
hr_admin -> TENANT
hr_staff -> TENANT inicialmente
manager -> DIRECT_REPORTS inicialmente
employee -> no scope requerido
```

Ventaja:

```txt
no rompe tenants existentes.
```

Costo:

```txt
hay reglas implicitas en codigo.
```

### Opcion B: Backfill Fisico

Crear filas:

```txt
owner memberships -> TENANT
hr_admin memberships -> TENANT
manager memberships -> DIRECT_REPORTS
```

Ventaja:

```txt
datos explicitos.
```

Costo:

```txt
migracion/backfill mas delicado.
```

Recomendacion:

```txt
Fase inicial: resolver owner como TENANT implicito.
Backfill opcional para otros roles mediante comando.
Nuevas asignaciones usan UI explicita.
```

## Testing Backend

### Unit Tests

Agregar:

```txt
MembershipAccessScopesRepository tests si hay setup.
UpdateMembershipAccessScopesUseCase
EmployeeVisibilityService scope tests
ListEmployeesUseCase scope tests
GetEmployeeUseCase scope tests
```

Casos:

```txt
1. TENANT scope permite employees.read de todo el tenant.
2. ORGANIZATION_UNIT scope limita employees.read a units permitidas.
3. DIRECT_REPORTS scope limita employees.team.read a reports.
4. employees.self.read permite self aunque no tenga scopes.
5. usuario con org unit scope no ve empleado de otra unit.
6. usuario con multiple scopes deduplica resultados.
7. owner tiene TENANT implicitamente.
8. update scopes rechaza OrganizationUnit de otro tenant.
9. update scopes rechaza scopeId en TENANT.
10. update scopes rechaza ORGANIZATION_UNIT sin scopeId.
```

### E2E

Casos criticos:

```txt
1. HR Santa Cruz lista solo empleados Santa Cruz.
2. HR Santa Cruz GET empleado La Paz recibe 403.
3. Manager DIRECT_REPORTS lista reportes y self si tiene self permission.
4. Owner lista todo.
5. Limited user no puede update employee fuera de scope.
6. Tenant A no puede asignar scope con OrganizationUnit de Tenant B.
```

## Testing Frontend

### Access Settings

Casos:

```txt
1. muestra boton Edit access scope.
2. carga organization units activas.
3. guarda TENANT scope.
4. guarda DIRECT_REPORTS scope.
5. guarda multiples ORGANIZATION_UNIT scopes.
6. valida que ORGANIZATION_UNIT requiere seleccion.
7. muestra scopes en tenant users table.
```

### Employees

Casos:

```txt
1. empleados page renderiza con resultados filtrados por backend.
2. filtros organizationUnitId no rompen llamadas existentes.
3. limited access empty state es claro si backend devuelve lista vacia.
```

## Riesgos Y Mitigaciones

### Riesgo: Falsa Seguridad

Crear la tabla sin aplicar filtros no protege nada.

Mitigacion:

```txt
No considerar la fase terminada hasta aplicar scopes a employees read/manage.
```

### Riesgo: Romper Usuarios Existentes

Si todos quedan sin scopes, `employees.read` podria no devolver nada.

Mitigacion:

```txt
owner TENANT implicito;
backfill/comando para admins existentes;
feature flag opcional si el equipo lo requiere.
```

### Riesgo: Mezclar Self Con Scopes

Employee normal no debe requerir MembershipAccessScope para su propia vista.

Mitigacion:

```txt
mantener ownership checks separados.
tests de employees.self.read.
```

### Riesgo: Scope Polimorfico Sin FK

`scopeId` puede apuntar a distintas tablas.

Mitigacion:

```txt
validacion application service por scopeType;
indices;
tests cross-tenant.
```

### Riesgo: Performance

Resolver scopes en cada request puede sumar joins.

Mitigacion:

```txt
incluir scopes en TenantContext una vez por request;
cache request-level si hace falta;
queries por batch para organizationUnitIds.
```

### Riesgo: Access Settings Demasiado Complejo

Roles + scopes puede confundir al admin.

Mitigacion:

```txt
separar Edit roles y Edit access scope;
copys simples:
  Tenant-wide
  Selected organization units
  Direct reports only
```

## Fases De Implementacion

### Fase 0: Prerrequisitos

```txt
1. OrganizationUnit implementado.
2. EmployeeJobAssignment.organizationUnitId existe.
3. Employees puede filtrar por organizationUnitId.
4. Organization settings permite gestionar units.
```

DoD:

```txt
La estructura organizacional ya existe antes de asignar scopes.
```

### Fase 1: Base De Datos

```txt
1. Agregar AccessScopeType enum.
2. Agregar MembershipAccessScope model.
3. Agregar relaciones en Tenant y TenantMembership.
4. Crear migracion.
5. db:generate.
```

DoD:

```txt
Scopes pueden persistirse sin tocar aun autorizacion.
```

### Fase 2: Backend Access CRUD

```txt
1. Crear entity/port/repository.
2. Crear DTOs.
3. Crear ListMembershipAccessScopesUseCase.
4. Crear UpdateMembershipAccessScopesUseCase.
5. Agregar endpoints en TenantUsersController o controller nuevo.
6. Validar scopeType/scopeId.
7. Agregar tests unitarios.
```

DoD:

```txt
Admin puede asignar scopes a membership de su tenant.
No puede asignar scopes cross-tenant.
```

### Fase 3: TenantContext Scope-Aware

```txt
1. Agregar membershipId y accessScopes a TenantMembershipContext.
2. Actualizar PrismaUsersRepository includes.
3. Actualizar ResolveTenantContextUseCase.
4. Actualizar request-context.ts.
5. Actualizar current user response/types si aplica.
```

DoD:

```txt
Cada request tiene roles, permissions y accessScopes disponibles.
```

### Fase 4: Employee Read Enforcement

```txt
1. Extender EmployeeAccessContext.
2. Extender EmployeeVisibilityService.
3. Agregar repository method para listByOrganizationUnitIds.
4. Actualizar ListEmployeesUseCase.
5. Actualizar GetEmployeeUseCase.
6. Aplicar a export.csv si corresponde.
7. Agregar tests.
```

DoD:

```txt
Read/list/get/export respetan scopes.
Self sigue funcionando sin scopes.
Owner/admin tenant-wide siguen funcionando.
```

### Fase 5: Employee Manage Enforcement

```txt
1. Definir permisos manage scope-aware.
2. Antes de update/profile/job assignment/manager relationship/compensation,
   validar target employee dentro del scope.
3. Crear helper/assert service para no duplicar.
4. Agregar tests.
```

DoD:

```txt
Un usuario limitado no puede modificar empleados fuera de su scope.
```

### Fase 6: Frontend Access Settings

```txt
1. Agregar access scope types.
2. Agregar RTK endpoints.
3. Agregar tagTypes.
4. Mostrar scopes en Users table.
5. Crear EditAccessScopeDrawer.
6. Cargar OrganizationUnits activas.
7. Validar formularios.
8. Agregar component tests.
```

DoD:

```txt
Admin puede asignar tenant-wide, direct reports u organization units desde UI.
```

### Fase 7: UX Employees

```txt
1. Agregar filtro OrganizationUnit si no existe.
2. Mostrar mensaje de limited access si current tenant trae scopes limitados.
3. Asegurar empty state claro.
4. No usar UI como enforcement.
```

DoD:

```txt
La experiencia no confunde lista vacia por scope con error de sistema.
```

### Fase 8: Hardening

```txt
1. E2E cross-tenant y cross-scope.
2. Revisar audit events.
3. Revisar performance.
4. Documentar rollout/backfill.
5. Actualizar README o docs de access settings.
```

DoD:

```txt
MembershipAccessScope protege datos reales y esta cubierto por tests.
```

## Audit Events Recomendados

```txt
membership_access_scope.updated
membership_access_scope.cleared
employee_access.denied_out_of_scope
```

Metadata:

```txt
membershipId
targetUserId
beforeScopes
afterScopes
actorUserId
tenantId
```

## Decision Recomendada

Implementar `MembershipAccessScope` despues de `OrganizationUnit`, en una fase
piloto centrada en employees.

Alcance v1:

```txt
scope types:
  TENANT
  ORGANIZATION_UNIT
  DIRECT_REPORTS

aplicar a:
  employees list/get/export
  employees manage operations

no aplicar todavia a:
  roles
  organization settings
  audit
  company settings
```

La regla final:

```txt
Acciones self:
  Permission self + ownership.

Acciones sobre otros:
  Permission + MembershipAccessScope.

Owner:
  TENANT implicit or explicit.
```
