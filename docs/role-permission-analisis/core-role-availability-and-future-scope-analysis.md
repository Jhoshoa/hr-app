# Core Role Availability And Future Scope Analysis

Fecha: 2026-05-15

## Objetivo

Analizar si conviene mantener roles core para todos los tenants, como deberian
comportarse frente a roles custom, si deberian poder deshabilitarse, y como
esta decision afecta una evolucion futura hacia `Branch`, `Sucursal`,
`Employer`, `Department`, `Location` y access scopes internos.

Este documento no propone cambios de codigo inmediatos. Su objetivo es dejar
una recomendacion tecnica coherente con el estado actual del proyecto y con los
documentos existentes de RBAC tenant-scoped.

## Resumen Ejecutivo

Si conviene tener core roles.

Son utiles porque cada tenant empieza con una base conocida:

```txt
owner
hr_admin
hr_staff
manager
employee
finance_viewer
recruiter
```

Pero no conviene que sean roles globales compartidos entre tenants. La decision
actual de materializarlos por tenant es correcta:

```txt
Tenant A
  owner
  hr_admin
  employee

Tenant B
  owner
  hr_admin
  employee
```

Esto permite que cada tenant tenga sus propias asignaciones, auditoria,
conteos, lifecycle y futuras reglas de disponibilidad sin contaminar a otros
tenants.

La recomendacion principal es:

```txt
Core roles tenant-scoped, immutable, clonables y ocultables para nuevas
asignaciones mediante una preferencia separada, sin mutar el role core.
```

En otras palabras:

- no editar permisos ni metadata de core roles;
- no borrar core roles;
- permitir clonar core roles a custom roles;
- permitir ocultar ciertos core roles para que ya no aparezcan como asignables,
  pero sin cambiar el registro core;
- si un tenant necesita personalizar un core role, crear un clone custom;
- nunca permitir ocultar, deshabilitar ni reemplazar `owner`;
- custom roles si pueden editarse y archivarse.

## Estado Actual Relevante

### Modelo

El modelo `Role` ya tiene:

```prisma
tenantId     String?
key          String
name         String
description  String?
isSystemRole Boolean
status       RecordStatus
```

`tenantId` es nullable, pero los seeders actuales crean los core roles con
`tenantId` real. Por tanto, hoy los core roles son tenant-scoped.

`RecordStatus` soporta:

```txt
ACTIVE
INACTIVE
ARCHIVED
```

Importante:

Aunque `Role.status` ya permite `INACTIVE`, usar ese campo para deshabilitar un
core role no es la mejor opcion si la regla es no tocar el CORE. En ese caso,
la disponibilidad de un core role debe vivir en una entidad separada de
preferencia/override, no en el propio `Role`.

### Seed Actual

El seed crea por tenant:

```txt
owner
hr_admin
hr_staff
manager
employee
finance_viewer
recruiter
```

Todos estos roles se crean con:

```txt
isSystemRole = true
status = ACTIVE
```

Los roles creados por tenant admins desde la UI se crean como:

```txt
isSystemRole = false
status = ACTIVE
```

### Proteccion Backend Actual

La politica correcta para roles core es que no dependan solo del frontend.

La proteccion backend debe bloquear cambios sobre `isSystemRole = true` para:

```txt
PATCH /roles/:roleId
PUT /roles/:roleId/permissions
POST /roles/:roleId/archive
POST /roles/:roleId/reactivate
```

La razon es simple: la UI puede ocultar botones, pero la API debe seguir siendo
la fuente real de seguridad.

## Por Que Conviene Tener Core Roles

### 1. Buen Punto De Inicio Para Tenants Nuevos

Un tenant nuevo no deberia comenzar con una pantalla vacia de roles. En HR SaaS
hay patrones muy comunes:

```txt
Owner
HR Admin
HR Staff
Manager
Employee
Finance Viewer
Recruiter
```

Esto reduce friccion inicial y permite que el tenant admin invite usuarios sin
tener que disenar RBAC desde cero.

### 2. Ayudan A Explicar El Producto

Los core roles funcionan como ejemplos vivos de como se espera usar permisos.

Un admin puede ver:

```txt
Manager -> employees.team.read
Finance Viewer -> employees.compensation.read
Recruiter -> users.read + employees.read
```

Eso hace que el Permission Matrix sea mas entendible.

### 3. Facilitan Clonado Seguro

El flujo recomendado para customizacion es:

```txt
Clone system role -> create custom role -> adjust permissions -> assign users
```

Esto es mejor que permitir editar el role core directamente. Si un tenant
quiere un "Manager Plus", puede clonarlo sin romper la semantica base de
`manager`.

### 4. Preparan Mejor Las Futuras Jerarquias

Cuando exista branch/sucursal/location, los core roles pueden seguir siendo la
base de permisos, y el scope interno puede limitar donde aplican.

Ejemplo futuro:

```txt
Role: HR Staff
Permissions:
  employees.read
  employees.manage

MembershipAccessScope:
  scopeType = branch
  scopeId = santa-cruz
```

El rol responde "que puede hacer"; el access scope responde "donde puede
hacerlo".

Separar esas dos cosas es clave para no mezclar RBAC con jerarquia
organizacional.

## Riesgos De Los Core Roles

### Riesgo 1: Demasiados Roles Visibles

Si todos los tenants ven siete roles y solo usan dos, la UI puede sentirse
ruidosa.

Mitigacion:

```txt
Permitir ocultar core roles no usados para nuevas asignaciones mediante una
preferencia separada, sin cambiar el core role.
```

### Riesgo 2: Tenants Quieren Customizar "HR Admin"

Si permitimos editar el core role `hr_admin`, ese nombre deja de tener un
significado estable. Ademas, futuras actualizaciones del producto pueden ser
ambiguas:

```txt
Producto agrega nuevo permiso X a HR Admin.
Tenant habia modificado HR Admin.
Aplicamos el cambio o respetamos customizacion?
```

Mitigacion:

```txt
Core roles no editables.
Customizacion via clone.
```

### Riesgo 3: Deshabilitar Roles Criticos

Si se permite deshabilitar `owner`, un tenant podria quedar sin administracion
real.

Mitigacion:

```txt
owner no se puede deshabilitar, archivar ni editar.
```

### Riesgo 4: Confundir Archive Con Disable/Ocultar

Para roles custom, "archive" significa que el rol fue retirado.

Para roles core, el concepto correcto no es borrar ni archivar el template, y
tampoco deberia cambiar el status del core role si queremos mantenerlo intacto.
Es mas bien:

```txt
Hide from assignment / disable availability override
```

Es decir, el role core sigue existiendo intacto, pero una preferencia del tenant
o del role indica que no debe aparecer en selectores de usuarios o invitaciones.

Si el tenant necesita una version modificada, el flujo correcto es:

```txt
Core role -> Clone -> Custom role editable -> Assign custom role
```

No se debe convertir el core role en custom ni modificar sus permisos.

## Recomendacion De Modelo Conceptual

### Mantener Dos Familias De Roles

```txt
System/Core roles
  isSystemRole = true
  tenantId = tenant actual
  immutable
  clonable
  availability controlada por override externo

Custom roles
  isSystemRole = false
  tenantId = tenant actual
  editable
  archivables
  asignables si ACTIVE
```

### Estados Recomendados

Para custom roles:

```txt
ACTIVE    -> visible/asignable/editable
ARCHIVED  -> no asignable, historico, no editable salvo reactivate
```

Para core roles:

```txt
ACTIVE    -> estado normal del core role
INACTIVE  -> no recomendado para core roles si queremos no tocar el CORE
ARCHIVED  -> no recomendado para core roles
```

Por eso conviene reservar semantica:

```txt
Archive = retirar custom role
Hide/Disable availability = ocultar core role mediante override externo
```

Aunque el schema ya tenga `status`, la UI y los use cases no deberian mutar el
status de un core role para ocultarlo. Si queremos que el CORE permanezca
intacto, necesitamos una entidad separada.

Modelo recomendado:

```prisma
model TenantRoleAvailability {
  id                String   @id @default(uuid()) @db.Uuid
  tenantId          String   @db.Uuid
  roleId            String   @db.Uuid
  isAssignable      Boolean  @default(true)
  replacementRoleId String?  @db.Uuid
  disabledByUserId  String?  @db.Uuid
  disabledAt        DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([tenantId, roleId])
  @@index([tenantId, isAssignable])
  @@index([replacementRoleId])
}
```

Alternativa por key/template, util si en el futuro existen templates globales:

```prisma
model TenantRoleTemplatePreference {
  id                String   @id @default(uuid()) @db.Uuid
  tenantId          String   @db.Uuid
  templateKey       String
  isAssignable      Boolean  @default(true)
  replacementRoleId String?  @db.Uuid
  disabledByUserId  String?  @db.Uuid
  disabledAt        DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([tenantId, templateKey])
}
```

Endpoints conceptuales:

```txt
POST /roles/:roleId/clone
POST /roles/:roleId/hide-from-assignment
POST /roles/:roleId/show-in-assignment
```

O un endpoint combinado para customizar:

```txt
POST /roles/:roleId/customize
  -> crea custom role copiando metadata/permisos del core
  -> crea/actualiza TenantRoleAvailability con isAssignable=false
  -> replacementRoleId = nuevo custom role
  -> no modifica el core role
```

## Reglas Recomendadas

### Core Roles

```txt
owner:
  - no editable
  - no deshabilitable
  - no archivable
  - no removable
  - siempre debe existir por tenant
  - debe mantener permisos administrativos criticos

otros system roles:
  - no editables
  - no archivable como custom roles
  - no se debe mutar su status para ocultarlos
  - si pueden ocultarse para nuevas asignaciones mediante availability override
  - si pueden mostrarse otra vez removiendo o actualizando el override
  - si pueden clonarse a custom roles
  - si se customizan, el clone debe ser el role editable/asignable
```

### Custom Roles

```txt
custom roles:
  - editables
  - permission matrix editable
  - archivables si no estan asignados a usuarios activos
  - reactivables si fueron archivados
  - no pueden romper reglas de ultimo owner/admin critico
```

### Asignacion A Usuarios E Invitaciones

Los selectores de roles para usuarios e invitaciones deben usar solo:

```txt
status = ACTIVE
tenantId = current tenant
```

Y deben excluir:

```txt
INACTIVE
ARCHIVED
roles de otro tenant
```

Backend debe validar lo mismo con `findActiveIdsByTenant`.

## Como Ayuda Para Branch/Sucursal/Employer

Mantener core roles tenant-scoped y separados de scopes internos ayuda porque
evita crear roles duplicados por cada sucursal.

No recomendado:

```txt
hr_admin_santa_cruz
hr_admin_cochabamba
hr_admin_la_paz
manager_santa_cruz
manager_cochabamba
```

Eso mezcla permisos con alcance organizacional y escala mal.

Recomendado:

```txt
Role:
  HR Admin

MembershipAccessScope:
  scopeType = branch
  scopeId = santa-cruz
```

O:

```txt
TenantMembership
  roles:
    HR Admin
  scopes:
    branch:santa-cruz
    branch:cochabamba
```

Asi el sistema mantiene dos preguntas separadas:

```txt
Que puede hacer?  -> Role + Permission
Donde puede hacerlo? -> MembershipAccessScope
```

Esto tambien permite que un mismo usuario tenga varios roles con alcance comun
o, en una version mas avanzada, scopes por rol.

### V1 Futura Simple

Una primera version de scopes internos podria ser por membership:

```txt
TenantMembership
  roles: [hr_staff, manager]
  accessScope:
    tenant | branch | department | location
  scopeIds: [...]
```

Esto es mas simple, pero todos los roles del usuario comparten el mismo scope.

### V2 Futura Mas Granular

Si se necesita mas precision:

```txt
MembershipRoleScope
  membershipId
  roleId
  scopeType
  scopeId
```

Ejemplo:

```txt
ana@company.com
  HR Staff     -> branch Santa Cruz
  Manager      -> department Sales
  Finance View -> tenant
```

No conviene implementar esto ahora, pero el modelo actual de roles core no lo
bloquea.

## Recomendacion Para La UI

### Roles Tab

Tabla:

```txt
Role
Type
Availability
Permissions
Users
Status
Actions
```

Para core roles:

```txt
Badge: System
Actions:
  Clone
  Customize, excepto owner
  Hide / Show in assignment, excepto owner
  View permissions
No mostrar Edit permissions
No mostrar Archive
```

Para custom roles:

```txt
Badge: Custom
Actions:
  Edit
  Archive / Reactivate
  Clone opcional
```

### Confirmaciones

Customize core role:

```txt
This will create a custom copy of the system role. The original system role
will remain unchanged.
```

Hide core role:

```txt
This system role will no longer be available for new user assignments or
invitations. The original system role will remain unchanged.
```

Archive custom role:

```txt
This custom role will be removed from active use. It cannot be assigned while
archived.
```

### Existing Assignments

Hay dos opciones para ocultar un core role que ya esta asignado:

Opcion conservadora recomendada:

```txt
No permitir ocultarlo si esta asignado a usuarios activos.
Mostrar cuantos usuarios lo tienen y pedir reasignacion primero.
```

Opcion mas flexible:

```txt
Permitir ocultarlo para nuevas asignaciones, pero mantenerlo efectivo para
usuarios que ya lo tienen.
```

Para este proyecto recomiendo la opcion conservadora inicialmente. Es mas
predecible, mas facil de testear y evita estados raros en permisos efectivos.

## Recomendacion Para Backend

Cuando se implemente esta mejora, separar politicas:

```txt
assertRoleMetadataEditable(role)
assertRolePermissionsEditable(role)
assertRoleArchivable(role)
assertRoleAvailabilityToggleAllowed(role)
```

No usar una sola funcion `assertRoleIsEditable` para todos los casos si se
empieza a permitir ocultar system roles mediante override pero se sigue
prohibiendo editar system roles.

Reglas:

```txt
metadata editable:
  custom ACTIVE only

permissions editable:
  custom ACTIVE only

archive:
  custom ACTIVE only
  not assigned to active users

reactivate archived:
  custom ARCHIVED only

hide availability:
  system role only
  key != owner
  not assigned to active users, recomendado para v1
  create/update TenantRoleAvailability, not Role.status

show availability:
  system role only
  key != owner
  remove/update TenantRoleAvailability, not Role.status

customize system role:
  system role only
  key != owner
  create custom role with copied permissions
  create/update TenantRoleAvailability with replacementRoleId
  do not mutate core Role
```

Auditoria:

```txt
role.hidden_from_assignment
role.shown_in_assignment
role.customized
role.archived
role.reactivated
role.cloned
```

## Relacion Con Updates De Producto

Tener core roles tenant-scoped abre una pregunta futura:

```txt
Si el producto agrega un permiso nuevo a hr_admin, se debe aplicar a todos los
tenants?
```

Recomendacion:

Para ahora:

```txt
Seed/backfill idempotente mantiene templates base.
Core roles no editables, por tanto se pueden actualizar con migraciones
controladas.
```

Mas adelante, si se necesita mas control:

```txt
RoleTemplateVersion
Role.templateKey
Role.templateVersion
RoleTemplateChangeLog
```

Pero no hace falta ahora.

## Decision Recomendada

Mantener core roles, pero evolucionar la politica asi:

```txt
1. Core roles son tenant-scoped.
2. Core roles son read-only.
3. Core roles son clonables.
4. Core roles no se archivan.
5. Core roles no-owner pueden ocultarse para asignacion mediante override
   externo, sin mutar `Role`.
6. Customizar un core role crea un clone custom y opcionalmente lo registra como
   replacementRoleId.
7. owner nunca se oculta, deshabilita ni reemplaza.
8. Custom roles se editan y archivan.
9. Selectores usan roles ACTIVE y respetan availability overrides.
10. Futuros branch/employer scopes se agregan fuera del role, no duplicando
   roles por sucursal.
```

Esta decision da una buena experiencia inicial a todos los tenants, mantiene
seguridad en backend, evita drift peligroso en roles base, y deja el camino
abierto para `MembershipAccessScope` cuando el producto necesite limitar acceso
por branch, employer, department o location.

## Implementacion Recomendada En Una Fase Posterior

Cuando se decida implementar:

```txt
Fase A:
  - agregar TenantRoleAvailability o TenantRoleTemplatePreference;
  - agregar endpoints hide/show role availability;
  - backend permite hide/show solo para system roles no-owner;
  - bloquear hide si el role esta asignado a usuarios activos;
  - tests unitarios y e2e.

Fase B:
  - agregar endpoint o flujo frontend de Customize/Clone;
  - Customize crea custom role y no muta el core role;
  - guardar replacementRoleId si se quiere mostrar relacion core -> custom.

Fase C:
  - UI muestra Hide/Show o Customize en system roles no-owner;
  - UI mantiene Archive/Reactivate solo para custom roles;
  - selectores de Users/Invitations usan ACTIVE + availability override;
  - confirm dialog especifico.

Fase D:
  - revisar seed/backfill para asegurar core roles por tenant;
  - agregar tests de tenant nuevo con templates;
  - documentar estrategia de updates de core role templates.
```

No conviene meter branch/employer scope en esta misma fase. Primero cerrar
availability/lifecycle de roles. Luego agregar scopes internos con una base de
RBAC ya estable.
