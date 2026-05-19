# Tenant Features And Feature Gating Implementation Plan

Fecha: 2026-05-17

Ultima actualizacion de implementacion: 2026-05-18

## Objetivo

Definir una implementacion minima temprana para habilitar/deshabilitar modulos
o funcionalidades por tenant sin introducir todavia billing, planes complejos o
un sistema avanzado de feature flags.

La meta es que cada nuevo modulo pueda responder dos preguntas separadas:

```txt
1. Este tenant tiene disponible esta feature?
2. Este usuario tiene permisos para usarla?
```

Ejemplo:

```txt
Tenant tiene feature timesheets.
User tiene permiso timesheets.self.submit.
=> puede enviar su timesheet.
```

Si el tenant no tiene la feature:

```txt
Tenant no tiene feature timesheets.
User tiene permiso timesheets.self.submit.
=> backend deniega igual.
```

## Relacion Con Los Otros Planes

Planes relacionados:

```txt
docs/role-tenant-hierarchy-scope/organization-unit-implementation-plan.md
docs/role-tenant-hierarchy-scope/membership-access-scope-implementation-plan.md
docs/role-tenant-hierarchy-scope/access-filter-and-self-team-authorization-pattern.md
```

Orden recomendado:

```txt
1. TenantFeature minimo.
2. OrganizationUnit.
3. MembershipAccessScope.
4. Access Filter / Self-Team pattern en todos los modulos nuevos.
```

Pero hay una precision importante:

```txt
Access Filter / Self-Team pattern no espera a MembershipAccessScope.
Debe usarse desde ya en modulos nuevos.
```

Por tanto, el orden practico es:

```txt
Fase base temprana:
  TenantFeature minimo
  Access Filter / Self-Team pattern

Fase estructura:
  OrganizationUnit

Fase autorizacion interna:
  MembershipAccessScope
```

## Feature No Es Permission

No mezclar:

```txt
Feature:
  disponibilidad del producto para el tenant.

Permission:
  capacidad del usuario dentro de un tenant.

AccessScope:
  alcance interno sobre otros empleados/datos.
```

Ejemplo:

```txt
Feature:
  timesheets

Permissions:
  timesheets.self.submit
  timesheets.team.approve
  timesheets.manage

AccessScope:
  TENANT
  ORGANIZATION_UNIT = Santa Cruz
  DIRECT_REPORTS
```

La decision final de acceso debe ser:

```txt
tenant has feature
AND user has permission
AND resource is inside access filter, si opera sobre otros
```

## Feature Keys

Definir keys estables desde el inicio. No usar labels de UI como keys.

Ejemplos iniciales:

```txt
organization_units
membership_access_scopes
timesheets
leave_requests
documents
performance_reviews
compensation
advanced_reports
custom_fields
client_projects
```

Reglas:

```txt
1. Usar lowercase snake_case.
2. No renombrar keys sin migracion.
3. No usar nombres de plan como feature key.
4. No usar permisos como feature key.
5. Agrupar features por modulo o capability real.
```

Bueno:

```txt
timesheets
leave_requests
organization_units
```

Malo:

```txt
premium
plan_pro
can_submit_timesheet
button_new_timesheet_enabled
```

## Modelo De Datos Minimo

### TenantFeature

```prisma
model TenantFeature {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @db.Uuid
  key       String
  enabled   Boolean  @default(true)
  source    String?  // manual, seed, plan, rollout, etc. opcional
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, key])
  @@index([tenantId, enabled])
  @@index([key, enabled])
}
```

Agregar en `Tenant`:

```prisma
features TenantFeature[]
```

### Por Que No PlanFeature Todavia

Billing puede venir despues:

```txt
Plan
PlanFeature
TenantSubscription
Invoice
```

Para v1, `TenantFeature` es suficiente porque permite:

```txt
- habilitar modulos por tenant;
- hacer pilotos/beta;
- apagar una feature si hay riesgo;
- preparar billing futuro;
- no bloquear desarrollo actual.
```

## Semantica De TenantFeature

Recomendacion:

```txt
fila ausente = feature disabled
fila enabled = true = feature enabled
fila enabled = false = feature disabled explicitamente
```

Esto evita habilitar accidentalmente features nuevas para todos los tenants.

Para entornos locales o demo se puede tener seed:

```txt
habilitar todas las features base para tenant dev.
```

## Backend: TenantContext

Actualizar `TenantContext`:

```ts
interface TenantContext {
  readonly id: string;
  readonly slug: string;
  readonly name?: string;
  readonly roleKey: string;
  readonly roles?: RoleSummary[];
  readonly permissions: string[];
  readonly features: string[];
}
```

Actualizar:

```txt
PrismaUsersRepository.findTenantMembershipContext
ResolveTenantContextUseCase
request-context.ts
Current user endpoint/response
frontend TenantSummary
```

El backend debe cargar solo:

```txt
TenantFeature where enabled = true
```

## Backend: Feature Service

Crear un servicio simple:

```ts
@Injectable()
export class TenantFeatureService {
  hasFeature(tenant: TenantContext, featureKey: string): boolean {
    return tenant.features.includes(featureKey);
  }

  assertFeatureEnabled(tenant: TenantContext, featureKey: string): void {
    if (!this.hasFeature(tenant, featureKey)) {
      throw new ForbiddenException("Feature is not enabled for this tenant.");
    }
  }
}
```

Ubicacion recomendada:

```txt
apps/api/src/common/features/tenant-feature.service.ts
```

o un modulo:

```txt
modules/tenant-features
```

Para empezar, un service comun es suficiente.

## Backend: Decorator / Guard

Crear decorator:

```ts
@RequireFeature("timesheets")
```

Guard:

```txt
TenantFeatureGuard
  lee metadata del decorator;
  lee request.tenant;
  valida feature;
  si no hay feature requerida, permite.
```

Orden conceptual de guards:

```txt
AuthGuard
TenantGuard
TenantFeatureGuard
PermissionsGuard
```

Lo importante es que `TenantGuard` ya haya resuelto `request.tenant`.

Si el orden global actual no permite agregar guard facilmente, usar el service
dentro de use cases al principio:

```txt
tenantFeatureService.assertFeatureEnabled(tenant, "timesheets")
```

Recomendacion pragmatica:

```txt
Fase 1:
  service en use cases y controllers criticos.

Fase 2:
  decorator/guard reusable cuando haya varios modulos.
```

## Backend: Validacion En Endpoints

Para cada endpoint nuevo:

```txt
1. Validar feature.
2. Validar permission.
3. Validar self/access filter si aplica.
```

Ejemplo:

```txt
POST /api/v1/me/timesheets
  feature: timesheets
  permission: timesheets.self.submit
  access: currentEmployee ownership
```

Ejemplo:

```txt
POST /api/v1/timesheets/:timesheetId/approve
  feature: timesheets
  permission: timesheets.team.approve
  access: target employee inside access filter
```

## Frontend: Current Tenant

Actualizar `TenantSummary`:

```ts
export interface TenantSummary {
  readonly tenantId: string;
  readonly tenantSlug: string;
  readonly tenantName: string;
  readonly roleKey: string;
  readonly roles?: TenantRoleSummary[];
  readonly permissions: string[];
  readonly features: string[];
}
```

## Frontend: Helper

Crear helper:

```ts
export const hasFeature = (features: readonly string[], feature: string) =>
  features.includes(feature);

export const hasAllFeatures = (features: readonly string[], required: readonly string[]) =>
  required.every((feature) => features.includes(feature));

export const hasAnyFeature = (features: readonly string[], required: readonly string[]) =>
  required.length === 0 || required.some((feature) => features.includes(feature));
```

Ubicacion sugerida:

```txt
apps/web/src/config/features.ts
```

## Frontend: Navegacion

Actualizar `navigationItems` para soportar:

```ts
features?: readonly string[];
permissions: readonly string[];
```

Regla:

```txt
mostrar item si:
  tenant tiene features requeridas
  AND tenant tiene permisos requeridos
```

Ejemplo:

```ts
{
  href: "/timesheets",
  label: "Timesheets",
  features: ["timesheets"],
  permissions: ["timesheets.self.submit", "timesheets.team.approve"]
}
```

Nota:

```txt
features ocultan disponibilidad del modulo;
permissions ocultan segun rol del usuario.
```

## Frontend: Paginas

Cada pagina nueva debe tener gate de feature + permission.

Ejemplo conceptual:

```txt
Timesheets page:
  if !hasFeature("timesheets") -> Not available / upgrade / redirect
  if !hasAnyPermission([...]) -> No access
  render page
```

No confiar solo en el frontend:

```txt
backend debe validar feature tambien.
```

## Buenas Practicas Para Disenar Nueva Vista

Checklist:

```txt
1. Definir feature key del modulo.
2. Definir permisos self/team/admin.
3. Definir si la vista es self, team/admin o mixta.
4. Agregar item de navegacion con features + permissions.
5. Agregar page-level guard.
6. Usar empty states para acceso limitado.
7. No mostrar datos sensibles si backend no los envio.
8. No asumir que permiso implica tenant-wide.
```

Ejemplo Timesheets:

```txt
Feature:
  timesheets

Self permissions:
  timesheets.self.read
  timesheets.self.submit

Team/admin permissions:
  timesheets.team.read
  timesheets.team.approve
  timesheets.manage

Routes:
  /my-timesheets
  /timesheets/approvals
```

## Buenas Practicas Para Disenar Nuevo Endpoint

Checklist:

```txt
1. Endpoint requiere tenant context?
2. Que feature habilita este endpoint?
3. Que permission requiere?
4. Opera sobre self o sobre otros?
5. Si self: validar ownership por currentEmployee.
6. Si otros: validar AccessFilter.
7. Repository recibe tenantId y filtros de acceso.
8. Tests cubren feature disabled, permission missing y out-of-scope.
```

Orden recomendado dentro del use case:

```txt
1. assertFeatureEnabled
2. assertPermission, si no se usa guard
3. resolve currentEmployee si aplica
4. build access filter
5. execute repository query/action
6. audit
```

## Feature Flags Tecnicos Vs Tenant Features

`TenantFeature` puede cubrir dos casos inicialmente:

```txt
entitlement comercial:
  tenant pago el modulo.

rollout controlado:
  habilitar feature nueva a ciertos tenants.
```

Pero a futuro conviene separarlos:

```txt
TenantFeature / Entitlement:
  disponibilidad estable por tenant.

FeatureFlag / Rollout:
  experimento tecnico, beta, refactor gradual.
```

Para ahora:

```txt
TenantFeature es suficiente.
metadata/source puede indicar si viene de plan, manual o rollout.
```

## Seed / Provisionamiento

Cuando se crea un tenant:

```txt
1. crear roles base;
2. crear configuraciones base;
3. crear TenantFeature defaults segun template de onboarding;
4. opcional: habilitar features beta manualmente.
```

Comando futuro:

```txt
tenant:enable-feature --tenant-id <uuid> --feature timesheets
tenant:disable-feature --tenant-id <uuid> --feature timesheets
```

Seed local:

```txt
habilitar features necesarias para desarrollo.
```

## Testing Backend

Casos minimos:

```txt
1. TenantContext incluye solo features enabled.
2. endpoint con feature disabled responde 403.
3. endpoint con feature enabled pero sin permission responde 403.
4. endpoint con feature enabled y permission responde ok.
5. tenant A no hereda feature de tenant B.
```

## Testing Frontend

Casos minimos:

```txt
1. navigation oculta item si falta feature.
2. navigation oculta item si falta permission.
3. page gate muestra no disponible si falta feature.
4. page gate muestra no access si feature existe pero falta permission.
5. hasFeature helper funciona con lista vacia.
```

## Riesgos Y Mitigaciones

### Riesgo: Solo Ocultar En Frontend

Mitigacion:

```txt
todo endpoint de modulo gated valida feature en backend.
```

### Riesgo: Confundir Features Con Permissions

Mitigacion:

```txt
features son por tenant;
permissions son por user/role;
ambos se validan.
```

### Riesgo: Feature Keys Inestables

Mitigacion:

```txt
catalogo central de feature keys;
no renombrar sin migracion;
tests sobre keys criticas.
```

### Riesgo: Bloquear Desarrollo Con Sistema De Billing Prematuro

Mitigacion:

```txt
TenantFeature minimo ahora;
Plan/Subscription despues.
```

## Fases De Implementacion

### Fase 1: Catalogo Y DB

```txt
1. Definir feature keys iniciales.
2. Crear TenantFeature en Prisma.
3. Agregar relacion en Tenant.
4. Crear migracion.
5. Actualizar seed local.
```

### Fase 2: Backend Context

```txt
1. Cargar features enabled en PrismaUsersRepository.
2. Agregar features a TenantMembershipContext.
3. Agregar features a TenantContext.
4. Agregar features a CurrentUser response.
```

### Fase 3: Backend Enforcement

```txt
1. Crear TenantFeatureService.
2. Crear RequireFeature decorator opcional.
3. Crear TenantFeatureGuard opcional.
4. Aplicar service/guard al primer modulo gated.
```

### Fase 4: Frontend Helpers

```txt
1. Agregar features a TenantSummary.
2. Crear hasFeature helpers.
3. Actualizar navigation config.
4. Crear page-level checks.
```

### Fase 5: Uso En Modulos Nuevos

```txt
1. Cada modulo nuevo declara feature key.
2. Cada endpoint valida feature + permission.
3. Cada vista valida feature + permission.
4. Cada modulo employee-owned usa AccessFilter/Self-Team pattern.
```

## Decision Recomendada

Implementar `TenantFeature` minimo antes o al inicio de nuevos modulos grandes
como:

```txt
timesheets
leave requests
documents
performance
```

No hace falta implementar billing ahora.

Orden recomendado:

```txt
1. TenantFeature minimo.
2. Access Filter / Self-Team pattern desde ya.
3. OrganizationUnit.
4. MembershipAccessScope.
5. Billing/Plan/Subscription despues.
```

Esto evita refactors grandes en navegacion, endpoints y use cases cuando el
producto empiece a vender modulos por tenant o hacer rollouts graduales.

## Estado Implementado 2026-05-18

La fase minima de `TenantFeature` ya quedo implementada:

```txt
DB:
  TenantFeature agregado a Prisma.
  Relacion Tenant.features agregada.
  Migracion 20260518120000_tenant_features aplicada en DB local.
  Indices:
    unique tenantId + key
    tenantId + enabled
    key + enabled

Catalogo:
  packages/database/src/tenant-feature-catalog.ts
  Seed local habilita todas las features del catalogo para tenants demo.

Backend:
  TenantContext.features agregado.
  TenantMembershipContext.features agregado.
  PrismaUsersRepository carga solo features enabled en el contexto efectivo.
  /me devuelve features por tenant.
  TenantFeatureService agregado.
  @RequireFeature agregado.
  TenantFeatureGuard registrado globalmente despues de TenantGuard y antes de PermissionsGuard.

Frontend:
  TenantSummary.features agregado.
  current-user-api normaliza features faltantes a [].
  helpers hasFeature, hasAllFeatures, hasAnyFeature agregados.
  SidebarNav soporta item.features sin cambiar la navegacion existente.
```

Decision aplicada:

```txt
Por compatibilidad, ningun item de navegacion existente fue gated todavia con
features. Cada modulo nuevo debe declarar su feature key cuando se agregue su
route/page y cada endpoint debe usar @RequireFeature o TenantFeatureService.
```

Validacion ejecutada:

```txt
corepack pnpm --filter @hr-app/database db:generate
corepack pnpm --filter @hr-app/api typecheck
corepack pnpm --filter @hr-app/web typecheck
corepack pnpm --filter @hr-app/database typecheck
corepack pnpm --filter @hr-app/api test
corepack pnpm --filter @hr-app/web test
corepack pnpm --filter @hr-app/database db:migrate
corepack pnpm --filter @hr-app/database db:seed
corepack pnpm --filter @hr-app/api test:e2e
```

Siguiente fase:

```txt
OrganizationUnit:
  OrganizationUnitType
  OrganizationUnit
  EmployeeJobAssignment.organizationUnitId
  CRUD backend especifico dentro de OrganizationModule
  paneles frontend especificos en Organization Settings
```
