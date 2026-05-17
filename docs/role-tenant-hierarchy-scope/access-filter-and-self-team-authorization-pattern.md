# Access Filter And Self/Team Authorization Pattern

Fecha: 2026-05-17

## Objetivo

Definir un patron reusable para implementar nuevos modulos employee-facing y
admin/manager-facing sin depender todavia de `MembershipAccessScope`, pero
dejando el codigo listo para agregarlo despues.

Aplica a modulos como:

```txt
employee profile
timesheets
leave requests
documents
approvals
performance reviews
compensation
```

## Problema Que Evita

Hoy el sistema ya valida `tenantId`. Eso es correcto para aislamiento entre
tenants, pero no es suficiente para autorizacion interna.

Riesgo:

```txt
WHERE tenantId = currentTenant
```

Si esa condicion se usa sola en pantallas admin/manager, mas adelante sera
costoso agregar:

```txt
OrganizationUnit
MembershipAccessScope
DIRECT_REPORTS
```

porque habra que corregir muchas queries dispersas.

## Regla Central

Separar siempre tres niveles:

```txt
Tenant isolation:
  el recurso pertenece al tenant actual.

Self access:
  el usuario opera sobre su propio employee/recurso.

Managed access:
  el usuario opera sobre recursos de otros.
```

En codigo:

```txt
tenantId no debe ser la unica regla de autorizacion.
tenantId es la base minima de aislamiento.
self y managed access son reglas adicionales.
```

## Vocabulario

### Self Access

Acciones sobre datos propios:

```txt
profile.self.read
profile.self.update
timesheet.self.submit
leave.self.request
documents.self.read
```

Validacion principal:

```txt
resource.employee.userId = currentUser.id
```

o:

```txt
resource.employeeId = currentEmployee.id
```

### Managed Access

Acciones sobre datos de otros:

```txt
employees.read
employees.team.read
timesheet.team.approve
leave.team.approve
documents.manage
```

Validacion actual:

```txt
permissions + direct reports / tenant-wide
```

Validacion futura:

```txt
permissions + MembershipAccessScope
```

### Access Filter

Objeto que describe que recursos puede consultar un usuario.

No es una entidad de DB obligatoria. Es un objeto de aplicacion que se pasa a
repositories/use cases.

## Estado Actual Relevante

El backend ya tiene una pieza similar:

```txt
apps/api/src/modules/employees/application/services/employee-visibility.service.ts
```

Hoy distingue:

```txt
employees.read
employees.team.read
employees.self.read
```

Y `ListEmployeesUseCase` ya resuelve:

```txt
currentEmployee
self
direct reports
all
```

Ese patron debe extenderse a nuevos modulos, no reemplazarse.

## Patron Recomendado

Cada modulo nuevo debe tener una capa de autorizacion/visibilidad propia o
compartida.

Ejemplos:

```txt
EmployeeVisibilityService
TimesheetAccessService
LeaveRequestAccessService
DocumentAccessService
```

Cada service debe trabajar con un contexto comun:

```ts
interface AccessContext {
  readonly tenantId: string;
  readonly userId: string;
  readonly permissions: readonly string[];
  readonly currentEmployeeId?: string | null;
  readonly accessScopes?: readonly AccessScopeSummary[];
}
```

`accessScopes` puede estar vacio hoy. Cuando se implemente
`MembershipAccessScope`, se llena sin cambiar la forma general de los use cases.

## Access Filter Conceptual

```ts
interface ResourceAccessFilter {
  readonly tenantId: string;
  readonly canAccessTenant: boolean;
  readonly currentEmployeeId?: string | null;
  readonly directReportsOfEmployeeId?: string | null;
  readonly allowedOrganizationUnitIds?: readonly string[];
}
```

Hoy:

```txt
canAccessTenant:
  true si tiene permiso tenant-wide, por ejemplo employees.read.

directReportsOfEmployeeId:
  true para managers con employees.team.read.

allowedOrganizationUnitIds:
  vacio hasta MembershipAccessScope.
```

Futuro:

```txt
allowedOrganizationUnitIds:
  viene de MembershipAccessScope ORGANIZATION_UNIT.
```

## Flujo Recomendado En Use Cases

```txt
1. Resolver currentEmployee por tenantId + userId.
2. Construir AccessContext.
3. Validar permiso self o managed.
4. Construir ResourceAccessFilter.
5. Pasar filter al repository.
6. Repository aplica tenantId + access filter.
7. Service filtra/oculta campos sensibles si corresponde.
```

No recomendado:

```txt
Controller llama repository directo con tenantId.
Repository decide permisos leyendo request.
Frontend filtra datos sensibles.
```

## Patron Para Endpoints Self

Ejemplo:

```txt
GET /me/employee-profile
POST /me/timesheets
POST /me/leave-requests
```

Use case:

```txt
1. Requiere permission self.
2. Busca currentEmployee por tenantId + userId.
3. Opera solo sobre currentEmployee.id.
4. No requiere MembershipAccessScope.
```

Validacion:

```txt
si no hay currentEmployee -> Forbidden o NotFound segun caso.
si recurso.employeeId != currentEmployee.id -> Forbidden.
```

## Patron Para Endpoints Team/Admin

Ejemplo:

```txt
GET /timesheets/pending-approval
POST /timesheets/:timesheetId/approve
GET /leave-requests/pending
POST /leave-requests/:requestId/approve
```

Use case:

```txt
1. Requiere permission team/admin.
2. Construye access filter.
3. Busca solo recursos dentro del access filter.
4. Para acciones por id, carga recurso tenant-scoped y valida que target
   employee este dentro del access filter.
```

Hoy:

```txt
team = direct reports.
admin = tenant-wide si tiene permiso amplio.
```

Futuro:

```txt
team/admin = direct reports, organization units o tenant-wide segun scopes.
```

## Ejemplo Timesheet

### Submit Own Timesheet

```txt
Permission:
  timesheet.self.submit

Access:
  ownership

Query:
  create timesheet with employeeId = currentEmployee.id
```

### Approve Timesheet

```txt
Permission:
  timesheet.team.approve

Access:
  target timesheet employee must be inside access filter
```

Repository method conceptual:

```ts
findTimesheetForAction(
  tenantId: string,
  timesheetId: string,
  accessFilter: ResourceAccessFilter
)
```

No hacer:

```txt
findFirst({ where: { id: timesheetId, tenantId } })
```

sin validar despues el target employee.

## Ejemplo Leave Requests

### Employee Request

```txt
Permission:
  leave.self.request

Access:
  currentEmployee only
```

### Manager Approve

```txt
Permission:
  leave.team.approve

Access:
  direct reports ahora
  org units futuro
```

## Como Preparar Repositories

Para cada modulo con recursos asociados a employee, guardar siempre:

```txt
tenantId
employeeId
```

Ejemplos:

```txt
Timesheet:
  tenantId
  employeeId

LeaveRequest:
  tenantId
  employeeId

Document:
  tenantId
  employeeId
```

Esto permite resolver:

```txt
self ownership
direct reports
organization unit via current EmployeeJobAssignment
tenant-wide
```

## Access Filter En Queries

Hoy:

```txt
tenant-wide:
  employee.tenantId = tenantId

self:
  employee.id = currentEmployeeId

direct reports:
  employee.managerRelations.some(managerEmployeeId = currentEmployeeId)
```

Futuro con OrganizationUnit:

```txt
employee.jobAssignments.some(
  effectiveTo = null
  organizationUnitId IN allowedOrganizationUnitIds
)
```

Para modulos como timesheet:

```txt
timesheet.employee.jobAssignments.some(...)
```

## Reglas Para Nuevos Modulos

```txt
1. Todo recurso employee-owned debe tener tenantId y employeeId.
2. Todo endpoint self debe resolver currentEmployee.
3. Todo endpoint sobre otros debe usar AccessFilter.
4. No hacer autorizacion solo en frontend.
5. No consultar recursos admin solo con tenantId.
6. No duplicar roles por OrganizationUnit.
7. No requerir MembershipAccessScope para self.
8. Preparar use cases para recibir accessScopes aunque aun no existan.
```

## Backend Checklist Para Un Nuevo Modulo

```txt
1. Crear entity con tenantId + employeeId si aplica.
2. Crear DTOs con class-validator.
3. Crear repository port.
4. Crear Prisma repository.
5. Crear AccessService del modulo.
6. Crear self use cases.
7. Crear team/admin use cases.
8. Controller pasa CurrentTenant + CurrentUser + tenant.permissions.
9. Use case resuelve currentEmployee.
10. Tests cubren self, direct reports, tenant-wide y forbidden.
```

## Frontend Checklist Para Un Nuevo Modulo

```txt
1. Separar rutas/pantallas self de team/admin si tienen reglas distintas.
2. Usar permisos para mostrar navegacion.
3. No asumir que tener ruta visible significa acceso a todos los datos.
4. Mostrar empty states para listas filtradas.
5. No filtrar datos sensibles solo en cliente.
```

Ejemplo:

```txt
/my-timesheets
  employee self

/timesheets/approvals
  manager/admin
```

## Relacion Con MembershipAccessScope

Cuando se agregue `MembershipAccessScope`, el cambio esperado debe ser:

```txt
1. TenantContext incluye accessScopes.
2. AccessService construye allowedOrganizationUnitIds.
3. Repositories agregan filtros por OrganizationUnit.
4. Use cases mantienen la misma forma general.
```

Si los modulos ya usan `AccessFilter`, la migracion sera local y controlada.

Si los modulos tienen queries directas por `tenantId`, la migracion sera mas
costosa.

## Testing Recomendado

Por cada modulo:

```txt
self:
  usuario accede a su recurso propio.
  usuario no accede a recurso de otro.

team:
  manager accede a direct report.
  manager no accede a empleado que no reporta a el.

tenant-wide:
  admin accede a cualquier recurso del tenant.
  admin no accede a otro tenant.

future scope readiness:
  AccessFilter soporta allowedOrganizationUnitIds aunque este vacio.
```

## Decision Recomendada

No es obligatorio implementar `OrganizationUnit` y `MembershipAccessScope`
antes de timesheets, leave requests o employee profile.

Pero si es obligatorio adoptar desde ahora este patron:

```txt
self -> ownership check
team/admin -> AccessService + AccessFilter
tenantId -> aislamiento base, no autorizacion completa
```

Esto mantiene el avance actual y reduce el costo de agregar scopes internos
mas adelante.
