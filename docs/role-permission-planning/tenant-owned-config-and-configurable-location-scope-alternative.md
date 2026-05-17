# Tenant-Owned Config And Configurable Location Scope Alternative

Fecha: 2026-05-17

## Objetivo

Analizar una alternativa mas simple al patron `CORE -> TENANT -> BRANCH`
descrito en:

```txt
docs/role-permission-analisis/core-role-availability-and-future-scope-analysis.md
docs/role-permission-planning/default-template-and-scoped-override-architecture.md
```

La nueva idea es evitar registros core/globales para roles y configuraciones
operativas. En vez de eso, cada tenant tendria sus propios registros desde el
inicio:

```txt
tenantId siempre presente
locationId opcional para defaults del tenant
locationId presente para configuracion especifica de una sucursal/oficina/unidad
```

La resolucion efectiva seria:

```txt
tenantId + locationId > tenantId
```

No existiria un fallback real a registros globales con `tenantId = null` y
`locationId = null`.

## Resumen Ejecutivo

La idea es pertinente y puede reducir bastante la complejidad.

La recomendacion de esta alternativa seria:

```txt
1. No usar CORE como registros efectivos compartidos.
2. Usar templates de producto solo como datos de provisionamiento, no como
   filas consultadas en runtime.
3. Crear roles y configuraciones iniciales por tenant mediante seed, comando o
   flujo de aprobacion de compania.
4. Mantener `tenantId` obligatorio en las tablas configurables.
5. Usar `locationId` nullable como default del tenant, y no como core global.
6. Resolver configuracion efectiva por prioridad:
   tenant + location -> tenant default.
7. Agregar desde ahora una base minima para locations/branches/offices, pero
   no mezclar todavia eso con scopes avanzados de seguridad.
```

Esto acepta repetir registros en la base de datos. La duplicacion es razonable
si compra simplicidad operacional, queries mas faciles de entender y menos
ambiguedad en el lifecycle de configuraciones.

## Diferencia Principal Contra El Approach CORE

El approach anterior buscaba esto:

```txt
CORE default
  -> tenant override
    -> branch/location override
```

La alternativa propuesta seria:

```txt
Tenant default
  -> location override opcional
```

Y los defaults de producto vivirian fuera del runtime, por ejemplo en:

```txt
scripts
seeders
JSON/YAML internos
comandos administrativos
servicio de provisionamiento de tenant
```

Es decir, podria existir un "template" en codigo, pero no un role/config global
que el sistema tenga que resolver en cada query.

## Modelo Conceptual

En vez de:

```txt
Role
  tenantId null
  sourceType CORE
  templateKey owner
```

se tendria:

```txt
Role
  tenantId tenant-1
  locationId null
  key owner
  isSystemRole true
```

Para una configuracion especifica de location:

```txt
Role o ConfigurableRecord
  tenantId tenant-1
  locationId location-1
  key hr_admin
```

La regla importante:

```txt
tenantId nunca es null para configuraciones de tenant.
locationId null significa "default del tenant".
locationId con valor significa "override para esa location".
```

Esto elimina el caso ambiguo:

```txt
tenantId null + locationId null
```

como registro efectivo de configuracion.

## Provisionamiento Inicial Sin CORE Runtime

Cuando se aprueba una solicitud de creacion de compania, hoy ya se crea el
tenant y el role `owner`.

Esta alternativa extenderia ese flujo:

```txt
CompanySignup approved
  -> create Tenant
  -> create Owner membership
  -> create tenant-owned roles iniciales
  -> create tenant-owned configuration inicial
  -> opcional: create default location inicial
```

Roles iniciales:

```txt
owner
hr_admin
hr_staff
manager
employee
finance_viewer
recruiter
```

Todos serian registros propios del tenant:

```txt
tenantId = nuevo tenant
locationId = null
isSystemRole = true o isManagedDefault = true
```

Para produccion, tambien conviene tener un comando administrativo:

```txt
corepack pnpm tenant:provision-defaults --tenant-id <uuid>
```

Opciones utiles:

```txt
--roles
--employee-config
--locations
--force-missing-only
--template basic-hr
--language es
--country BO
```

Este comando no crea CORE global. Solo copia defaults hacia un tenant concreto.

## Roles En Esta Alternativa

### Owner

`owner` seguiria siendo especial:

```txt
tenantId = tenant actual
locationId = null
isSystemRole = true
key = owner
```

Reglas:

```txt
- no editable;
- no archivable;
- no deshabilitable;
- no scoped solo a location;
- siempre tenant-wide;
- debe existir al menos una asignacion efectiva de owner por tenant.
```

### Otros Roles Iniciales

Los otros roles iniciales pueden tratarse como defaults administrados:

```txt
isSystemRole = true
tenantId = tenant actual
locationId = null
```

Pero ya no se necesita una entidad de availability separada para proteger el
CORE global. Si el tenant no quiere usar `recruiter`, hay dos opciones simples:

```txt
1. Marcarlo INACTIVE para ese tenant.
2. Archivarlo si la politica permite retirar defaults no criticos.
```

Como el role pertenece solo a ese tenant, no hay riesgo de contaminar otros
tenants.

### Customizacion

Hay dos variantes posibles:

Opcion simple:

```txt
Permitir editar roles default no criticos directamente.
```

Ventaja:

```txt
Menos entidades, menos copy-on-write, UI mas directa.
```

Riesgo:

```txt
El significado de "hr_admin" puede variar por tenant.
```

Opcion conservadora:

```txt
Mantener owner immutable.
Permitir editar metadata/permisos de defaults no criticos.
Auditar cambios.
No prometer updates automaticos de producto sobre esos roles.
```

Para esta alternativa, la opcion simple/conservadora es aceptable porque el
objetivo es precisamente que cada tenant sea dueno de sus configuraciones.

## Configuraciones Operativas

El mismo patron podria aplicar a:

```txt
Department
Location / OrganizationUnit
JobTitle
EmploymentType
WorkMode
ClientProject
EmployeeCustomFieldDefinition
LeavePolicy futura
HolidayCalendar futura
ApprovalWorkflow futura
DocumentRequirement futura
```

Regla general:

```txt
tenantId obligatorio
locationId nullable cuando la configuracion pueda variar por location
status para activar/inactivar/archivar
```

Ejemplo para `EmploymentType`:

```txt
tenantId = acme
locationId = null
name = Full Time
```

Override para una location:

```txt
tenantId = acme
locationId = santa-cruz
name = Full Time
```

La query efectiva para Santa Cruz:

```txt
1. buscar registros tenantId = acme AND locationId = santa-cruz
2. si no hay equivalente, usar tenantId = acme AND locationId IS NULL
```

Para configuraciones tipo catalogo, hay que decidir como identificar
equivalentes. Conviene agregar una llave estable:

```txt
key
```

o:

```txt
code
```

Asi el fallback no depende de `name`, que puede cambiar por idioma o
preferencia del tenant.

## Modelo De Locations / Branches / Offices

El schema actual ya tiene `Location`:

```prisma
model Location {
  id        String
  tenantId  String
  name      String
  country   String
  city      String?
  timezone  String
  status    RecordStatus
}
```

Eso sirve para ubicacion laboral, pero puede quedarse corto si queremos modelar:

```txt
Branch
Subsidiary
Office
Legal Entity
Business Unit
Remote Hub
Warehouse
Store
```

Decision aclarada:

```txt
OrganizationUnit debe representar la jerarquia configurable de la compania.
Location debe seguir representando una ubicacion fisica o sitio de trabajo.
```

La tabla `Location` actual ya tiene campos como:

```txt
tenantId
name
city
country
timezone
status
```

Ese modelo encaja mejor con "donde esta o donde trabaja alguien" que con "como
esta organizada la compania". Por eso, para sucursales, subsidiarias, unidades
de negocio, oficinas administrativas o estructuras internas configurables,
conviene introducir `OrganizationUnit` en vez de sobrecargar `Location`.

### Problema De Usar Solo `Location`

`Location` puede significar varias cosas:

```txt
- direccion fisica;
- sucursal administrativa;
- subsidiaria/legal entity;
- unidad operativa;
- ciudad donde trabaja una persona.
```

Si todo se llama `Location`, el modelo puede volverse ambiguo.

### Opcion A: Extender Location

Una evolucion directa seria:

```prisma
model Location {
  id               String
  tenantId         String
  parentLocationId String?
  type             String
  name             String
  code             String?
  legalName        String?
  country          String
  state            String?
  city             String?
  addressLine1     String?
  timezone         String
  status           RecordStatus
}
```

Ventajas:

```txt
- menor cambio sobre el schema actual;
- conecta facil con EmployeeJobAssignment.locationId;
- suficiente para una primera version.
```

Costos:

```txt
- mezcla concepto fisico con estructura legal/organizacional;
- `type` string puede quedar poco gobernado;
- puede quedarse corto si luego hay legal entities reales.
```

### Opcion B: OrganizationUnit + Location Fisica

Modelo mas flexible:

```txt
Tenant
  OrganizationUnit
    Department
    Employees / Assignments

Location
  direccion fisica o sitio de trabajo
```

Conceptual:

```prisma
model OrganizationUnitType {
  id          String
  tenantId    String
  key         String
  name        String
  sortOrder   Int
  status      RecordStatus
}

model OrganizationUnit {
  id                       String
  tenantId                 String
  parentOrganizationUnitId String?
  typeId                   String
  primaryLocationId        String?
  key                      String?
  name                     String
  legalName                String?
  country                  String?
  state                    String?
  city                     String?
  timezone                 String?
  status                   RecordStatus
}
```

`primaryLocationId` seria opcional y apuntaria a `Location`. Sirve cuando una
unidad organizacional tiene una sede principal, pero no obliga a que toda unidad
tenga una location fisica.

Ejemplos:

```txt
OrganizationUnit: Subsidiaria Peru
  primaryLocationId: Lima Office

OrganizationUnit: Engineering
  primaryLocationId: null

OrganizationUnit: Santa Cruz Branch
  primaryLocationId: Santa Cruz Office
```

Si mas adelante se necesita soportar varias locations por unidad, o una
location compartida por varias unidades, se puede agregar una tabla puente:

```prisma
model OrganizationUnitLocation {
  organizationUnitId String
  locationId         String
  isPrimary          Boolean
}
```

Ejemplos de tipos configurables por tenant:

```txt
Branch
Office
Subsidiary
Legal Entity
Business Unit
Store
Warehouse
Remote Team
```

Ventajas:

```txt
- el owner puede definir como su compania organiza unidades;
- soporta companias con estructuras muy distintas;
- no fuerza que toda unidad tenga direccion fisica;
- permite relacion opcional con Location cuando exista una sede principal;
- permite jerarquia real con parent;
- sirve como scope futuro para configuraciones y acceso.
```

Costos:

```txt
- agrega mas tablas;
- requiere UI de administracion organizacional;
- hay que decidir como convive con Location actual.
```

### Recomendacion Sobre El Modelo

Si se quiere una base solida para muchos tipos de compania, la mejor opcion es
no cargar todo el significado sobre `Location`.

Recomendacion:

```txt
1. Mantener Location como sitio/direccion de trabajo.
2. Agregar OrganizationUnit como unidad organizacional configurable.
3. Usar OrganizationUnit como scope principal de configuraciones.
4. Permitir `primaryLocationId` opcional hacia Location.
5. Evitar duplicar direccion completa dentro de OrganizationUnit si Location ya
   contiene esos datos.
6. Crear OrganizationUnit desde una Location solo como ayuda de onboarding, no
   como obligacion del modelo.
```

Pero si se busca una entrega mas rapida, se puede empezar extendiendo
`Location` con:

```txt
type
parentLocationId
code
state
addressLine1
```

y dejar `OrganizationUnit` para una segunda fase.

## Jerarquia Recomendada

El modelo base que mencionaste:

```txt
Tenant
 └── Location / Branch / Subsidiary
      └── Department / Area
           └── Employees / Users
```

Es correcto como experiencia mental, pero conviene hacerlo configurable:

```txt
Tenant
 └── OrganizationUnit
      └── Department
           └── EmployeeJobAssignment
```

`OrganizationUnit` puede representar:

```txt
Sucursal
Oficina
Subsidiaria
Unidad de negocio
Tienda
Operacion remota
```

`Department` sigue representando areas internas:

```txt
HR
Finance
Engineering
Sales
Operations
```

El employee no deberia colgar directamente de un unico nodo fijo, sino de sus
asignaciones laborales:

```txt
EmployeeJobAssignment
  tenantId
  employeeId
  organizationUnitId?
  departmentId?
  locationId?
  jobTitleId?
  effectiveFrom
  effectiveTo
```

Esto permite cambios historicos:

```txt
Ana estuvo en Oficina Santa Cruz hasta marzo.
Luego paso a Subsidiaria Peru desde abril.
```

## Resolucion De Configuracion

Para esta alternativa, el resolver no necesita buscar CORE global.

Resolucion simple:

```txt
effectiveConfig(tenantId, locationId, key):
  1. buscar tenantId + locationId + key + ACTIVE
  2. si no existe, buscar tenantId + locationId null + key + ACTIVE
  3. si no existe, no hay configuracion
```

Para `OrganizationUnit`, el mismo patron:

```txt
tenantId + organizationUnitId > tenantId
```

Si se permite jerarquia profunda:

```txt
tenantId + current unit
tenantId + parent unit
tenantId + grandparent unit
tenantId default
```

Pero no recomiendo implementar herencia multi-nivel al principio. Para v1,
usar solo:

```txt
unidad actual > tenant
```

## Indexes Y Constraints

Para tablas configurables con scope:

```txt
tenantId
locationId nullable
key
status
```

Constraints conceptuales:

```sql
UNIQUE (tenant_id, key)
WHERE location_id IS NULL AND status <> 'ARCHIVED';

UNIQUE (tenant_id, location_id, key)
WHERE location_id IS NOT NULL AND status <> 'ARCHIVED';
```

En Prisma puede requerir indices parciales con SQL manual si se necesita
control exacto sobre `NULL`.

Indexes:

```txt
tenantId, status
tenantId, locationId, status
tenantId, locationId, key
```

Para roles:

```txt
tenantId, key
tenantId, locationId, key
tenantId, status
```

Si `Role.locationId` se agrega en el futuro, hay que revisar el unique actual:

```prisma
@@unique([tenantId, key])
```

porque bloquearia tener un role `manager` default y otro `manager` especifico
para una location.

## Impacto En Queries

Con esta alternativa, las queries son mas explicitas:

```txt
WHERE tenantId = currentTenant
AND (
  locationId = currentLocation
  OR locationId IS NULL
)
```

Luego se elige el registro mas especifico:

```txt
ORDER BY CASE WHEN locationId IS NOT NULL THEN 0 ELSE 1 END
```

O se resuelve por batch en application service para evitar duplicados.

La ventaja principal:

```txt
No hay que unir contra CORE global.
No hay que decidir si el tenant hereda o no hereda de producto.
No hay que proteger registros globales compartidos.
```

## Ventajas De Esta Alternativa

### 1. Menos Complejidad Mental

Todo lo que el tenant ve le pertenece al tenant.

```txt
No hay CORE visible.
No hay copy-on-write obligatorio.
No hay overrides contra registros globales.
```

### 2. Mejor Encaje Con Customizacion Real

Cada compania puede cambiar sus roles, nombres, job titles, work modes,
locations y futuras policies sin preguntar si esta editando un default global o
un override.

### 3. Queries Mas Simples

La mayoria de queries trabajan solo con:

```txt
tenantId
locationId opcional
status
```

### 4. Provisionamiento Controlado

Los defaults de producto se aplican cuando se crea el tenant o cuando un admin
decide ejecutar un comando de configuracion inicial.

### 5. Menor Riesgo De Romper Otros Tenants

Editar o archivar una configuracion afecta solo al tenant actual.

## Costos Y Riesgos

### Riesgo 1: Duplicacion De Datos

Cada tenant tendra sus propios roles y configuraciones iniciales.

Mitigacion:

```txt
Aceptar duplicacion como costo de simplicidad.
Usar comandos idempotentes para crear solo faltantes.
No copiar configuraciones por location hasta que haya diferencia real.
```

### Riesgo 2: Updates De Producto No Automaticos

Si el producto mejora el role `hr_admin`, no hay un CORE global que todos
hereden automaticamente.

Mitigacion:

```txt
Crear scripts de migration/backfill por tenant.
Auditar cambios.
Aplicar updates solo a tenants que no hayan customizado fuertemente.
```

### Riesgo 3: Drift Entre Tenants

El role `manager` podria significar cosas distintas por tenant.

Mitigacion:

```txt
Esto es aceptable si el producto prioriza configurabilidad.
Mantener keys estables para integraciones.
Mostrar nombres y permisos reales en UI.
```

### Riesgo 4: Location Como Scope De Seguridad Prematuro

Agregar `locationId` en configuraciones no significa que todo acceso ya este
seguro por location.

Mitigacion:

```txt
Separar configuracion por location de authorization scope.
No asumir que un usuario solo ve una location hasta implementar
MembershipAccessScope o equivalente.
```

### Riesgo 5: Jerarquia Demasiado Temprana

Si se agrega una jerarquia completa con parent, types configurables y scopes de
acceso al mismo tiempo, se puede volver demasiado grande.

Mitigacion:

```txt
Agregar primero estructura organizacional minima.
Usarla para datos y configuracion.
Dejar access scopes internos para una fase posterior.
```

## Es Pertinente Agregar Locations / Branches Desde Ya?

Si el producto apunta a HR SaaS real, si conviene agregar desde ahora una base
minima de estructura organizacional. Pero no conviene implementar todo el
modelo avanzado de permisos por sucursal en la misma fase.

Recomendacion pragmatica:

```txt
Si agregar:
  - catalogo configurable de unidades/locations;
  - tipo configurable por tenant;
  - parent opcional;
  - campos geograficos basicos;
  - relacion con EmployeeJobAssignment;
  - ability de usar location/org unit en configuraciones futuras.

No agregar todavia:
  - permissions efectivos por branch;
  - guards obligatorios por branch en todos los endpoints;
  - herencia multi-nivel compleja;
  - overrides para todas las tablas al mismo tiempo.
```

Esto da una base solida sin bloquear el avance.

## Propuesta De Fases

### Fase A: Decision De Patron

```txt
1. Decidir que no habra CORE runtime para roles/configuraciones.
2. Definir que los defaults de producto se provisionan por tenant.
3. Documentar que `tenantId` es obligatorio para configuraciones tenant-owned.
4. Documentar fallback simple:
   tenant + location > tenant.
```

### Fase B: Provisionamiento De Tenant

```txt
1. Extender aprobacion de CompanySignup para crear defaults iniciales.
2. Crear comando `tenant:provision-defaults --tenant-id`.
3. Hacerlo idempotente.
4. Mantener `owner` como rol critico no editable.
```

### Fase C: Estructura Organizacional Minima

Opcion rapida:

```txt
1. Extender Location con type, parentLocationId, code, state, address.
2. Permitir que owner/admin configure tipos iniciales.
3. Usar Location como scope futuro de configuracion.
```

Opcion mas solida:

```txt
1. Crear OrganizationUnitType tenant-owned.
2. Crear OrganizationUnit tenant-owned.
3. Mantener Location como sitio fisico.
4. Agregar organizationUnitId a EmployeeJobAssignment.
```

### Fase D: Configuraciones Por Tenant Y Location

Aplicar primero a una o dos tablas piloto:

```txt
WorkMode
EmploymentType
HolidayCalendar futura
```

No aplicar a todo el sistema de una vez.

### Fase E: Access Scopes Internos

Cuando ya haya necesidad real:

```txt
MembershipAccessScope
  membershipId
  scopeType = TENANT | ORGANIZATION_UNIT | LOCATION | DEPARTMENT
  scopeId
```

Esto responderia:

```txt
Donde puede operar este usuario?
```

Separado de:

```txt
Que permisos tiene este usuario?
```

## Comparacion Final

### CORE + Overrides

Mejor si:

```txt
- el producto quiere defaults globales versionados;
- se espera actualizar defaults para todos los tenants;
- se quiere distinguir claramente system default vs custom tenant;
- se acepta mayor complejidad en resolvers.
```

### Tenant-Owned Sin CORE Runtime

Mejor si:

```txt
- se prioriza simplicidad;
- cada tenant puede divergir libremente;
- repetir registros en DB es aceptable;
- los defaults son solo punto de partida;
- se quiere que queries usen siempre tenantId;
- se quiere agregar location/org unit sin fallback global.
```

Para el estado actual del proyecto, esta segunda opcion es muy razonable.

## Decision Recomendada Para Esta Alternativa

Si se elige este camino, la decision deberia ser:

```txt
1. Eliminar la idea de CORE runtime para roles/configuraciones tenant-owned.
2. Mantener templates de producto solo como seeds/comandos de provisionamiento.
3. Hacer que cada tenant tenga sus propios roles y configuraciones desde el
   inicio.
4. Usar `tenantId` obligatorio en configuraciones.
5. Usar `locationId` u `organizationUnitId` opcional para overrides.
6. Resolver por prioridad simple:
   tenant + scope > tenant default.
7. Agregar desde ahora una base minima configurable para branches/offices,
   preferiblemente como OrganizationUnit si se quiere maxima flexibilidad.
8. No implementar todavia seguridad por branch/location en todos los endpoints.
9. Mantener `owner` como rol especial tenant-wide, no editable y no scoped.
10. Aceptar duplicacion como tradeoff deliberado por claridad y control.
```

Esta opcion puede ser mas simple y mas natural para un SaaS configurable. La
clave es no confundir tres cosas:

```txt
Provisionamiento inicial:
  defaults copiados al tenant.

Configuracion efectiva:
  tenant + location/org unit > tenant.

Autorizacion interna:
  access scopes futuros, separados de roles y configuraciones.
```

## Open Questions

Antes de implementarlo conviene decidir:

```txt
1. El scope configurable se llamara Location o OrganizationUnit?
2. Location representara sucursal/oficina/subsidiaria o solo direccion fisica?
3. Los roles default no-owner seran editables directamente o solo clonables?
4. Se agregara `locationId` a Role desde el inicio o solo a configuraciones
   operativas?
5. Que tablas piloto usaran fallback tenant + location primero?
6. El tenant nuevo tendra una default location inicial automaticamente?
7. Los tipos de unidades seran seed inicial editable por tenant o texto libre?
```

Mi recomendacion para estas preguntas:

```txt
1. Usar OrganizationUnit para estructura configurable.
2. Mantener Location para direccion/sitio fisico.
3. Permitir editar roles default no-owner, con audit.
4. No agregar location/org unit a Role hasta que exista un caso claro.
5. Probar fallback primero en WorkMode o una policy futura.
6. Crear una OrganizationUnit default solo si el tenant lo desea o si se
   necesita para onboarding.
7. Seed inicial editable de tipos: Branch, Office, Subsidiary, Business Unit.
```

Decision actual:

```txt
La entidad para jerarquia debe ser OrganizationUnit.
Location conserva su responsabilidad actual de ubicacion fisica/sitio de
trabajo.
OrganizationUnit puede relacionarse opcionalmente con Location mediante
primaryLocationId.
Al crear una OrganizationUnit, el owner podria seleccionar una Location
existente o crear una nueva como sede principal, pero no deberia ser obligatorio.
```
