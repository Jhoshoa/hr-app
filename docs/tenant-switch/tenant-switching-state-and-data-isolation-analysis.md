# Tenant Switching State And Data Isolation Analysis

Fecha: 2026-05-14

## Contexto

Un mismo usuario puede pertenecer a mas de un tenant. Eso es valido para un
SaaS multi-tenant: una persona puede administrar varias companias, o puede ser
owner en una compania y HR admin en otra.

El riesgo no esta en permitir multiples tenants por usuario. El riesgo esta en
que el frontend, el cache y las llamadas API no cambien de tenant de forma
atomica y consistente.

Actualmente el menu del usuario muestra los tenants disponibles y un check para
el tenant actual, pero el switch no esta completamente implementado como flujo
de aplicacion. El click despacha `selectTenant(tenantSlug)`, pero no hace todo
lo necesario para cambiar de workspace sin mezclar datos.

## Implementacion Actual Observada

Archivos relevantes:

```text
apps/web/src/components/app-shell/user-menu.tsx
apps/web/src/features/tenants/tenant-slice.ts
apps/web/src/features/api/base-api.ts
apps/web/src/features/auth/current-user-api.ts
apps/web/src/lib/auth/workspace-cache.ts
```

El estado de tenant vive en Redux:

```ts
currentTenant
availableTenants
isHydrated
```

El header API se arma con:

```ts
x-tenant-slug = state.tenant.currentTenant.tenantSlug
```

Eso esta bien como principio: el backend debe resolver el tenant actual desde
`x-tenant-slug`, y todos los endpoints tenant-scoped deben depender de ese
header.

El problema actual esta en estas partes:

```ts
selectTenant(tenantSlug)
```

solo cambia `currentTenant` en Redux. No invalida datos ya cacheados, no persiste
la preferencia, no fuerza refetch de datos tenant-scoped, no protege formularios
abiertos y no limpia queries previas de otro tenant.

Ademas:

```ts
setTenants(data.tenants)
```

siempre selecciona:

```ts
action.payload[0]
```

Eso significa que cualquier refetch de `/me`, hidratacion de cache o refresh del
layout puede volver a poner el primer tenant, pisando el tenant que el usuario
selecciono manualmente.

## Comportamiento Esperado

Cuando el usuario cambia de tenant:

1. La UI debe cambiar inmediatamente el tenant visible en navbar/sidebar.
2. `x-tenant-slug` debe cambiar antes de cualquier nueva llamada tenant-scoped.
3. Las queries del tenant anterior deben invalidarse o limpiarse.
4. Las pantallas de Settings, Organization, Employees, Leave, Documents, etc.
   deben recargar datos usando el nuevo tenant.
5. Formularios con cambios sin guardar deben advertir antes del cambio.
6. La preferencia debe persistir para refresh/reload.
7. Si el tenant seleccionado ya no esta disponible, debe caer a un tenant valido
   o mandar a `/no-access`.

## Riesgos Principales

### 1. Cache De RTK Query Mezclado Entre Tenants

Muchas queries actuales no incluyen `tenantSlug` como parametro:

```ts
useGetCurrentTenantQuery()
useListOrganizationRecordsQuery({ kind })
```

Como RTK Query cachea por endpoint + argumentos, dos tenants distintos pueden
compartir la misma cache si el endpoint no incluye el tenant en la key.

Aunque el header `x-tenant-slug` cambie, RTK puede devolver datos cacheados del
tenant anterior hasta que se invalide o refetchee.

Impacto:

```text
El usuario podria ver Company Settings, catalogs, employees o future modules del
tenant anterior despues de cambiar de tenant.
```

### 2. Mutaciones Contra Tenant Incorrecto

Si el usuario tiene una pantalla abierta con datos del tenant A, luego cambia al
tenant B, y el formulario no se resetea, una mutacion podria enviarse con header
del tenant B pero con valores cargados desde tenant A.

Ejemplo:

```text
Abro Settings de AssureSoft.
Cambio a CocaCola desde el menu.
El form todavia muestra AssureSoft por cache.
Click Save.
Se actualiza CocaCola con datos de AssureSoft.
```

Este es el riesgo mas delicado.

### 3. `setTenants` Pisa La Seleccion Manual

Cada vez que `/me` hidrata:

```ts
state.currentTenant = action.payload[0]
```

Si el usuario eligio `cocacola`, pero `/me` devuelve primero `assuresoft-demo`,
la aplicacion vuelve a `assuresoft-demo`.

Esto explica por que el check puede parecer cambiar por un momento o no cambiar
en absoluto.

### 4. Workspace Cache No Guarda Tenant Actual

`workspace-cache.ts` guarda:

```ts
user
tenants
platformRoles
```

No guarda:

```ts
selectedTenantSlug
```

Por eso un refresh no puede restaurar la ultima seleccion real del usuario.

### 5. Permisos Por Tenant

Los permisos vienen dentro de cada `TenantSummary`:

```ts
roleKey
permissions
```

Al cambiar tenant, el sidebar y los permission gates deben recalcularse con los
permisos del tenant nuevo. Esto ya sucede parcialmente porque leen
`currentTenant`, pero debe protegerse contra estados transitorios y cache stale.

## Reglas De Diseno Recomendadas

### Regla 1: El Tenant Actual Es Parte Del Contexto De Datos

Toda query tenant-scoped debe depender explicitamente del tenant actual.

Preferido:

```ts
useGetCurrentTenantQuery(currentTenant.tenantSlug, { skip: !currentTenant.tenantSlug })
```

o:

```ts
useListOrganizationRecordsQuery({
  tenantSlug: currentTenant.tenantSlug,
  kind
})
```

Aunque el backend siga usando `x-tenant-slug`, incluir `tenantSlug` en los args
hace que RTK Query tenga cache separada por tenant.

### Regla 2: Switch Tenant Debe Ser Una Accion De Aplicacion

No deberia ser solo:

```ts
dispatch(selectTenant(slug))
```

Debe existir un helper/hook central:

```ts
useSwitchTenant()
```

Responsabilidades:

```text
1. Validar que el tenant existe en availableTenants.
2. Detectar si hay dirty forms registrados.
3. Pedir confirmacion si hay cambios sin guardar.
4. Despachar selectTenant.
5. Persistir selectedTenantSlug.
6. Resetear o invalidar RTK Query tenant-scoped.
7. Redirigir a una ruta segura si la ruta actual no aplica.
8. Mostrar toast "Workspace changed".
```

### Regla 3: `setTenants` Debe Preservar Tenant Seleccionado

Nueva logica recomendada:

```text
1. Si existe selectedTenantSlug persistido y sigue en data.tenants, usarlo.
2. Si currentTenant sigue existiendo en data.tenants, preservarlo.
3. Si no, usar data.tenants[0].
4. Si no hay tenants, limpiar currentTenant y marcar no-access/platform-only.
```

No debe volver al primer tenant por defecto en cada `/me`.

### Regla 4: Cache De Workspace Debe Incluir Selected Tenant

Actualizar estructura:

```ts
interface WorkspaceContextCache {
  user: CurrentUser;
  tenants: TenantSummary[];
  platformRoles: PlatformRoleKey[];
  selectedTenantSlug?: string;
}
```

La cache debe validarse contra el usuario autenticado actual. Si el email/id no
coincide con la sesion de Supabase, se debe limpiar.

### Regla 5: Pantallas Tenant-Scoped Deben Resetear Formularios Por Tenant

En `CompanySettingsPage`, `OrganizationSettingsPage` y futuras pantallas:

```text
Cuando currentTenant.tenantSlug cambia:
- mostrar skeleton o loading state
- resetear form local
- cerrar drawers/modals abiertos
- limpiar errores locales
- refetchear datos del tenant nuevo
```

Un form no debe mantener valores editables del tenant anterior despues del
switch.

### Regla 6: Dirty Forms Necesitan Proteccion

Antes de permitir switch:

```text
Si hay formularios con isDirty=true:
  mostrar confirmacion:
  "You have unsaved changes. Switching workspace will discard them."
```

Para iniciar simple, se puede implementar solo en pantallas criticas:

```text
Settings -> Company
Settings -> Organization
future Leave/Document/Access settings
```

Mas adelante puede existir un registry global de dirty forms.

## Backend Expectations

El backend ya tiene el principio correcto:

```text
TenantGuard resuelve tenant desde x-tenant-slug.
Endpoints platform usan @SkipTenant().
```

Debe mantenerse esta regla:

```text
Todo endpoint tenant-scoped debe exigir tenant activo, membership activo y
permisos del tenant actual.
```

Para tenants archivados:

```text
findTenantMembershipContext ya filtra tenant.status = ACTIVE.
```

Eso significa que si un tenant se archiva, el usuario no deberia poder operar
contra ese tenant aunque tenga membership.

## Settings Y Features Existentes A Revisar

### Company Settings

Actual:

```ts
useGetCurrentTenantQuery()
useUpdateCurrentTenantMutation()
```

Problema:

```text
La cache key no incluye tenantSlug.
```

Debe cambiar a:

```ts
useGetCurrentTenantQuery(currentTenant.tenantSlug)
```

o invalidar/resetear cache en cada switch. La opcion mas segura a largo plazo es
incluir tenantSlug en el query arg.

### Organization Settings

Actual:

```ts
useListOrganizationRecordsQuery({ kind })
```

Debe incluir:

```ts
{ tenantSlug, kind }
```

Ademas, al cambiar tenant:

```text
cerrar drawer
limpiar pendingAction
volver page=1
refetch records
```

### Employees Y Futuras Features

Toda feature futura debe seguir este contrato:

```text
Query args incluyen tenantSlug.
Mutations invalidan tags con tenantSlug.
Pantalla resetea estado local cuando tenantSlug cambia.
```

## Estrategia De Implementacion Recomendada

### Phase 1: Tenant Selection Correctness

Cambios:

```text
1. Extender workspace-cache con selectedTenantSlug.
2. Agregar selectedTenantSlug preservation en tenant-slice.
3. Cambiar setTenants para no pisar currentTenant si sigue siendo valido.
4. Crear useSwitchTenant.
5. UserMenu usa useSwitchTenant en lugar de dispatch(selectTenant).
6. Al switch, resetApiState o invalidar tags tenant-scoped.
```

Decision importante:

```text
Para empezar, resetApiState al cambiar tenant es mas seguro.
Luego se puede optimizar con tags por tenant.
```

Trade-off:

```text
resetApiState borra cache global y refetchea mas.
Pero evita mezclar datos entre tenants en esta etapa.
```

### Phase 2: Tenant-Aware Query Keys

Cambios:

```text
1. tenants-api: getCurrentTenant recibe tenantSlug.
2. organization-api: list/create/update/archive/reactivate reciben tenantSlug en args.
3. futuras APIs tenant-scoped deben seguir este patron.
4. Tags deben incluir tenantSlug cuando aplique.
```

Ejemplo:

```ts
providesTags: (_result, _error, { tenantSlug }) => [
  { type: "Tenant", id: `current:${tenantSlug}` }
]
```

### Phase 3: Form Safety

Cambios:

```text
1. CompanySettingsPage resetea form cuando cambia tenantSlug.
2. OrganizationSettingsPage cierra drawer/modals cuando cambia tenantSlug.
3. Agregar confirmacion si hay cambios sin guardar.
4. Crear un mecanismo reusable para dirty forms si se repite.
```

### Phase 4: UX Polish

Cambios:

```text
1. Mostrar skeleton breve al cambiar tenant.
2. Toast "Workspace changed to X".
3. Mantener al usuario en la misma ruta si esa ruta existe para ambos tenants.
4. Redirigir a /dashboard si la ruta actual ya no esta permitida por permisos.
```

## Tests Necesarios

### Unit Tests

```text
tenant-slice preserves current tenant when setTenants receives same slug
tenant-slice uses persisted selected tenant when valid
tenant-slice falls back to first tenant when selected tenant is missing
useSwitchTenant dispatches select, persists slug, resets API cache
```

### Component Tests

```text
UserMenu switches visible check to selected tenant
UserMenu calls cache reset/invalidation on switch
CompanySettingsPage refetches and resets form when tenant changes
OrganizationSettingsPage closes drawer when tenant changes
```

### Manual Verification

```text
1. Login con usuario que tiene 2 tenants.
2. Abrir Settings -> Company en tenant A.
3. Cambiar a tenant B.
4. Confirmar navbar/sidebar muestran tenant B.
5. Confirmar endpoint envia x-tenant-slug de tenant B.
6. Confirmar inputs muestran tenant B, no tenant A.
7. Editar y guardar tenant B.
8. Cambiar de vuelta a tenant A.
9. Confirmar tenant A conserva sus datos.
```

## Recomendacion Para Tu Caso Actual

El usuario con email `dan347114@gmail.com` puede tener acceso a dos tenants. Eso
no es incorrecto. Lo incorrecto seria que la UI no permita cambiar claramente o
que muestre/guarde datos del tenant equivocado.

Para probar approval con menos ruido, usar un correo nuevo sigue siendo valido.
Pero no deberiamos depender de eso. El producto debe soportar correctamente:

```text
1 usuario -> N tenants
```

La siguiente implementacion recomendada es Phase 1 y Phase 2 de este documento,
antes de seguir agregando mas features tenant-scoped. Si no se corrige ahora,
cada nueva pantalla de settings, employees, leave, documents y access heredara
el riesgo de mezclar informacion entre tenants.

