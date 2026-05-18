# OrganizationUnit Implementation Plan

Fecha: 2026-05-17

Ultima actualizacion de implementacion: 2026-05-18

## Objetivo

Planificar la implementacion de `OrganizationUnit` como entidad principal para
la jerarquia configurable de una compania dentro de un tenant.

Decision aceptada:

```txt
OrganizationUnit representa la jerarquia configurable de la compania.
Location conserva su responsabilidad actual de ubicacion fisica/sitio de trabajo.
OrganizationUnit puede relacionarse opcionalmente con Location mediante primaryLocationId.
Al crear una OrganizationUnit, el owner puede seleccionar una Location existente
o crear una nueva como sede principal, pero no debe ser obligatorio.
```

Este documento es la antesala para implementar `MembershipAccessScope`. No debe
meter seguridad por scope todavia; debe dejar el modelo listo para que el
siguiente paso pueda limitar usuarios por `OrganizationUnit`.

## Documentos Base

Este plan se basa en:

```txt
docs/role-permission-planning/tenant-owned-config-and-configurable-location-scope-alternative.md
docs/role-permission-planning/roles-membership-access-scope-and-employee-scenarios.md
docs/role-permission-planning/default-template-and-scoped-override-architecture.md
docs/role-permission-analisis/core-role-availability-and-future-scope-analysis.md
```

## Estado Actual Del Proyecto

### Base De Datos

Hoy el schema ya tiene entidades tenant-scoped para configuracion operativa:

```txt
Department
Location
JobTitle
EmploymentType
WorkMode
ClientProject
Employee
EmployeeJobAssignment
ManagerRelationship
```

`Location` existe con:

```txt
tenantId
name
country
city
timezone
status
```

`EmployeeJobAssignment` ya soporta:

```txt
departmentId
jobTitleId
locationId
employmentTypeId
workModeId
effectiveFrom
effectiveTo
```

No existe hoy:

```txt
OrganizationUnit
OrganizationUnitType
EmployeeJobAssignment.organizationUnitId
```

### Backend

Hay un modulo `organization` con este patron:

```txt
presentation/controller
application/use-cases
domain/entities
domain/ports
infrastructure/persistence/prisma repository
tests/unit
```

El controller actual expone catologos:

```txt
GET/POST/PATCH/POST archive/POST reactivate:
  departments
  locations
  job-titles
  employment-types
  work-modes
  client-projects
```

Usa permisos:

```txt
organization.read
organization.manage
```

El repositorio actual maneja varios `kind` en un unico
`PrismaOrganizationRepository`.

### Employees

`employees` ya maneja job assignments y filtros por:

```txt
status
search
departmentId
locationId
```

`EmployeeVisibilityService` ya distingue:

```txt
employees.read       -> read all
employees.team.read  -> direct reports
employees.self.read  -> own employee
```

Esto es importante: `OrganizationUnit` debe integrarse primero como pertenencia
laboral, no como nueva regla de autorizacion todavia.

### Frontend

El frontend ya tiene:

```txt
src/features/organization/organization-config.ts
src/features/organization/organization-api.ts
src/features/organization/organization-types.ts
src/features/organization/components/organization-settings-page.tsx
app/(app)/settings/organization/page.tsx
```

La UI de organization settings es generica por catalogo. Usa tabs y campos
configurados en `organizationCatalogs`.

El access settings actual maneja:

```txt
users
roles
invitations
```

No debe mezclarse `OrganizationUnit` con access scopes en esta primera fase.

## Principios De Implementacion

```txt
1. No sobrecargar Location.
2. No mover significado jerarquico a User.
3. No asociar OrganizationUnit directamente a User.
4. Asociar OrganizationUnit a EmployeeJobAssignment para pertenencia laboral.
5. Mantener Location como sitio fisico.
6. Mantener tenant isolation en cada query.
7. No implementar filtros de seguridad por OrganizationUnit en esta fase.
8. Dejar nombres, ids e indices preparados para MembershipAccessScope.
```

Separacion conceptual:

```txt
OrganizationUnit:
  donde existe una persona/unidad dentro de la estructura de la compania.

Location:
  donde ocurre fisicamente el trabajo.

EmployeeJobAssignment:
  donde trabaja el empleado en un periodo de tiempo.

MembershipAccessScope:
  donde puede operar un usuario sobre otros, fase posterior.
```

## Modelo De Datos Propuesto

### Enums

No crear un enum global para tipos como `BRANCH`, `OFFICE`, `SUBSIDIARY`.
El owner debe poder configurar tipos por tenant.

### OrganizationUnitType

```prisma
model OrganizationUnitType {
  id        String       @id @default(uuid()) @db.Uuid
  tenantId  String       @db.Uuid
  key       String
  name      String
  sortOrder Int          @default(0)
  status    RecordStatus @default(ACTIVE)
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
  tenant    Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  units     OrganizationUnit[]

  @@unique([tenantId, key])
  @@unique([tenantId, name])
  @@index([tenantId, status])
}
```

Notas:

```txt
key:
  estable para integraciones y seed inicial.

name:
  visible para UI.

sortOrder:
  orden configurable en UI.
```

Tipos iniciales sugeridos por seed/comando:

```txt
branch
office
subsidiary
business_unit
legal_entity
store
warehouse
remote_team
```

### OrganizationUnit

```prisma
model OrganizationUnit {
  id                       String       @id @default(uuid()) @db.Uuid
  tenantId                 String       @db.Uuid
  parentOrganizationUnitId String?      @db.Uuid
  typeId                   String       @db.Uuid
  primaryLocationId        String?      @db.Uuid
  key                      String?
  name                     String
  legalName                String?
  code                     String?
  status                   RecordStatus @default(ACTIVE)
  createdAt                DateTime     @default(now())
  updatedAt                DateTime     @updatedAt

  tenant                   Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  type                     OrganizationUnitType @relation(fields: [typeId], references: [id])
  parentOrganizationUnit   OrganizationUnit? @relation("OrganizationUnitHierarchy", fields: [parentOrganizationUnitId], references: [id])
  childOrganizationUnits   OrganizationUnit[] @relation("OrganizationUnitHierarchy")
  primaryLocation          Location?    @relation(fields: [primaryLocationId], references: [id])
  jobAssignments           EmployeeJobAssignment[]

  @@unique([tenantId, key])
  @@unique([tenantId, name])
  @@unique([tenantId, code])
  @@index([tenantId, status])
  @@index([tenantId, typeId])
  @@index([tenantId, parentOrganizationUnitId])
  @@index([tenantId, primaryLocationId])
}
```

Notas:

```txt
primaryLocationId:
  opcional.
  debe validar que la Location pertenezca al mismo tenant.

parentOrganizationUnitId:
  opcional.
  debe validar mismo tenant.
  debe prevenir ciclos.

key/code:
  opcionales al principio, utiles para integraciones.
  revisar constraints si Postgres permite multiples NULL; con Prisma unique
  compuesto y NULL hay que validar el comportamiento real.
```

Si se quiere evitar complejidad con unique nullable en v1:

```txt
- hacer key nullable sin unique inicial;
- hacer code nullable sin unique inicial;
- validar duplicados solo cuando vengan con valor usando repository/service;
- agregar indices parciales SQL mas adelante.
```

### EmployeeJobAssignment

Agregar:

```prisma
organizationUnitId String? @db.Uuid
organizationUnit   OrganizationUnit? @relation(fields: [organizationUnitId], references: [id])

@@index([tenantId, organizationUnitId])
```

No hacerlo obligatorio en la primera migracion si ya hay datos existentes.

Estrategia:

```txt
Fase inicial:
  organizationUnitId nullable.

Fase posterior:
  cuando onboarding y UI soporten OrganizationUnit, evaluar exigirlo para
  empleados activos o assignments nuevos.
```

## Relacion Con Location

Regla:

```txt
OrganizationUnit.primaryLocationId puede apuntar a Location.
Location no debe tener parent organizacional.
Location no debe convertirse en sucursal jerarquica.
```

Al crear una OrganizationUnit:

```txt
1. El owner puede no seleccionar Location.
2. El owner puede seleccionar una Location existente del tenant.
3. Opcionalmente, la UI puede ofrecer crear una Location nueva como sede
   principal y usar su id como primaryLocationId.
```

Para v1, implementar primero:

```txt
seleccionar Location existente o dejar vacio
```

Crear Location inline puede ser fase posterior para evitar complejidad de
transacciones UI.

## Backend: Estrategia Recomendada

Hay dos caminos:

### Opcion A: Extender OrganizationRecordKind

Agregar:

```txt
organizationUnitType
organizationUnit
```

al modelo generico actual.

Ventajas:

```txt
- menos archivos nuevos;
- aprovecha la UI generica actual;
- rapido para CRUD basico.
```

Costos:

```txt
- OrganizationUnit tiene reglas mas complejas que los catalogos simples;
- necesita validar parent, type, primaryLocation y ciclos;
- el repository generico puede crecer demasiado.
```

### Opcion B Recomendada: Subdominio Dentro De OrganizationModule

Mantener `OrganizationModule`, pero crear piezas especificas:

```txt
domain/entities/organization-unit.entity.ts
domain/entities/organization-unit-type.entity.ts
domain/ports/organization-units.repository.port.ts
application/use-cases/list-organization-units.use-case.ts
application/use-cases/create-organization-unit.use-case.ts
application/use-cases/update-organization-unit.use-case.ts
application/use-cases/archive-organization-unit.use-case.ts
application/use-cases/reactivate-organization-unit.use-case.ts
application/use-cases/list-organization-unit-types.use-case.ts
application/use-cases/create-organization-unit-type.use-case.ts
...
infrastructure/persistence/prisma-organization-units.repository.ts
presentation/controllers/organization-units.controller.ts
presentation/dto/organization-unit.dto.ts
```

Ventajas:

```txt
- mantiene OrganizationUnit fuera del CRUD generico simple;
- permite reglas de jerarquia claras;
- prepara mejor MembershipAccessScope;
- evita convertir OrganizationRecordEntity en una union demasiado grande.
```

Recomendacion final:

```txt
Usar Opcion B.
```

## Backend: Endpoints Propuestos

Dentro del mismo prefijo versionado actual:

```txt
GET    /api/v1/organization-unit-types
POST   /api/v1/organization-unit-types
GET    /api/v1/organization-unit-types/:typeId
PATCH  /api/v1/organization-unit-types/:typeId
POST   /api/v1/organization-unit-types/:typeId/archive
POST   /api/v1/organization-unit-types/:typeId/reactivate

GET    /api/v1/organization-units
POST   /api/v1/organization-units
GET    /api/v1/organization-units/:unitId
PATCH  /api/v1/organization-units/:unitId
POST   /api/v1/organization-units/:unitId/archive
POST   /api/v1/organization-units/:unitId/reactivate
```

Permisos:

```txt
organization.read
organization.manage
```

No crear permisos nuevos en v1 salvo que se quiera separar:

```txt
organization-units.read
organization-units.manage
```

Recomendacion:

```txt
Reutilizar organization.read/manage por consistencia actual.
```

## Backend: DTOs Y Validaciones

### CreateOrganizationUnitTypeDto

```txt
key:
  required
  string
  2..80
  normalizado a lowercase snake_case o validado con regex

name:
  required
  string
  2..120

sortOrder:
  optional
  int
```

### CreateOrganizationUnitDto

```txt
typeId:
  required uuid

parentOrganizationUnitId:
  optional uuid

primaryLocationId:
  optional uuid

key:
  optional string 2..80

name:
  required string 2..120

legalName:
  optional string max 180

code:
  optional string max 40
```

### Validaciones De Application Service

Validar en backend, no solo frontend:

```txt
1. typeId existe, status ACTIVE y tenantId actual.
2. parentOrganizationUnitId existe, status ACTIVE y tenantId actual.
3. primaryLocationId existe, status ACTIVE y tenantId actual.
4. parentOrganizationUnitId != id en update.
5. prevenir ciclos en jerarquia.
6. name no duplicado dentro del tenant.
7. key/code no duplicados cuando tienen valor.
8. no archivar un type si tiene OrganizationUnits activas.
9. no archivar una OrganizationUnit si tiene children activos.
10. no archivar una OrganizationUnit si tiene job assignments activos, salvo
    que la politica permita historico.
```

Para v1, politica recomendada de archive:

```txt
OrganizationUnitType:
  bloquear archive si hay OrganizationUnits ACTIVE con ese type.

OrganizationUnit:
  bloquear archive si tiene childOrganizationUnits ACTIVE.
  bloquear archive si tiene EmployeeJobAssignment actual effectiveTo null.
```

## Backend: Repositorio

Funciones recomendadas:

```txt
listTypes(tenantId)
findTypeById(tenantId, typeId)
createType(input)
updateType(input)
setTypeStatus(tenantId, typeId, status)

listUnits(tenantId, filters?)
findUnitById(tenantId, unitId)
createUnit(input)
updateUnit(input)
setUnitStatus(tenantId, unitId, status)
countActiveUnitsByType(tenantId, typeId)
countActiveChildren(tenantId, unitId)
countCurrentJobAssignments(tenantId, unitId)
findAncestorIds(tenantId, unitId)
```

Evitar validar tenant ownership con `findUnique(id)` solamente. Usar:

```txt
findFirst({ where: { id, tenantId } })
```

como ya hace `PrismaOrganizationRepository`.

## Employees Integration

### DB

Agregar `organizationUnitId` a `EmployeeJobAssignment`.

### DTO

Actualizar:

```txt
AddEmployeeJobAssignmentDto.organizationUnitId?: string
```

con:

```txt
@IsOptional()
@IsUUID()
```

### Domain Port

Actualizar:

```txt
EmployeeListFilters.organizationUnitId?: string
AddEmployeeJobAssignmentInput.organizationUnitId?: string
EmployeeJobAssignmentEntity.organizationUnitId?: string | null
```

### Repository

Actualizar:

```txt
list()
listDirectReportsByManagerUserId()
addJobAssignment()
toEmployeeEntity()
```

para incluir y filtrar por `organizationUnitId`.

### Controller

Actualizar `GET /employees` y `GET /employees/export.csv`:

```txt
@Query("organizationUnitId") organizationUnitId?: string
```

### Validacion De Tenant

Antes de crear job assignment:

```txt
organizationUnitId, si viene, debe existir en el mismo tenant y estar ACTIVE.
```

El lugar correcto puede ser el use case `AddEmployeeJobAssignmentUseCase` con un
repositorio/servicio de organization, o un metodo de validacion dentro del
employees repository. Preferible:

```txt
OrganizationModule exporta un port/repository o service de validacion.
EmployeesModule importa OrganizationModule.
```

No duplicar queries de ownership en varios lugares sin una funcion comun.

## Frontend: Organization Settings

### Mantener Location Como Catalogo

El tab `Locations` debe seguir existiendo con la descripcion actual:

```txt
Countries, cities, and time zones where employees work.
```

### Agregar Organization Units

Hay dos opciones:

### Opcion A: Integrarlo En OrganizationSettingsPage

Agregar tabs:

```txt
Organization unit types
Organization units
```

Ventaja:

```txt
encaja en la pantalla actual.
```

Riesgo:

```txt
OrganizationUnit requiere selects, jerarquia, parent, primaryLocation; el
drawer generico actual solo maneja inputs simples.
```

### Opcion B Recomendada: Components Especificos

Mantener la pantalla `OrganizationSettingsPage`, pero para esos tabs renderizar
componentes especificos:

```txt
OrganizationUnitTypesPanel
OrganizationUnitsPanel
```

El resto de catalogos sigue usando `OrganizationCatalogPanel`.

Esto evita forzar el drawer generico a soportar selects, tree view y validacion
jerarquica.

## Frontend: API Y Types

Crear:

```txt
src/features/organization/organization-units-api.ts
src/features/organization/organization-units-types.ts
src/features/organization/components/organization-units-panel.tsx
src/features/organization/components/organization-unit-types-panel.tsx
```

O integrarlo en archivos existentes si el equipo prefiere menos archivos.

Tags RTK Query:

```txt
OrganizationUnit
OrganizationUnitType
```

Actualizar `baseApi.tagTypes`.

Tipos:

```ts
interface OrganizationUnitType {
  id: string;
  tenantId: string;
  key: string;
  name: string;
  sortOrder: number;
  status: string;
}

interface OrganizationUnit {
  id: string;
  tenantId: string;
  parentOrganizationUnitId?: string | null;
  typeId: string;
  primaryLocationId?: string | null;
  key?: string | null;
  name: string;
  legalName?: string | null;
  code?: string | null;
  status: string;
}
```

Para UX, conviene que el backend pueda devolver relaciones ligeras:

```txt
type: { id, key, name }
parent: { id, name } | null
primaryLocation: { id, name, city, country } | null
```

Si no se hace en v1, el frontend puede resolverlo con listas separadas.

## Frontend: Validaciones

Validar en frontend para UX, pero no confiar solo en eso:

```txt
OrganizationUnitType:
  key required
  key formato slug/snake_case
  name required

OrganizationUnit:
  typeId required
  name required
  parent != self en edit
  primaryLocationId opcional
```

Selects:

```txt
typeId:
  solo active OrganizationUnitTypes.

parentOrganizationUnitId:
  active OrganizationUnits.
  excluir current unit y descendientes si el backend expone esa info.

primaryLocationId:
  active Locations.
```

Para v1, si no se calcula descendientes en frontend:

```txt
excluir self en UI;
backend previene ciclos reales.
```

## Employees Frontend

Hoy la pantalla employees es principalmente listado. Cuando exista formulario de
job assignments:

```txt
1. agregar select OrganizationUnit.
2. mantener select Location.
3. permitir filtrar employees por organizationUnitId.
4. mostrar OrganizationUnit en detalles/listado si el backend lo devuelve.
```

Actualizar tipos:

```txt
EmployeeJobAssignment.organizationUnitId?: string | null
```

Actualizar `employees-api.ts` cuando el backend acepte filtro:

```txt
organizationUnitId
```

## Auditoria

Agregar eventos:

```txt
organization_unit_type.created
organization_unit_type.updated
organization_unit_type.archived
organization_unit_type.reactivated

organization_unit.created
organization_unit.updated
organization_unit.archived
organization_unit.reactivated
employee.job_assignment.organization_unit_set
```

Si el modulo organization actualmente no audita cambios, se puede dejar como
fase posterior, pero el plan debe reservar esos eventos.

## Seed / Provisionamiento

Agregar defaults por tenant, no core runtime:

```txt
OrganizationUnitType:
  branch
  office
  subsidiary
  business_unit
```

No crear OrganizationUnit automaticamente salvo que el flujo de onboarding lo
necesite.

Si se crea una unidad inicial:

```txt
name = tenant.name
type = business_unit o company
primaryLocationId = null
```

Pero recomendacion v1:

```txt
crear tipos iniciales, no unidades iniciales obligatorias.
```

## Testing Backend

### Unit Tests

Agregar tests para use cases:

```txt
CreateOrganizationUnitTypeUseCase
UpdateOrganizationUnitTypeUseCase
ArchiveOrganizationUnitTypeUseCase
CreateOrganizationUnitUseCase
UpdateOrganizationUnitUseCase
ArchiveOrganizationUnitUseCase
ReactivateOrganizationUnitUseCase
```

Casos:

```txt
1. crea type tenant-scoped.
2. rechaza key duplicada.
3. rechaza archivar type usado por units activas.
4. crea unit con type valido.
5. crea unit sin primaryLocationId.
6. crea unit con primaryLocationId del mismo tenant.
7. rechaza primaryLocationId de otro tenant.
8. rechaza parent de otro tenant.
9. rechaza parent self.
10. rechaza ciclo parent -> child -> parent.
11. bloquea archive con children activos.
12. bloquea archive con job assignments actuales.
```

### Employee Tests

Actualizar:

```txt
AddEmployeeJobAssignmentUseCase
PrismaEmployeesRepository list filters
Employee DTO validation if tests exist
```

Casos:

```txt
1. job assignment guarda organizationUnitId.
2. GET /employees filtra por organizationUnitId.
3. direct reports mantiene filtro organizationUnitId.
4. organizationUnitId invalido o de otro tenant se rechaza.
```

### E2E

Agregar e2e cuando exista infraestructura:

```txt
1. tenant A no puede leer/update unit de tenant B.
2. create/update/list/archive OrganizationUnit.
3. create employee job assignment con org unit.
4. list employees por organizationUnitId.
```

## Testing Frontend

### Unit Tests

Agregar:

```txt
organization-units utils tests
organization-units API tag/path tests si hay patron
form validation tests
```

### Component Tests

Casos:

```txt
1. muestra tabs Organization units y Organization unit types.
2. crea type con key/name.
3. crea unit con type required.
4. permite no seleccionar primaryLocation.
5. permite seleccionar Location existente.
6. excluye unit actual del parent selector.
7. muestra error cuando backend rechaza ciclo/duplicado.
8. archive/reactivate muestra confirm dialog.
```

## Riesgos Y Mitigaciones

### Riesgo: Confundir Location Con OrganizationUnit

Mitigacion:

```txt
UI copy claro:
Location = physical work site.
OrganizationUnit = company hierarchy.
```

### Riesgo: Ciclos En Jerarquia

Mitigacion:

```txt
validacion backend obligatoria;
tests unitarios;
no confiar en frontend.
```

### Riesgo: Archivar Unidades En Uso

Mitigacion:

```txt
bloquear archive con children activos o job assignments actuales;
mostrar conteos en error si se implementa.
```

### Riesgo: Hacer organizationUnitId Obligatorio Muy Pronto

Mitigacion:

```txt
campo nullable en primera migracion;
obligatoriedad solo para nuevos assignments cuando UI este lista;
backfill posterior si se decide.
```

### Riesgo: Repositorio Generico Demasiado Grande

Mitigacion:

```txt
crear repositorio especifico para OrganizationUnit dentro de OrganizationModule.
```

### Riesgo: Creer Que Ya Hay Seguridad Por Unidad

Mitigacion:

```txt
documentar que esta fase modela estructura, no limita acceso.
MembershipAccessScope viene despues.
```

## Fases De Implementacion

### Fase 0: Preparacion

```txt
1. Confirmar decision de nombres:
   OrganizationUnitType
   OrganizationUnit
   primaryLocationId

2. Confirmar endpoints:
   /organization-unit-types
   /organization-units

3. Confirmar que se reutilizan permisos:
   organization.read
   organization.manage
```

DoD:

```txt
Plan aprobado y migracion definida.
```

### Fase 1: Base De Datos

```txt
1. Agregar OrganizationUnitType al schema.prisma.
2. Agregar OrganizationUnit al schema.prisma.
3. Agregar relaciones en Tenant y Location.
4. Agregar organizationUnitId a EmployeeJobAssignment.
5. Agregar indices.
6. Crear migracion Prisma.
7. Ejecutar db:generate.
```

DoD:

```txt
Prisma Client genera correctamente.
Migrations aplican en base local.
No se rompe schema actual.
```

### Fase 2: Backend OrganizationUnitType

```txt
1. Crear entity/port/repository especifico.
2. Crear DTOs.
3. Crear use cases CRUD/archive/reactivate.
4. Crear controller.
5. Registrar providers en OrganizationModule.
6. Agregar unit tests.
```

DoD:

```txt
CRUD de OrganizationUnitType funciona tenant-scoped.
No se puede archivar type con units activas.
```

### Fase 3: Backend OrganizationUnit

```txt
1. Crear use cases de units.
2. Validar typeId tenant/status.
3. Validar parent tenant/status.
4. Validar primaryLocation tenant/status.
5. Implementar prevencion de ciclos.
6. Implementar archive/reactivate con reglas.
7. Agregar unit tests.
```

DoD:

```txt
CRUD de OrganizationUnit funciona.
No hay ciclos.
No se archivan unidades en uso.
Tenant isolation cubierto.
```

### Fase 4: Employees Integration

```txt
1. Actualizar EmployeeJobAssignment entity/DTO/input.
2. Actualizar repository addJobAssignment.
3. Actualizar list filters con organizationUnitId.
4. Actualizar listDirectReportsByManagerUserId.
5. Actualizar controller query params.
6. Validar organizationUnitId al crear assignment.
7. Agregar tests.
```

DoD:

```txt
Se puede asignar un empleado a OrganizationUnit.
Se puede filtrar empleados por OrganizationUnit.
Location sigue funcionando igual.
```

### Fase 5: Frontend Organization Settings

```txt
1. Agregar RTK endpoints de OrganizationUnitType.
2. Agregar RTK endpoints de OrganizationUnit.
3. Agregar tagTypes.
4. Agregar panels especificos.
5. Agregar selects de type, parent y primaryLocation.
6. Mantener Location tab separado.
7. Agregar tests basicos.
```

DoD:

```txt
Owner/admin puede gestionar tipos y unidades desde settings.
Puede crear unit sin Location.
Puede vincular Location existente como primaryLocation.
```

### Fase 6: Employees UI

```txt
1. Agregar organizationUnitId a tipos frontend de job assignment.
2. Agregar filtros UI si existe pantalla apropiada.
3. Mostrar organization unit en employees list/detail cuando backend lo exponga.
4. Mantener location como campo independiente.
```

DoD:

```txt
Employees puede mostrar o filtrar por OrganizationUnit sin romper filtros
existentes por department/location.
```

### Fase 7: Hardening

```txt
1. Revisar errores de duplicados Prisma y mensajes API.
2. Revisar performance de list tree.
3. Agregar e2e tenant isolation.
4. Documentar que MembershipAccessScope es siguiente fase.
```

DoD:

```txt
Modulo listo para ser usado como base de scopes internos.
```

## Preparacion Para MembershipAccessScope

Esta implementacion debe dejar listo:

```txt
1. OrganizationUnit.id estable.
2. EmployeeJobAssignment.organizationUnitId disponible.
3. Listado de employees filtrable por organizationUnitId.
4. TenantContext todavia sin scopes.
5. EmployeeVisibilityService todavia basado en self/team/all.
```

El siguiente documento debe agregar:

```txt
MembershipAccessScope
scope-aware TenantContext
scope-aware EmployeeVisibilityService
scope-aware employees repository filters
UI para asignar scopes a tenant users
```

No adelantar eso en esta fase para evitar una falsa sensacion de seguridad.

## Estado Implementado 2026-05-18

La fase base de `OrganizationUnit` quedo implementada sin introducir todavia
seguridad por scope:

```txt
DB:
  OrganizationUnitType agregado.
  OrganizationUnit agregado.
  Tenant.organizationUnitTypes agregado.
  Tenant.organizationUnits agregado.
  Location.organizationUnits agregado para primaryLocationId.
  EmployeeJobAssignment.organizationUnitId agregado como nullable.
  Migracion 20260518133000_organization_units aplicada en DB local.

Decisiones de schema:
  OrganizationUnitType mantiene unique tenantId + key y tenantId + name.
  OrganizationUnit mantiene unique tenantId + name.
  OrganizationUnit.key y OrganizationUnit.code son nullable sin unique DB en v1.
  Duplicados de key/code con valor se validan en backend.
```

```txt
Seed:
  packages/database/src/organization-unit-type-catalog.ts agregado.
  Seed local crea tipos iniciales por tenant:
    branch
    office
    subsidiary
    business_unit
  No se crean OrganizationUnits automaticamente.
```

```txt
Backend:
  Subdominio especifico dentro de OrganizationModule.
  Endpoints:
    /organization-unit-types
    /organization-units
  Permisos reutilizados:
    organization.read
    organization.manage
  Repositorio especifico:
    PrismaOrganizationUnitsRepository
  Use cases especificos para:
    list/get/create/update/archive/reactivate types
    list/get/create/update/archive/reactivate units
  Validaciones implementadas:
    tenant isolation en queries
    type ACTIVE requerido
    parent ACTIVE requerido
    primaryLocation ACTIVE y same-tenant requerida si se envia
    parent self rechazado
    ciclos rechazados
    name duplicado rechazado
    key/code duplicado con valor rechazado
    archive de type bloqueado si hay units ACTIVE
    archive de unit bloqueado si hay children ACTIVE
    archive de unit bloqueado si hay current EmployeeJobAssignment
```

```txt
Employees integration:
  AddEmployeeJobAssignmentDto.organizationUnitId agregado.
  AddEmployeeJobAssignmentInput.organizationUnitId agregado.
  EmployeeJobAssignmentEntity.organizationUnitId agregado.
  EmployeeListFilters.organizationUnitId agregado.
  GET /employees acepta organizationUnitId.
  GET /employees/export.csv acepta organizationUnitId.
  PrismaEmployeesRepository filtra por current job assignment organizationUnitId.
  addJobAssignment guarda organizationUnitId.
  AddEmployeeJobAssignmentUseCase valida que organizationUnitId exista,
  pertenezca al tenant y este ACTIVE.
```

```txt
Frontend:
  Organization settings mantiene Locations como catalogo separado.
  Agregados tabs:
    Organization unit types
    Organization units
  Agregados archivos:
    organization-units-types.ts
    organization-units-api.ts
    organization-unit-types-panel.tsx
    organization-units-panel.tsx
  OrganizationUnit UI permite:
    crear/editar/archive/reactivate types
    crear/editar/archive/reactivate units
    seleccionar type activo
    seleccionar parent activo
    seleccionar primary location activa opcional
  Employees list muestra organizationUnit cuando existe.
```

Validacion ejecutada:

```txt
corepack pnpm --filter @hr-app/database db:generate
corepack pnpm --filter @hr-app/database db:migrate
corepack pnpm --filter @hr-app/database db:seed
corepack pnpm --filter @hr-app/database typecheck
corepack pnpm --filter @hr-app/api typecheck
corepack pnpm --filter @hr-app/api lint
corepack pnpm --filter @hr-app/api test
corepack pnpm --filter @hr-app/api test:e2e
corepack pnpm --filter @hr-app/web typecheck
corepack pnpm --filter @hr-app/web lint
corepack pnpm --filter @hr-app/web test
```

Siguiente fase:

```txt
MembershipAccessScope:
  AccessScopeType
  MembershipAccessScope
  TenantContext.membershipId/accessScopes
  Access settings UI para scopes
  Employee read/manage scope enforcement
```
