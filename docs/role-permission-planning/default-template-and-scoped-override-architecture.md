# Default Template And Scoped Override Architecture

Fecha: 2026-05-15

## Objetivo

Definir el mejor approach para evolucionar roles core/custom y preparar un
patron reutilizable para futuras configuraciones con defaults y overrides por
tenant, branch/sucursal, employer, department o location.

Este documento complementa:

```txt
docs/role-permission-plaanning/tenant-access-rbac-implementation-plan.md
docs/role-permission-analisis/company-branch-employer-hierarchy-and-access-scope-analysis.md
docs/role-permission-analisis/core-role-availability-and-future-scope-analysis.md
```

No reemplaza las fases 1-5 ya implementadas o planeadas. Principalmente
refina las fases 6 y 7: hardening, extensibilidad, scopes internos y
configuraciones heredadas.

## Resumen Ejecutivo

La mejor opcion para este proyecto es usar un patron comun de:

```txt
CORE default/template
  -> TENANT custom override
    -> BRANCH/EMPLOYER/LOCATION custom override futuro
```

con resolucion por prioridad:

```txt
scope mas especifico > tenant override > core/default
```

Para evitar crear muchas tablas de override por cada feature, la recomendacion
es agregar columnas comunes directamente en las tablas configurables, empezando
por `Role` y reutilizando la misma convencion en futuras configuraciones.

Ejemplo conceptual:

```txt
Role
LeavePolicy
HolidayCalendar
DocumentRequirement
ApprovalWorkflow
```

Todas podrian compartir metadata similar:

```txt
templateKey
sourceType
scopeType
scopeId
tenantId
```

Esto permite una estrategia consistente sin multiplicar tablas como:

```txt
RoleOverride
LeavePolicyOverride
HolidayCalendarOverride
DocumentRequirementOverride
...
```

La regla clave es copy-on-write:

```txt
Si el usuario edita un CORE, no se actualiza el CORE.
Se crea automaticamente un CUSTOM con el mismo templateKey y el scope actual.
Desde ese momento, la resolucion efectiva prioriza el CUSTOM.
```

## Principio Arquitectonico

Separar tres preguntas:

```txt
1. Que default representa?
   -> templateKey

2. De donde viene?
   -> sourceType = CORE | CUSTOM

3. Donde aplica?
   -> scopeType + scopeId + tenantId
```

Para roles:

```txt
Que puede hacer?
  Role + Permission

Donde aplica ese role/configuracion?
  scopeType/scopeId
```

Para configuraciones:

```txt
Que regla aplica?
  LeavePolicy / HolidayCalendar / ApprovalWorkflow

Donde aplica?
  tenant, branch, employer, department, location
```

## Opcion Recomendada: Columnas Comunes En Tablas Configurables

### Concepto

Agregar metadata de source/template/scope directamente en la tabla que contiene
la configuracion.

Para `Role`, la forma conceptual seria:

```prisma
enum ConfigSourceType {
  CORE
  CUSTOM
}

enum ConfigScopeType {
  GLOBAL
  TENANT
  BRANCH
  EMPLOYER
  DEPARTMENT
  LOCATION
}

model Role {
  id           String
  tenantId     String?
  key          String
  name         String
  description  String?
  isSystemRole Boolean
  status       RecordStatus

  templateKey  String?
  sourceType   ConfigSourceType
  scopeType    ConfigScopeType
  scopeId      String?
}
```

El detalle exacto puede ajustarse cuando existan entidades reales de Branch o
Employer. La idea importante es el patron, no los nombres finales.

### Como Funcionaria En Roles

Core/default:

```txt
templateKey = manager
sourceType = CORE
scopeType = GLOBAL o TENANT_BASE, segun decision final
tenantId = null o tenantId si mantenemos core materializado por tenant
scopeId = null
```

Tenant custom:

```txt
templateKey = manager
sourceType = CUSTOM
scopeType = TENANT
tenantId = tenant-1
scopeId = null
```

Branch custom futuro:

```txt
templateKey = manager
sourceType = CUSTOM
scopeType = BRANCH
tenantId = tenant-1
scopeId = branch-1
```

Resolucion:

```txt
1. Buscar CUSTOM BRANCH para tenantId + branchId + templateKey.
2. Si no existe, buscar CUSTOM TENANT para tenantId + templateKey.
3. Si no existe, usar CORE para templateKey.
```

### Copy-On-Write

Cuando un admin edita un core role:

```txt
1. Backend detecta sourceType=CORE o isSystemRole=true.
2. No hace UPDATE del core.
3. Crea Role CUSTOM con:
   - templateKey = core.templateKey o core.key
   - sourceType = CUSTOM
   - scopeType = TENANT
   - tenantId = current tenant
   - permisos copiados del core
4. Aplica los cambios del formulario al custom.
5. La lista efectiva de roles muestra el custom en lugar del core para ese
   templateKey/scope.
```

Para branch futuro:

```txt
Si el usuario esta editando en contexto branch,
crear CUSTOM con scopeType=BRANCH y scopeId=branchId.
```

### Ventajas

- Evita explosion de tablas de override.
- Reutiliza la misma convencion en muchas features.
- Hace que la UI sea consistente: "editar default" crea override.
- Permite fallback claro.
- Permite queries directas sin joins adicionales de override por cada feature.
- Encaja con la preferencia de mantener el modelo manejable.
- Prepara branch/sucursal sin implementarlo ahora.

### Costos

- Cada tabla configurable necesita columnas similares.
- Cada feature necesita un resolver efectivo.
- Los unique indexes deben disenarse con cuidado.
- `scopeId` generico pierde foreign key directa si puede apuntar a varios tipos
  de entidad.
- Hay que evitar duplicados para el mismo template/scope.

## Unique Indexes Recomendados

Para roles, la intencion seria no permitir dos overrides del mismo template en
el mismo scope.

Conceptualmente:

```txt
unique tenant custom:
  tenantId + sourceType + scopeType + templateKey

unique scoped custom:
  tenantId + sourceType + scopeType + scopeId + templateKey

unique custom free role:
  tenantId + key
```

En Prisma/Postgres hay que cuidar los `NULL`. Si `scopeId` es nullable,
probablemente convenga normalizar:

```txt
scopeType = TENANT
scopeId = null
```

y usar constraints parciales en SQL si Prisma no expresa bien el caso.

Ejemplos conceptuales:

```sql
UNIQUE (tenant_id, scope_type, template_key)
WHERE source_type = 'CUSTOM' AND scope_type = 'TENANT';

UNIQUE (tenant_id, scope_type, scope_id, template_key)
WHERE source_type = 'CUSTOM' AND scope_type <> 'TENANT';
```

Para v1 sin branch, puede ser suficiente:

```txt
unique(tenantId, templateKey, sourceType, scopeType)
```

pero antes de branch hay que revisar constraints.

## Aplicacion A Otras Configuraciones

El mismo approach puede servir para:

```txt
LeavePolicy
HolidayCalendar
DocumentRequirement
ApprovalWorkflow
NotificationRule
OnboardingTemplate
CustomFieldDefinition
```

Ejemplo Holiday Calendar:

```txt
CORE:
  templateKey = bolivia_default
  sourceType = CORE
  scopeType = GLOBAL

TENANT CUSTOM:
  templateKey = bolivia_default
  sourceType = CUSTOM
  scopeType = TENANT
  tenantId = acme

BRANCH CUSTOM:
  templateKey = bolivia_default
  sourceType = CUSTOM
  scopeType = BRANCH
  tenantId = acme
  scopeId = santa-cruz
```

Resolucion:

```txt
calendar = branch override ?? tenant override ?? core default
```

Esto evita duplicar registros si todas las sucursales usan la misma regla. Solo
se crea override cuando realmente hay una diferencia.

## Alternativas Consideradas

### Alternativa A: Tabla Override Por Feature

Ejemplo:

```txt
RoleOverride
LeavePolicyOverride
HolidayCalendarOverride
ApprovalWorkflowOverride
```

Ventajas:

- FKs mas estrictas por feature.
- Cada override puede tener metadata especifica.
- Queries pueden ser muy explicitas.

Desventajas:

- Muchas tablas.
- Mas boilerplate.
- Mas repositories/use cases.
- Mas migraciones.
- Mas dificil mantener una convencion consistente.

Opinion:

No es la mejor opcion para este proyecto si sabemos que muchas configuraciones
van a compartir el mismo patron.

### Alternativa B: Tabla Generica De Overrides

Ejemplo:

```txt
ConfigOverride
  entityType
  entityId
  templateKey
  scopeType
  scopeId
  effectiveEntityId
```

Ventajas:

- Una sola tabla para todo.
- Muy flexible.
- No agrega columnas a cada tabla.

Desventajas:

- Menos type-safe.
- Mas dificil validar FKs.
- Queries mas abstractas.
- Errores de `entityType`/`entityId` se detectan tarde.
- Puede volverse una tabla "magica" dificil de mantener.

Opinion:

No la recomiendo como primera opcion. Es flexible, pero demasiado generica para
un producto que todavia esta consolidando dominio.

### Alternativa C: Templates Globales Separados

Ejemplo:

```txt
RoleTemplate
Role

LeavePolicyTemplate
LeavePolicy
```

Ventajas:

- Modelo muy limpio.
- Excelente para versionar defaults de producto.
- Separacion clara entre producto y tenant.

Desventajas:

- Mas refactor sobre el modelo actual.
- Duplica estructura entre template y entidad efectiva.
- Puede ser prematuro para v1.

Opinion:

Es una buena evolucion futura si el producto necesita versionado fuerte de
templates. No es la opcion mas pragmatica ahora.

## Recomendacion Final

Usar el approach de columnas comunes:

```txt
templateKey
sourceType
scopeType
scopeId
tenantId
```

con copy-on-write:

```txt
editar CORE -> crear CUSTOM en el scope actual -> resolver CUSTOM primero
```

Para roles, mantener compatibilidad inicial con el modelo actual, pero orientar
la evolucion hacia:

```txt
Role as configurable record
  CORE default/base
  CUSTOM tenant override
  CUSTOM scoped override futuro
```

No crear tablas de override por feature salvo que una feature necesite metadata
especial que justifique esa complejidad.

## Implicaciones Para Fase 6

La fase 6 ya estaba orientada a hardening. Con este analisis, deberia incluir
tambien hardening de contratos de configuracion:

```txt
1. Documentar sourceType/scopeType/templateKey como convencion.
2. Asegurar que los core roles no se mutan directamente.
3. Agregar tests de copy-on-write para roles cuando se implemente.
4. Asegurar que listados muestran la resolucion efectiva, no duplicados core +
   custom.
5. Asegurar que assignments usan solo roles efectivos/asignables.
6. Agregar audit events claros:
   role.customized
   role.override_created
   role.override_updated
7. Revisar cache invalidation de CurrentUser, Role y TenantUser.
```

DoD recomendado:

```txt
Un admin puede customizar un rol base sin modificar el registro core.
La UI muestra un solo role efectivo por template/scope.
El backend valida que no existan dos overrides activos para el mismo
template/scope.
```

## Implicaciones Para Fase 7

La fase 7 no deberia empezar creando branch scopes directamente en todos los
endpoints. Primero debe definir la convencion comun:

```txt
scopeType
scopeId
effective resolver
fallback order
```

Luego aplicar a un dominio piloto:

```txt
1. Role overrides por tenant.
2. Luego Role overrides por branch.
3. Luego otra configuracion no-RBAC, por ejemplo HolidayCalendar o LeavePolicy.
```

Orden recomendado:

```txt
1. Tenant-level role copy-on-write.
2. Effective role resolver.
3. Branch entity formal.
4. Branch-level role override.
5. MembershipAccessScope para limitar usuarios por branch.
6. Aplicar el patron a configuraciones operativas.
```

No mezclar todo en una sola entrega.

## Riesgos Y Mitigaciones

### Riesgo: Resolver Efectivo Inconsistente

Si cada feature implementa fallback de forma distinta, habra bugs dificiles.

Mitigacion:

```txt
Crear un patron/helper reusable para resolver:
branch > tenant > core
```

Aunque cada repository tenga queries propias, la semantica debe ser identica.

### Riesgo: Duplicados De Overrides

Dos custom roles para el mismo `templateKey` y scope podrian generar ambiguedad.

Mitigacion:

```txt
Unique indexes.
Transacciones en copy-on-write.
Tests de concurrencia basicos.
```

### Riesgo: Mutar CORE Por Error

Un endpoint podria hacer `update` directo sobre un record CORE.

Mitigacion:

```txt
AccessPolicyService debe bloquear update directo de sourceType=CORE.
Use case separado para customize/copy-on-write.
Tests unitarios y e2e.
```

### Riesgo: UI Muestra Core Y Custom A La Vez

Si el listado no resuelve correctamente, el admin ve duplicados.

Mitigacion:

```txt
List endpoints deben devolver effective records.
Opcional: incluir metadata:
  sourceType
  templateKey
  inheritedFrom
  isCustomized
```

### Riesgo: Scope Generico Sin FK

`scopeId` puede apuntar a Branch, Employer, Location, etc. Eso complica
integridad referencial.

Mitigacion:

```txt
Validar scopeId en application service segun scopeType.
Agregar indexes.
Si una entidad se vuelve critica, considerar columna dedicada o tabla especifica.
```

### Riesgo: Demasiado Poder En Custom Roles

Al customizar core roles, un admin podria agregar permisos excesivos.

Mitigacion:

```txt
Mantener roles.manage como permiso critico.
Confirmar cambios que agreguen permisos criticos.
Audit detallado before/after.
No permitir romper ultimo owner/admin efectivo.
```

### Riesgo: Branch Override Rompe Seguridad

Un usuario con scope branch podria leer datos de otro branch si las queries no
filtran correctamente.

Mitigacion:

```txt
MembershipAccessScope separado de Role.
TenantGuard/TenantContext debe incluir scopes efectivos cuando exista.
Repositories de datos branch-scoped deben usar scope filters obligatorios.
E2E de internal scope isolation.
```

### Riesgo: Performance Del Fallback

Resolver branch > tenant > core en muchos listados puede crear queries pesadas.

Mitigacion:

```txt
Resolver por batches.
Indexes por tenantId, scopeType, scopeId, templateKey.
Cache por request para configuraciones efectivas.
Evitar resolver por item en loops.
```

## UI/UX Recomendado

La UI no debe explicar demasiada arquitectura interna, pero si debe mostrar
estado de forma clara:

```txt
Default
Customized
Customized for this branch
Inherited from tenant
Inherited from system default
```

Para roles:

```txt
Edit default role
  -> si es CORE, save crea custom tenant override

Edit branch role futuro
  -> save crea custom branch override

Reset to default
  -> archive/delete override segun politica
  -> vuelve a resolver tenant/core
```

Acciones futuras utiles:

```txt
Customize
Reset to tenant default
Reset to system default
View inherited permissions
```

## Auditoria

Audit events recomendados:

```txt
config.override_created
config.override_updated
config.override_reset
role.customized
role.reset_to_default
role.branch_override_created
```

Metadata:

```txt
templateKey
sourceType
scopeType
scopeId
before
after
effectiveRecordId
baseRecordId
```

## Decision

La decision recomendada es:

```txt
1. No crear muchas tablas de override.
2. Usar columnas comunes en tablas configurables.
3. Implementar copy-on-write para editar defaults/core.
4. Resolver por prioridad: branch > tenant > core.
5. Mantener MembershipAccessScope separado para limitar acceso de usuarios.
6. Aplicar primero a roles, luego a una configuracion operativa.
```

Esto balancea simplicidad actual con extensibilidad real. Evita una arquitectura
demasiado generica y evita tambien llenar el schema de tablas de override por
cada feature.
