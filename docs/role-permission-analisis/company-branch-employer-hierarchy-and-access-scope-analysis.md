# Company, Branch/Employer Hierarchy and Access Scope Analysis

## Objetivo

Este documento analiza si conviene incorporar ahora una jerarquia tipo `Company -> Branch/Sucursal` o `Customer -> Employer`, y como se relacionaria con roles, permisos, configuraciones por tenant y posibles overrides por unidad organizacional.

La conclusion principal es que la idea es valida para un SaaS HR real, pero no deberia mezclarse todavia con la implementacion inmediata de roles, permisos, usuarios e invitaciones. Primero conviene estabilizar el acceso a nivel tenant.

## Estado Actual Relevante

Actualmente el proyecto trabaja principalmente con este modelo conceptual:

```txt
Tenant
  TenantMembership
  Role
  Permission
  RolePermission
  PlatformUserRole
```

El backend ya resuelve:

- usuario autenticado desde Supabase Auth;
- usuario local de la aplicacion;
- tenants disponibles para ese usuario;
- rol del usuario dentro de cada tenant;
- permisos derivados del rol;
- roles de plataforma para vistas globales.

El frontend consume esa informacion desde `/me` y usa permisos/roles para mostrar u ocultar navegacion, vistas y acciones.

Esto significa que el sistema de autorizacion actual ya tiene una base correcta a nivel `Tenant`, pero todavia no tiene scopes internos como `Branch`, `Employer`, `Department`, `Location` o `LegalEntity`.

## Modelo Jerarquico Propuesto a Futuro

Una posible evolucion seria:

```txt
Tenant
  Employer / Branch / LegalEntity / BusinessUnit
    Departments
    Locations
    Job Titles
    Employees
    Policies
    Settings overrides
```

En este modelo:

- `Tenant` representa la compania cliente dentro del SaaS.
- `Employer`, `Branch`, `LegalEntity` o `BusinessUnit` representa una unidad interna de esa compania.
- Un usuario podria tener acceso a todo el tenant o solo a una unidad especifica.
- Algunas configuraciones podrian heredarse desde el tenant y sobrescribirse a nivel de employer/branch.

## Configuracion Heredada con Overrides

La idea de usar configuracion heredada es razonable:

```txt
Tenant default settings
  -> Employer A usa defaults
  -> Employer B override holiday calendar
  -> Employer C override leave policy
```

Esto podria aplicar bien para:

- calendarios de feriados;
- politicas de vacaciones;
- tipos de permiso;
- horarios laborales;
- localizacion;
- moneda;
- categorias de documentos;
- requisitos de documentos;
- job titles;
- work modes;
- client projects;
- locations;
- departamentos.

El beneficio principal es evitar duplicacion. Si todas las sucursales usan la misma configuracion, no se crean registros innecesarios. Solo cuando una unidad necesita una regla distinta, se crea un override.

## Riesgos de Implementarlo Ahora

Aunque el modelo es valido, implementarlo demasiado pronto agregaria complejidad importante:

- cada query deberia resolver el contexto efectivo: tenant, employer y fallback;
- cada configuracion necesitaria reglas de precedencia;
- la UI deberia mostrar si un valor es heredado o personalizado;
- las pantallas de settings tendrian que permitir elegir si se edita el default del tenant o el override del employer;
- roles y permisos podrian necesitar scope interno;
- habria que prevenir que un usuario edite informacion de una unidad a la que no pertenece;
- los endpoints tendrian que validar `tenantId` y posiblemente `employerId`;
- los tests tendrian que cubrir aislamiento entre tenant y aislamiento entre unidades internas.

Este nivel de complejidad puede contaminar la implementacion de roles/permisos antes de que el modulo de acceso este suficientemente estable.

## Relacion con Roles y Permisos

No conviene mezclar todavia la jerarquia organizacional con el modelo base de roles.

La version actual recomendada para acceso es:

```txt
Tenant
  Users / Memberships
  Roles
  Permissions
  Invitations
```

Una evolucion posterior podria agregar scope interno:

```txt
TenantMembership
  roleId
  tenantId
  userId
  accessScope = tenant | employer | department | location
  employerIds opcionales
```

O una tabla separada:

```txt
MembershipAccessScope
  membershipId
  scopeType
  scopeId
```

Pero esto deberia hacerse cuando ya exista una necesidad clara de usuarios limitados por sucursal, employer, departamento o location.

## Recomendacion

La recomendacion es avanzar por fases:

### Fase 1: Acceso a Nivel Tenant

Implementar primero:

- roles administrables por tenant;
- permisos asignables a roles;
- usuarios del tenant;
- cambio de rol de un usuario;
- invitaciones;
- protecciones como no remover el ultimo owner;
- validaciones backend y frontend;
- UI de Access Settings.

Esta fase mantiene el sistema simple y consistente con la arquitectura actual.

### Fase 2: Modelo Organizacional Interno

Despues de estabilizar roles/permisos, definir formalmente si el dominio necesita:

- `Employer`;
- `Branch`;
- `LegalEntity`;
- `BusinessUnit`;
- o una combinacion de estos conceptos.

Esta fase deberia decidir nombres, relaciones, ownership y como se conectan con empleados, departamentos, locations y policies.

### Fase 3: Settings con Overrides

Agregar herencia de configuracion solo donde aporte valor real:

- tenant default;
- employer override opcional;
- resolucion de configuracion efectiva;
- UI que indique claramente si un valor es heredado o customizado.

### Fase 4: Access Scopes Internos

Agregar permisos limitados por employer/branch solo si el negocio lo necesita.

Ejemplos:

- HR admin global del tenant;
- HR admin solo de una sucursal;
- manager solo de un departamento;
- finance viewer solo de una legal entity.

## Decision Recomendada para Este Punto

No implementar todavia `Company -> Branch/Employer` como parte del modulo de roles/permisos.

Primero se deberia completar el modulo base:

```txt
Tenant
  Roles
  Permissions
  Users
  Invitations
```

Luego se puede disenar la jerarquia organizacional con una base mas estable.

La idea de `Tenant default settings + Employer overrides` es buena y probablemente necesaria mas adelante, pero en este punto puede introducir demasiada complejidad en autorizacion, settings, queries y UX.

## Resultado Esperado a Futuro

El sistema ideal deberia terminar soportando:

- companias multi-tenant;
- multiples employers, branches o legal entities por tenant;
- configuracion heredada desde tenant;
- overrides por unidad interna;
- usuarios con acceso global o limitado;
- permisos consistentes en backend y frontend;
- UI clara para distinguir configuracion heredada vs personalizada;
- queries protegidas por tenant y por scope interno cuando aplique.

La clave es no adelantar ese nivel de granularidad antes de cerrar correctamente el control de acceso base.
