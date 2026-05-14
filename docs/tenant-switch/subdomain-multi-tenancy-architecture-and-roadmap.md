# Subdomain Multi-Tenancy Architecture And Implementation Roadmap

Fecha: 2026-05-14

## Contexto

Stack actual:

```text
Frontend: Next.js App Router + React
Backend: NestJS
Base de datos: SQL/PostgreSQL via Prisma
Auth: Supabase Auth como proveedor de identidad
Autorizacion app: User + TenantMembership + Role + Permissions
Arquitectura objetivo: SaaS multi-tenant
```

Ejemplos objetivo:

```text
acme.localhost:3000
globex.localhost:3000
cliente.midominio.com
```

El slug del tenant debe ser definido por el administrador de la organizacion y
debe funcionar como identificador publico del workspace.

## Decision Ejecutiva Recomendada

Para este proyecto, la arquitectura recomendada es:

```text
Subdomain-based tenancy en frontend
+ shared database con tenantId en tablas tenant-scoped
+ backend desacoplado usando un header interno x-tenant-slug o x-tenant-id
+ validacion obligatoria de membership en backend
+ cookies/session compatibles con subdominios
```

El subdominio debe ser la fuente primaria del tenant visible para el usuario.
El backend no debe confiar ciegamente en el subdominio ni en un header enviado
por el browser. Debe validar siempre:

```text
tenant existe
tenant esta ACTIVE
usuario autenticado existe en app DB
usuario tiene TenantMembership ACTIVE en ese tenant
usuario tiene permisos para la accion
```

## 1. Arquitectura General

### Como Funcionara El Sistema

El sistema tendra dos tipos de dominios:

```text
Root domain:
  localhost:3000
  midominio.com
  www.midominio.com

Tenant domain:
  acme.localhost:3000
  globex.localhost:3000
  acme.midominio.com
  globex.midominio.com
```

Root domain se usa para:

```text
marketing/public pages
company signup
login general opcional
docs/public pages
platform admin opcional
```

Tenant domain se usa para:

```text
tenant app
dashboard
settings
employees
leave
documents
tenant-specific login
```

### Flujo Completo

Request a tenant domain:

```text
1. Browser solicita https://acme.midominio.com/dashboard
2. Next.js middleware lee Host: acme.midominio.com
3. Middleware extrae subdomain = acme
4. Middleware detecta que no es root domain ni reserved subdomain
5. Middleware resuelve tenant slug = acme
6. Frontend carga tenant app layout
7. Frontend/Supabase resuelve sesion
8. Frontend llama API con Authorization: Bearer <jwt>
9. Frontend incluye tenant context:
   x-tenant-slug: acme
10. NestJS AuthGuard valida JWT
11. TenantGuard valida tenant acme + membership del usuario
12. PermissionsGuard valida permisos tenant-scoped
13. Use case consulta DB filtrando por tenantId
14. Backend responde datos solo del tenant acme
15. Frontend renderiza el workspace acme
```

Regla critica:

```text
El subdominio identifica el tenant solicitado.
El JWT identifica el usuario.
La DB de la app decide si ese usuario tiene acceso a ese tenant.
```

### Root Domain Vs Tenant Domain

Root domain:

```text
No debe asumir tenant context.
Puede mostrar marketing o paginas publicas.
Puede permitir company signup.
Puede redirigir usuarios autenticados a su ultimo tenant.
Puede alojar platform console si se decide no usar subdominio reservado.
```

Tenant domain:

```text
Debe tener tenant context.
Debe validar que el tenant exista.
Debe renderizar app tenant-scoped.
Debe bloquear o redirigir si el usuario no tiene acceso.
```

### Separacion Marketing/Public Pages Vs Tenant App

Recomendacion con Next.js App Router:

```text
app/(public)
app/(auth)
app/(app)
app/(platform)
```

Con subdominios, el middleware decide que grupo se debe servir o si se debe
redirigir.

Modelo recomendado:

```text
midominio.com/company-signup       -> public signup
midominio.com/login                -> login general
acme.midominio.com/login           -> login contextual del tenant acme
acme.midominio.com/dashboard       -> tenant app
platform.midominio.com/...         -> platform console, si se usa reserved subdomain
```

### Subdomain Multi-Tenancy Vs Path-Based Tenancy

Subdomain-based:

```text
acme.midominio.com/dashboard
globex.midominio.com/dashboard
```

Ventajas:

```text
Mejor percepcion SaaS/enterprise.
Branding por cliente mas natural.
Cookies pueden aislarse por subdominio si se requiere.
Mas facil soportar dominios custom en el futuro.
URLs limpias para usuarios finales.
Menor riesgo de que rutas publicas mezclen tenant slug con app routing.
```

Desventajas:

```text
Requiere wildcard DNS.
Requiere wildcard SSL.
Local dev necesita estrategia de subdominios.
Cookies y CORS son mas delicados.
Preview environments pueden requerir configuracion extra.
Debugging inicial es mas complejo.
```

Path-based:

```text
midominio.com/acme/dashboard
midominio.com/globex/dashboard
```

Ventajas:

```text
Mas simple en local.
No requiere wildcard DNS.
Mas facil de montar en hosting basico.
Menos complejidad con cookies cross-subdomain.
```

Desventajas:

```text
URLs menos enterprise.
Tenant slug contamina todas las rutas.
Mayor riesgo de bugs de routing.
Mas dificil evolucionar a custom domains.
Marketing/root y app comparten paths mas facilmente.
```

Decision:

```text
Usar subdomain-based tenancy.
Mantener path-based solo como fallback interno/dev si fuese necesario.
```

## 2. Desarrollo Local

### tenant.localhost:3000

Muchos navegadores modernos resuelven subdominios de `localhost` hacia loopback:

```text
acme.localhost:3000
globex.localhost:3000
```

En la mayoria de casos no se requiere modificar `hosts`.

Pero hay diferencias por sistema operativo, browser, VPNs, proxies corporativos
o resolvers DNS. Por eso no debe ser la unica opcion documentada.

### Alternativas Locales

`lvh.me`:

```text
acme.lvh.me:3000
globex.lvh.me:3000
```

`lvh.me` resuelve a `127.0.0.1`. Es una buena opcion para desarrollo porque se
comporta como un dominio real con subdominios.

`nip.io`:

```text
acme.127.0.0.1.nip.io:3000
```

`sslip.io`:

```text
acme.127.0.0.1.sslip.io:3000
```

Estas opciones son utiles cuando se necesita que otro dispositivo o contenedor
resuelva una IP especifica.

### Recomendacion Local

Configurar:

```env
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
NEXT_PUBLIC_LOCAL_TENANT_DOMAIN_MODE=localhost
```

Y soportar tambien:

```env
NEXT_PUBLIC_ROOT_DOMAIN=lvh.me:3000
```

Regla:

```text
Para dev normal usar acme.localhost:3000.
Si falla por entorno local, usar acme.lvh.me:3000.
```

No recomendar editar `hosts` como primera opcion. Solo usarlo si el equipo tiene
restricciones DNS o necesita dominios locales especificos.

## 3. Next.js Multi-Tenant Strategy

### Middleware

El archivo clave sera:

```text
apps/web/middleware.ts
```

Responsabilidades:

```text
1. Leer host header.
2. Normalizar host quitando puerto.
3. Detectar root domain.
4. Detectar reserved subdomains.
5. Extraer tenant slug.
6. Validar formato basico del slug.
7. Reescribir o dejar pasar rutas segun contexto.
8. Redirigir cuando el tenant no aplica.
```

Ejemplo conceptual:

```ts
const host = request.headers.get("host") ?? "";
const tenantSlug = extractTenantSlug(host, rootDomain);

if (!tenantSlug) {
  return NextResponse.next();
}

if (reservedSubdomains.has(tenantSlug)) {
  return routeReservedSubdomain(request, tenantSlug);
}

const requestHeaders = new Headers(request.headers);
requestHeaders.set("x-tenant-slug", tenantSlug);

return NextResponse.next({
  request: { headers: requestHeaders }
});
```

### Extraccion De Subdominio

Debe soportar:

```text
acme.localhost:3000
acme.lvh.me:3000
acme.midominio.com
```

No debe asumir simplemente:

```ts
host.split(".")[0]
```

porque falla con:

```text
localhost:3000
www.midominio.com
staging.midominio.com
acme.staging.midominio.com
```

Recomendacion:

```env
NEXT_PUBLIC_ROOT_DOMAIN=midominio.com
NEXT_PUBLIC_APP_ENV=production
```

En staging:

```env
NEXT_PUBLIC_ROOT_DOMAIN=staging.midominio.com
```

Entonces:

```text
acme.staging.midominio.com - staging.midominio.com = acme
```

### Root Domain

Root domains validos:

```text
localhost:3000
lvh.me:3000
midominio.com
www.midominio.com
staging.midominio.com
```

Root domain no debe tener tenant context.

### Reserved Subdomains

Lista inicial:

```text
www
app
api
admin
platform
auth
mail
email
smtp
imap
cdn
static
assets
support
help
docs
status
billing
blog
staging
dev
test
localhost
```

`platform.midominio.com` puede reservarse para platform console.

### Inyeccion De Tenant Context

El middleware puede inyectar:

```text
x-tenant-slug
```

Pero ojo: headers internos de Next no son una frontera de seguridad. Sirven para
routing/rendering. El backend debe validar de nuevo.

Frontend client calls:

```text
RTK Query lee tenantSlug desde Redux o desde resolved tenant context.
Envia x-tenant-slug al API.
```

### Tenant Inexistente

Opciones:

```text
1. Mostrar /tenant-not-found en el subdominio.
2. Redirigir a root domain con mensaje.
```

Recomendacion:

```text
Para UX: mostrar tenant-not-found en el mismo host.
Para seguridad: no revelar datos internos, solo "Workspace not found".
```

No hacer fallback silencioso al root domain porque puede ocultar errores de
DNS/configuracion.

### SSR, Server Components Y App Router

Server Components pueden leer:

```ts
headers()
```

para obtener:

```text
host
x-tenant-slug
```

Pero la validacion completa debe seguir pasando por backend.

App Router recomendado:

```text
app/(public)/...
app/(auth)/...
app/(app)/...
app/(platform)/...
```

El middleware puede reescribir internamente si luego decidimos tener rutas
fisicas diferentes:

```text
acme.midominio.com/dashboard -> /_tenant/acme/dashboard
```

Pero para este proyecto, de inicio es mas simple mantener rutas actuales y solo
inyectar contexto.

### Branding Dinamico

Branding debe venir de un endpoint publico controlado:

```text
GET /public/tenants/:slug/branding
```

Respuesta:

```ts
{
  tenantSlug: "acme",
  name: "Acme",
  logoUrl: "...",
  primaryColor: "#...",
  status: "ACTIVE"
}
```

No incluir informacion sensible.

Cache:

```text
public branding puede cachearse corto.
auth/membership nunca debe cachearse publicamente.
```

## 4. NestJS Multi-Tenant Strategy

### Backend Desacoplado

El backend no necesita conocer dominios publicos para operar. Debe recibir un
tenant context normalizado:

```text
x-tenant-slug: acme
Authorization: Bearer <supabase jwt>
```

Esto desacopla:

```text
Next.js decide tenant desde subdomain.
NestJS valida tenant + usuario + permisos.
```

### Guards Recomendados

Orden:

```text
AuthGuard
TenantGuard
PlatformRolesGuard
PermissionsGuard
```

`AuthGuard`:

```text
valida JWT
resuelve User de app DB
inyecta request.user
```

`TenantGuard`:

```text
salta si @SkipTenant()
lee x-tenant-slug
valida formato
busca tenant ACTIVE
valida TenantMembership ACTIVE del user
inyecta request.tenant
```

`PermissionsGuard`:

```text
lee request.tenant.permissions
valida @Permissions()
```

### TenantContext

Forma recomendada:

```ts
interface TenantContext {
  id: string;
  slug: string;
  name: string;
  roleKey: string;
  permissions: string[];
}
```

No depender de slug en use cases internos. Convertir slug a `tenantId` en guard.

Use cases tenant-scoped deben recibir:

```ts
tenantId
actorUserId
```

### Request Scoped Providers

Opcion:

```text
Crear TenantContextProvider request-scoped.
```

Pero para NestJS, request scoped providers agregan overhead y complejidad.

Recomendacion pragmatica:

```text
Mantener decorators @CurrentTenant() y @CurrentUser().
Pasar tenantId explicitamente a use cases.
```

Esto hace dependencias claras y tests mas simples.

### TenantInterceptor

No usar interceptor para autorizacion. Puede usarse para:

```text
logging
metrics
attach tenantId to logs
```

Pero la decision de permitir o bloquear debe vivir en guards.

### Validaciones De Seguridad

Backend debe rechazar:

```text
missing x-tenant-slug en endpoints tenant-scoped
tenant slug invalido
tenant inexistente
tenant no ACTIVE
usuario sin membership ACTIVE
usuario con membership en otro tenant
usuario sin permiso requerido
```

Nunca confiar en:

```text
tenantId enviado en body
tenantSlug enviado en body
tenantId enviado como query param
```

Si un endpoint tenant-scoped recibe `tenantId` en body, debe ignorarlo o validar
que coincida con `request.tenant.id`.

## 5. Base De Datos

### Opcion 1: Shared Database + tenantId

Todas las tablas tenant-scoped tienen:

```text
tenantId
```

Ejemplo:

```text
Employee.tenantId
Department.tenantId
Location.tenantId
Role.tenantId
```

Ventajas:

```text
Menor costo operativo.
Migraciones simples.
Prisma funciona muy bien.
Queries multi-tenant admin/platform simples.
Backups centralizados.
Ideal para etapa inicial y crecimiento medio.
```

Desventajas:

```text
Requiere disciplina estricta para filtrar por tenantId.
Un bug puede mezclar datos si falta where tenantId.
Menor aislamiento fuerte entre clientes.
Clientes enterprise pueden pedir aislamiento mayor.
```

Escalabilidad:

```text
Buena hasta muchos tenants si indices correctos.
Requiere indices compuestos por tenantId.
Puede evolucionar a sharding.
```

### Opcion 2: Schema Per Tenant

Cada tenant tiene schema SQL:

```text
tenant_acme.Employee
tenant_globex.Employee
```

Ventajas:

```text
Mejor aislamiento logico.
Backups/restores por tenant mas posibles.
Menor riesgo de queries cruzadas si conexion/schema correcto.
```

Desventajas:

```text
Migraciones mas complejas.
Prisma se complica.
Provisioning de tenant mas pesado.
Reporting cross-tenant mas dificil.
Mayor costo operacional.
```

### Opcion 3: Database Per Tenant

Cada tenant tiene DB propia.

Ventajas:

```text
Aislamiento fuerte.
Cumplimiento enterprise mas facil.
Backups/restores por cliente claros.
Escalado dedicado por cliente grande.
```

Desventajas:

```text
Muy caro operativamente.
Migrations orchestration compleja.
Connection pooling mas dificil.
Provisioning lento.
Analytics cross-tenant complejo.
No ideal para etapa temprana.
```

### Recomendacion Para Este Proyecto

Usar:

```text
Shared database + tenantId
```

Justificacion:

```text
El modelo actual ya esta disenado asi.
Prisma encaja bien.
El producto esta en fase de construccion.
Permite iterar rapido.
Es suficiente para la mayoria de SaaS B2B inicial.
Se puede endurecer con guards, repositorios y tests.
```

Requisitos para hacerlo seguro:

```text
Todas las tablas tenant-scoped deben tener tenantId.
Todos los unique tenant-scoped deben ser compuestos con tenantId.
Todos los repositorios tenant-scoped reciben tenantId explicitamente.
Tests deben cubrir que queries filtran por tenantId.
No exponer endpoints que acepten tenantId arbitrario desde cliente.
```

## 6. Modelo De Datos

Modelo actual/recomendado:

```text
Tenant
User
TenantMembership
Role
Permission
RolePermission
PlatformUserRole
AuditEvent
```

Extensiones futuras:

```text
OrganizationProfile
Subscription
Plan
BillingAccount
TenantDomain
TenantBranding
TenantAuthSettings
```

### tenants

Campos:

```text
id
name
slug unique
status ACTIVE/SUSPENDED/ARCHIVED
defaultLanguage
defaultCurrency
timezone
createdAt
updatedAt
```

Futuro:

```text
customDomain
primaryDomain
logoUrl
primaryColor
```

### users

Identidad app local, sincronizada desde Supabase Auth:

```text
id
email unique
name
status INVITED/ACTIVE/DISABLED
externalAuthProvider
externalAuthUserId
createdAt
updatedAt
```

### memberships

Relacion usuario-tenant:

```text
tenantId
userId
roleId
status INVITED/ACTIVE/DISABLED
invitedAt
joinedAt
```

Un mismo usuario puede tener N memberships.

### roles/permissions

Roles tenant-scoped:

```text
Role tenantId nullable
Role key
Role isSystemRole
Permission key
RolePermission
```

`tenantId = null` puede reservarse para roles templates/globales si se decide.

### subscriptions

Futuro:

```text
Subscription
tenantId
planId
status
currentPeriodStart
currentPeriodEnd
trialEndsAt
```

### Tenant Ownership

El owner real de una organizacion se representa con:

```text
TenantMembership.roleKey = owner
```

No con un campo directo `Tenant.ownerUserId`, porque puede haber multiples
owners y cambios de ownership.

## 7. Autenticacion Y Seguridad

### Login Multi-Tenant

Flujos posibles:

1. Login desde root domain:

```text
midominio.com/login
auth success
/auth/resolve
si 1 tenant -> redirigir a https://tenant.midominio.com/dashboard
si N tenants -> selector de tenant
si platform-only -> platform console
si no access -> no-access
```

2. Login desde tenant domain:

```text
acme.midominio.com/login
auth success
/auth/resolve
validar membership en acme
si tiene acceso -> /dashboard en acme
si no tiene acceso pero tiene otros tenants -> mostrar no-access + switch
si no tiene ningun tenant -> no-access
```

### JWT

Supabase JWT identifica usuario, no tenant authorization.

No confiar en claims de tenant dentro del JWT para permisos dinamicos, porque:

```text
roles/memberships pueden cambiar
JWT puede vivir hasta expirar
permissions tenant-scoped deben venir de app DB
```

Si en el futuro se agregan custom claims, usarlos solo como optimizacion, no
como unica fuente de verdad.

### Cookies Cross-Subdomain

Estrategias:

1. Cookie compartida en root domain:

```text
Domain=.midominio.com
```

Ventaja:

```text
Login en un subdominio sirve para otros subdominios.
```

Riesgo:

```text
Mayor superficie cross-subdomain.
Requiere CSRF cuidadoso si hay cookies httpOnly.
```

2. Cookie por subdominio:

```text
Domain=acme.midominio.com
```

Ventaja:

```text
Mayor aislamiento.
```

Desventaja:

```text
Login debe repetirse por tenant o requiere auth redirect central.
```

Con Supabase client-side auth, la sesion suele manejarse en storage/cookies del
frontend segun configuracion. Para produccion enterprise, preferir session
cookies httpOnly si se implementa auth server-side.

### Recomendacion Inicial

Mantener Supabase Auth como esta, pero disenar las redirects para subdominios.
Para llamadas API:

```text
Authorization Bearer token
x-tenant-slug
```

Si mas adelante se migra a cookies httpOnly:

```text
usar SameSite=Lax
Secure=true
HttpOnly=true
Domain=.midominio.com solo si se requiere SSO entre subdominios
CSRF token para mutaciones si cookie auth es usada por browser automaticamente
```

### Proteccion Contra Tenant Spoofing

Ataque:

```text
Usuario modifica x-tenant-slug: globex
```

Mitigacion:

```text
TenantGuard valida que user tenga membership ACTIVE en globex.
```

Ataque:

```text
Usuario entra a acme.midominio.com pero manda x-tenant-slug: globex
```

Mitigacion ideal:

```text
Frontend debe enviar x-tenant-slug derivado del subdominio, no editable desde UI.
Backend valida membership.
Opcional: backend recibe x-tenant-host firmado desde proxy interno, no desde browser.
```

En este proyecto, mientras API y frontend estan separados, asumir que
`x-tenant-slug` es input no confiable y validarlo con membership.

### CSRF, CORS, Cookies

Si se usa Bearer token:

```text
CSRF es menos critico porque browser no adjunta Authorization automaticamente.
XSS es el riesgo principal.
```

Si se usa cookie auth:

```text
CSRF se vuelve critico.
Usar SameSite=Lax o Strict.
Usar CSRF token para mutaciones.
```

CORS:

```text
Permitir solo origins esperados.
Soportar wildcard tenant origins con cuidado.
No usar Access-Control-Allow-Origin: * con credentials.
```

Produccion:

```text
https://*.midominio.com
https://midominio.com
```

Staging:

```text
https://*.staging.midominio.com
https://staging.midominio.com
```

## 8. Slugs Y Subdominios

### Reglas

Slug debe:

```text
ser lowercase
tener 3-63 caracteres
usar solo a-z, 0-9, hyphen
empezar con letra o numero
terminar con letra o numero
ser unico globalmente
no estar reservado
```

Regex recomendada:

```regex
^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$
```

Normalizacion:

```text
trim
lowercase
replace spaces/underscores with hyphen
collapse multiple hyphens
strip leading/trailing hyphens
```

Reserved names:

```text
admin
api
app
auth
billing
blog
cdn
dashboard
dev
docs
email
help
imap
localhost
mail
platform
root
smtp
ssl
staging
static
status
support
test
www
```

DB:

```text
Tenant.slug unique
CompanySignupRequest desiredTenantSlug indexed
```

## 9. Routing Y Redirecciones

### Tenant Existe

No autenticado:

```text
acme.midominio.com/dashboard -> acme.midominio.com/login?redirectTo=/dashboard
```

Autenticado con access:

```text
render dashboard
```

Autenticado sin access:

```text
acme.midominio.com/no-access
```

Si tiene otros tenants:

```text
mostrar "You do not have access to Acme" + switch tenant options
```

### Tenant No Existe

```text
unknown.midominio.com/* -> tenant-not-found
```

No crear tenant automaticamente desde subdominio.

### Usuario Entra A Tenant Incorrecto

Ejemplo:

```text
usuario tiene globex, entra acme.midominio.com
```

Resultado:

```text
no-access en acme
opcion de ir a globex.midominio.com si tiene globex
```

No redirigir automaticamente sin explicar, porque podria parecer que el tenant
acme existe para ese usuario.

### Root Login Resolve

Si el login ocurre en root:

```text
1 tenant -> redirect a tenant subdomain
N tenants -> tenant picker
platform role only -> platform console
no access -> no-access
```

## 10. Deployment Y Produccion

### Wildcard DNS

Necesario:

```text
*.midominio.com -> frontend hosting
midominio.com -> frontend hosting
api.midominio.com -> backend API
```

Si API esta en dominio separado:

```text
api.midominio.com
```

No usar `api` como tenant slug.

### Wildcard SSL

Necesario certificado:

```text
*.midominio.com
midominio.com
```

Para staging:

```text
*.staging.midominio.com
staging.midominio.com
```

### Reverse Proxy / Nginx

Concepto:

```nginx
server {
  server_name *.midominio.com midominio.com;

  location / {
    proxy_set_header Host $host;
    proxy_pass http://web:3000;
  }
}

server {
  server_name api.midominio.com;

  location / {
    proxy_set_header Host $host;
    proxy_pass http://api:4000;
  }
}
```

### Vercel

Vercel soporta wildcard domains en planes/configuracion adecuados.

Necesario:

```text
Agregar dominio root.
Agregar wildcard domain si esta disponible.
Configurar middleware para host-based routing.
Configurar envs por environment.
```

### Railway / Render / Docker

Requiere:

```text
DNS wildcard hacia load balancer/proxy.
TLS wildcard en proxy o plataforma.
Host header preservado hasta Next.js.
API con CORS para wildcard tenant origins.
```

Docker:

```text
nginx/traefik/caddy como reverse proxy
web container
api container
postgres
redis futuro
```

## 11. Observabilidad

Logs deben incluir:

```text
requestId
tenantId
tenantSlug
userId
route
method
statusCode
durationMs
```

Tracing:

```text
propagar requestId desde frontend/proxy hacia backend
adjuntar tenant context a spans
```

Audit:

```text
tenant-scoped audit events con tenantId
platform events con tenantId nullable cuando aplique
actorUserId siempre que exista
metadata minima y no sensible
```

Metrics:

```text
requests por tenant
errores por tenant
latencia por endpoint
signup approvals
login failures
permission denials
```

Rate limiting:

```text
por IP para public endpoints
por tenant para endpoints autenticados
por user para acciones sensibles
```

## 12. Escalabilidad Futura

### Caching

Cache tenant metadata:

```text
tenant slug -> tenant id/status/branding
```

TTL corto:

```text
30-300 segundos
```

Invalidar cuando:

```text
tenant archived/reactivated
branding updated
slug changed si algun dia se permite
```

### Redis

Usos futuros:

```text
tenant lookup cache
rate limiting
session coordination
background job locks
queues
```

### Queues

Jobs:

```text
send invitation emails
provision tenant resources
audit export
billing sync
document processing
```

### Sharding

Cuando shared DB crezca:

```text
shard por tenantId hash
dedicated DB para tenants enterprise
hybrid model: default shared + enterprise isolated
```

Mantener use cases recibiendo `tenantId` ayuda a migrar despues.

## 13. Plan De Implementacion Por Fases

### Fase 1: Tenant Slug Y Domain Utilities

Objetivo:

```text
Centralizar reglas de slug/subdomain y evitar duplicacion.
```

Tareas:

```text
crear shared util para normalizeTenantSlug
crear reservedSubdomains
crear extractTenantSlug(host, rootDomain)
tests para localhost, lvh.me, staging, production
```

Riesgos:

```text
parsing incorrecto de staging/custom domains
permitir reserved names
```

Validaciones:

```text
slug regex
reserved list
host parsing unit tests
```

Definition of Done:

```text
utilities testeadas
company signup usa mismas reglas
platform approval usa mismas reglas
```

### Fase 2: Next.js Middleware

Objetivo:

```text
Detectar tenant por subdominio y preparar contexto frontend.
```

Tareas:

```text
agregar middleware.ts
leer host
detectar root domain
detectar reserved subdomains
inyectar x-tenant-slug interno
manejar tenant-not-found route placeholder
```

Testing:

```text
unit tests de extractTenantSlug
manual tests con acme.localhost:3000
manual tests con localhost:3000
```

Definition of Done:

```text
root domain sigue cargando public app
tenant subdomain carga tenant app
reserved subdomains no se tratan como tenants
```

### Fase 3: Tenant Context Frontend

Objetivo:

```text
Conectar tenant del subdominio con Redux/RTK sin mezclar datos.
```

Tareas:

```text
integrar con docs/tenant-switch/tenant-switching-state-and-data-isolation-analysis.md
selectedTenantSlug viene del subdominio cuando existe
tenant switch redirige a otro subdominio en production
tenant switch cambia state local en dev si se mantiene mismo host
RTK query keys incluyen tenantSlug
reset/invalidate cache en switch
```

Riesgos:

```text
cache stale
forms editando tenant incorrecto
setTenants pisando tenant seleccionado
```

Definition of Done:

```text
switch de tenant actualiza host o state correctamente
settings recarga datos del tenant correcto
no se puede guardar datos stale del tenant anterior
```

### Fase 4: Backend Tenant Guard Hardening

Objetivo:

```text
Endurecer validacion tenant del backend para subdomain tenancy.
```

Tareas:

```text
validar formato x-tenant-slug
rechazar reserved names
asegurar tenant ACTIVE
asegurar membership ACTIVE
asegurar permissions por tenant
tests para spoofing
```

Testing:

```text
missing x-tenant-slug -> 403/400
invalid slug -> 400
valid slug no membership -> 403
archived tenant -> 403
membership tenant A no sirve para tenant B
```

Definition of Done:

```text
backend no confia en frontend
todos endpoints tenant-scoped quedan protegidos
```

### Fase 5: Auth Resolve Multi-Domain

Objetivo:

```text
Resolver post-login segun root domain o tenant domain.
```

Tareas:

```text
actualizar /auth/resolve
si tenant subdomain: validar acceso a ese tenant
si root domain: resolver ultimo tenant o tenant picker
si platform role: platform console
soportar redirectTo seguro cross-subdomain
```

Riesgos:

```text
open redirects
redirigir a tenant sin acceso
perder sesion entre subdominios
```

Definition of Done:

```text
login desde acme subdomain vuelve a acme
login desde root puede elegir tenant
platform owner llega a platform console
```

### Fase 6: Tenant Not Found Y No Access UX

Objetivo:

```text
Diseñar estados claros para tenant inexistente y acceso denegado.
```

Tareas:

```text
tenant-not-found page
no-access tenant-aware
mostrar switch options si usuario tiene otros tenants
links seguros a root/company signup
```

Definition of Done:

```text
unknown tenant no rompe app
usuario sin access entiende que hacer
```

### Fase 7: Deployment Config

Objetivo:

```text
Preparar staging/production para wildcard subdomains.
```

Tareas:

```text
DNS wildcard
SSL wildcard
CORS wildcard controlado
env ROOT_DOMAIN por environment
documentar Vercel/Railway/Render/Docker
```

Definition of Done:

```text
acme.staging.midominio.com funciona
api CORS acepta staging tenant origins
root domain y tenant domain conviven
```

### Fase 8: Observability And Rate Limiting

Objetivo:

```text
Operar SaaS multi-tenant con visibilidad por tenant.
```

Tareas:

```text
logs con tenantId/userId/requestId
audit events por tenant
rate limiting public signup
metrics por tenant
```

Definition of Done:

```text
se puede investigar una accion por tenant/user
public endpoints no quedan abiertos a abuso
```

## 14. Mejores Practicas

### Errores Comunes

```text
Confiar en tenantSlug del body.
No incluir tenantId en where clauses.
Cachear datos tenant-scoped sin tenantSlug en key.
Usar permissions tenant para platform actions.
Permitir reserved subdomains como tenants.
No probar usuario con multiples tenants.
No manejar archived tenant.
Usar wildcard CORS con credentials.
Redirigir automaticamente a otro tenant sin explicar no-access.
```

### Anti-Patterns

```text
Tenant actual guardado solo en localStorage sin validar contra /me.
JWT como fuente unica de permisos tenant.
Middleware frontend como unica barrera de seguridad.
Endpoints que aceptan tenantId arbitrario desde cliente.
Un solo global cache key para settings/current tenant.
```

### Edge Cases

```text
Usuario tiene 0 tenants y 1 platform role.
Usuario tiene 2 tenants con roles distintos.
Tenant archivado mientras usuario esta logueado.
Slug aprobado pero DNS aun no propaga.
Root domain login con redirectTo tenant subdomain.
Tenant slug igual a reserved subdomain.
Staging con acme.staging.midominio.com.
Custom domain futuro sin subdomain slug visible.
```

### Recomendaciones Enterprise

```text
Auditoria fuerte por tenant.
Rate limits por tenant.
Feature flags por tenant.
Plan/subscription por tenant.
Custom domains como tabla separada TenantDomain.
Preparar migracion futura a tenant isolation premium.
No permitir cambio de slug sin proceso formal.
```

## 15. Resultado Final Esperado

Sistema terminado:

```text
midominio.com muestra public/marketing/company signup.
acme.midominio.com muestra app tenant-scoped de Acme.
globex.midominio.com muestra app tenant-scoped de Globex.
platform.midominio.com muestra consola platform si se decide reservar.
```

Flujo:

```text
request -> host/subdomain -> tenant slug -> frontend tenant context
-> auth session -> API Authorization + x-tenant-slug
-> backend AuthGuard -> TenantGuard -> PermissionsGuard
-> use case con tenantId -> DB filtrada por tenantId -> response
```

Experiencia de usuario:

```text
Cada cliente tiene URL propia.
Login en tenant domain mantiene contexto.
Usuarios multi-tenant pueden cambiar tenant sin mezclar datos.
No-access y tenant-not-found son claros.
Settings y features siempre muestran datos del tenant actual.
```

Seguridad:

```text
El backend valida tenant y membership en cada request tenant-scoped.
No se confia en headers/body sin validacion.
Cookies/JWT se manejan con estrategia clara.
Platform roles estan separados de tenant permissions.
Auditoria registra acciones sensibles.
```

Deployment:

```text
Wildcard DNS y SSL configurados.
Root, tenant y API domains separados.
CORS restringido por environment.
Observability incluye tenantId y userId.
```

Decision final:

```text
Implementar primero tenant switching/data isolation.
Luego implementar subdomain detection y routing.
No avanzar muchas features tenant-scoped nuevas hasta que la cache y el tenant
context esten correctamente aislados.
```

