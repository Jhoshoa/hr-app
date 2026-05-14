# Future Enhancements: Dev Shortcuts Y Bootstrap De Acceso

Creado: 13 de mayo de 2026.

## Proposito

Este documento lista mejoras futuras para acelerar desarrollo, testing manual y demos sin
debilitar la arquitectura principal definida en:

```text
docs/new-user-access/company-signup-platform-execution-plan-es.md
```

La regla sigue siendo:

```text
Produccion usa company signup + approval.
Desarrollo puede usar seeders/scripts para avanzar mas rapido.
```

## Principio

Los shortcuts de desarrollo no deben reemplazar el flujo productivo.

El flujo productivo correcto sigue siendo:

```text
CompanySignupRequest PENDING
Platform admin approval
Tenant creation
User creation/reuse by email
TenantMembership owner
```

Los shortcuts solo sirven para:

```text
levantar datos locales rapido
probar pantallas sin repetir pasos manuales
crear tenants demo
crear usuarios y memberships de prueba
preparar fixtures para tests
```

## Siguiente Prioridad: Limpieza De Variables De Entorno

Cuando terminen las fases principales del plan de company signup y platform approval,
conviene hacer un clean de variables de entorno para separar claramente:

```text
shortcuts de desarrollo
bootstrap administrativo
configuracion productiva
```

Esto no tiene que bloquear la implementacion actual. Es mejor hacerlo al final, cuando ya
este claro que variables quedaron realmente necesarias.

Clasificacion recomendada:

```text
Development-only shortcuts:
AUTO_JOIN_DEFAULT_TENANT
DEFAULT_TENANT_SLUG
DEFAULT_TENANT_ROLE
SEED_PLATFORM_OWNER_TENANT_MEMBERSHIP
SEED_SAMPLE_COMPANY_SIGNUPS
SEED_SAMPLE_EMPLOYEES
```

```text
Bootstrap/admin:
PLATFORM_OWNER_EMAIL
```

```text
Production recommendation:
AUTO_JOIN_DEFAULT_TENANT=false
SEED_PLATFORM_OWNER_TENANT_MEMBERSHIP=false
PLATFORM_OWNER_EMAIL=
```

En produccion, el objetivo final deberia ser no depender de `PLATFORM_OWNER_EMAIL` en
seeders automaticos. En su lugar, usar un comando one-time:

```text
pnpm platform:grant-owner --email admin@empresa.com
```

Tareas sugeridas para esta limpieza:

```text
1. Documentar cada variable con scope: development, staging, production, bootstrap.
2. Mover shortcuts de seed a una seccion "Development only" en .env.example.
3. Asegurar que produccion no corre seeders que concedan PLATFORM_OWNER automaticamente.
4. Crear o planificar platform:grant-owner como reemplazo de bootstrap por env.
5. Revisar si AUTO_JOIN_DEFAULT_TENANT sigue siendo necesario o puede eliminarse.
```

## Enhancement 1: Seeder De Desarrollo Mas Completo

Extender:

```text
packages/database/prisma/seed.ts
```

Para crear:

```text
assuresoft-demo tenant
default permissions
owner role con todos los permissions
PLATFORM_OWNER_EMAIL como User local
PlatformUserRole PLATFORM_OWNER
TenantMembership owner opcional para assuresoft-demo
sample employees
sample organization records
sample company signup requests
```

Variables sugeridas:

```env
PLATFORM_OWNER_EMAIL=tu-correo@example.com
SEED_PLATFORM_OWNER_TENANT_MEMBERSHIP=true
SEED_SAMPLE_COMPANY_SIGNUPS=true
SEED_SAMPLE_EMPLOYEES=true
```

Regla:

```text
El seeder no crea passwords.
El seeder no reemplaza Supabase Auth.
El seeder solo crea autorizacion local y datos demo.
```

## Enhancement 2: Script Para Crear Tenant Demo Directamente

Agregar comando futuro:

```text
pnpm dev:create-tenant --slug acme-demo --name "Acme Demo" --owner admin@example.com
```

Este script debe:

```text
crear Tenant
crear roles default
asignar permissions default al owner role
crear o reutilizar User por email
crear TenantMembership ACTIVE owner
imprimir resultado verificable
ser idempotente cuando sea posible
```

Uso esperado:

```text
desarrollo local
demos internas
testing manual
```

No usar como reemplazo del approval flow productivo.

## Enhancement 3: Script Para Crear Platform Owner

Agregar comando futuro:

```text
pnpm platform:grant-owner --email admin@empresa.com
```

Debe:

```text
crear o reutilizar User local por email
asignar PlatformUserRole PLATFORM_OWNER
no crear password
no crear tenant automaticamente
ser idempotente
registrar audit event si corre dentro del API context
```

Uso:

```text
bootstrap inicial de produccion
recuperacion administrativa controlada
preparacion de ambientes staging
```

Precaucion:

```text
No correr automaticamente en cada boot de produccion.
```

## Enhancement 4: Fixtures Para Company Signup

Agregar datos de prueba:

```text
PENDING: empresa lista para aprobar
PENDING: empresa con website duplicado como warning
APPROVED: empresa ya aprobada
REJECTED: empresa rechazada con razon
```

Esto ayudara a probar la UI:

```text
filtros por status
empty states
detail drawer
approve dialog
reject dialog
badges
review metadata
```

## Enhancement 5: Dev Auth O Auth Mock Para Tests

Para tests automatizados, no depender de Google real.

Opciones:

```text
mockear AuthProvider en tests backend
usar tokens fake en e2e local
crear usuarios locales por fixture
inyectar platformRoles y tenant memberships segun escenario
```

Casos utiles:

```text
platform owner sin tenants
platform owner con tenant demo
tenant owner sin platform role
platform support sin approve permission
usuario autenticado sin acceso
```

## Enhancement 6: Ruta Interna Para Developer Tools

Solo en development, considerar una pantalla interna:

```text
/platform/dev-tools
```

Acciones posibles:

```text
crear tenant demo
crear signup request fake
resetear sample data
ver current platform roles
ver current tenant memberships
```

Requisitos:

```text
NODE_ENV=development
PLATFORM_OWNER requerido
no disponible en production
acciones auditadas o al menos logueadas
```

Este enhancement no es necesario para v1.

## Que No Debemos Hacer

No crear:

```text
tenant: platform
tenant role: owner
```

No usar:

```text
TenantMembership para conceder acceso a /platform
```

No permitir:

```text
company signup publico creando tenant automaticamente
company signup publico creando User automaticamente
seeders creando passwords reales
AUTO_JOIN_DEFAULT_TENANT como estrategia permanente
```

## Orden Recomendado Futuro

Despues de implementar el plan principal:

```text
1. Extender seed.ts con PLATFORM_OWNER_EMAIL y sample signups.
2. Agregar script dev:create-tenant.
3. Agregar script platform:grant-owner.
4. Agregar fixtures e2e para platform roles.
5. Evaluar /platform/dev-tools solo si realmente acelera desarrollo.
```

## Resumen

La arquitectura principal debe mantenerse estricta:

```text
PlatformUserRole para plataforma.
TenantMembership para empresas.
CompanySignupRequest para solicitudes publicas.
Approval manual para crear tenant y primer owner.
```

Los shortcuts futuros son utiles, pero solo como herramientas de desarrollo, demos,
testing y bootstrap controlado.







Incluye los future enhancements separados del plan principal:

  - Seeder de desarrollo más completo.
  - PLATFORM_OWNER_EMAIL.
  - Script futuro pnpm dev:create-tenant.
  - Script futuro pnpm platform:grant-owner.
  - Fixtures para company signup.
  - Auth mock/dev auth para tests.
  - Posible /platform/dev-tools.
  - Qué no debemos hacer: tenant falso platform, usar TenantMembership para /platform, crear tenants/users desde signup público, etc.

  El plan principal queda como está en docs/new-user-access/company-signup-platform-execution-plan-es.md.
