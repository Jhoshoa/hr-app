# Phase 5 Access Settings And Invitation UX Implementation Plan

Fecha: 2026-05-15

## Objetivo

Definir la implementacion de UI/UX y ajustes backend necesarios para la Fase 5
del modulo de acceso:

```txt
Settings / Access
  Users
  Roles
  Invitations

Invitation acceptance
  /invitations/accept?token=<acceptanceToken>
```

Este documento complementa:

```txt
docs/role-permission-plaanning/tenant-access-rbac-implementation-plan.md
docs/role-permission-planning/phase-4-invitation-expiration-resend-and-configuration-notes.md
```

La decision principal para Fase 5 es construir una UI operativa real, no una
landing page, y cubrir desde el inicio:

- usuarios con multiples roles;
- permisos efectivos como union de roles;
- roles custom con permission matrix;
- invitaciones con lifecycle completo;
- acceptance flow seguro con sesion Supabase;
- cuenta nueva con email bloqueado y password;
- preparacion para verificacion de email, 2FA, CSV bulk invitations y SSO.

## Estado Backend Disponible

Ya existen endpoints backend para:

```txt
GET  /permissions

GET  /roles
POST /roles
GET  /roles/:roleId
PATCH /roles/:roleId
PUT  /roles/:roleId/permissions
POST /roles/:roleId/archive
POST /roles/:roleId/reactivate

GET  /tenant-users
GET  /tenant-users/:membershipId
PUT  /tenant-users/:membershipId/roles
POST /tenant-users/:membershipId/disable
POST /tenant-users/:membershipId/reactivate

GET  /tenant-invitations
POST /tenant-invitations
POST /tenant-invitations/:invitationId/resend
POST /tenant-invitations/:invitationId/cancel
POST /tenant-invitations/accept
```

Tambien ya existe:

- `TenantMembershipRole`;
- `TenantInvitationRole`;
- `resendCount`;
- `lastSentAt`;
- `expiresAt`;
- token hash;
- audit events;
- multi-role effective permissions;
- backend guards con `users.read`, `users.manage`, `roles.manage`.

## Ajuste Backend Recomendado Antes O Durante Fase 5

Agregar endpoint de preview de invitacion:

```txt
GET /tenant-invitations/preview?token=<acceptanceToken>
```

Este endpoint debe usar `@Public()` o `@SkipTenant()` segun implementacion, pero
no debe aceptar la invitacion ni activar membership.

Respuesta recomendada:

```ts
{
  tenantName: string;
  invitedEmail: string;
  status: "PENDING" | "ACCEPTED" | "CANCELLED" | "EXPIRED";
  expiresAt: string;
}
```

Opcionalmente:

```ts
{
  roles: Array<{ name: string }>
}
```

No devolver:

- permission keys;
- tokenHash;
- userId;
- membershipId;
- internal IDs innecesarios.

Validaciones:

- token existe;
- si `now >= expiresAt`, devolver `EXPIRED` como display status;
- no activar nada;
- no crear usuario;
- no cambiar membership.

Razon:

La pantalla `/invitations/accept` necesita saber a quien fue enviada la
invitacion y a que tenant pertenece antes de decidir si muestra login, signup,
mismatch o accept.

## Estructura De Rutas Frontend

Agregar:

```txt
apps/web/app/(app)/settings/access/page.tsx
apps/web/app/(auth)/invitations/accept/page.tsx
```

Segun el routing actual, la pagina de invitacion debe vivir fuera del layout
tenant-scoped porque el usuario puede no tener tenant activo todavia.

Tambien podria ser:

```txt
apps/web/app/(auth)/invitations/accept/page.tsx
```

para reutilizar layout auth/no tenant.

## Access Settings UI

La vista `/settings/access` debe ser una pantalla operacional con tabs:

```txt
Users | Roles | Invitations
```

No crear una landing page. La primera pantalla ya debe mostrar datos y acciones.

Visibilidad:

```txt
Access page:
  users.read OR users.manage OR roles.manage

Users tab:
  users.read OR users.manage

Roles tab:
  roles.manage

Invitations tab:
  users.read OR users.manage
```

Acciones:

```txt
Users mutations:
  users.manage

Roles mutations:
  roles.manage

Invitation mutations:
  users.manage
```

Backend sigue siendo enforcement real. Frontend solo oculta o deshabilita por
UX.

## Frontend API Layer

Crear:

```txt
apps/web/src/features/access/access-api.ts
apps/web/src/features/access/access-types.ts
apps/web/src/features/access/access-utils.ts
apps/web/src/features/access/access-permissions.ts
apps/web/src/features/access/access-schema.ts
```

Agregar tags en `baseApi`:

```txt
Permission
Role
TenantUser
TenantInvitation
InvitationPreview
CurrentUser
```

Invalidaciones:

```txt
create/update/archive/reactivate role:
  Role
  TenantUser
  CurrentUser

update role permissions:
  Role
  TenantUser
  CurrentUser

update membership roles:
  TenantUser
  CurrentUser

disable/reactivate membership:
  TenantUser
  CurrentUser

create/resend/cancel invitation:
  TenantInvitation
  TenantUser

accept invitation:
  CurrentUser
  TenantUser
  TenantInvitation
```

## Users Tab

### Tabla

Columnas:

```txt
User
Email
Roles
Membership status
Joined
Actions
```

Roles:

- mostrar badges compactos;
- si hay muchos roles, mostrar primeros 2 o 3 y `+N`;
- tooltip/drawer puede mostrar todos.

Acciones:

- edit roles;
- disable;
- reactivate.

Reglas:

- ocultar acciones si no tiene `users.manage`;
- no permitir self-change/self-disable;
- si backend responde 409 por self-change, mostrar mensaje claro;
- no mostrar roles archivados en selectors.

### Drawer De Usuario

Contenido:

```txt
Name
Email
Membership status
Roles multi-select
Effective permissions
Actions
```

El multi-select debe usar roles activos.

Effective permissions:

- mostrar agrupados por modulo;
- read-only;
- calculados desde `effectivePermissions`.

Al guardar:

```http
PUT /tenant-users/:membershipId/roles
{
  "roleIds": ["..."]
}
```

UX:

- toast success;
- toast error;
- invalidar `TenantUser` y `CurrentUser`;
- si se agregan permisos criticos, opcionalmente mostrar confirmacion.

## Roles Tab

### Tabla

Columnas:

```txt
Role
Type
Permissions
Users
Status
Updated
Actions
```

Type:

```txt
System
Custom
```

Acciones:

- create custom role;
- edit role;
- edit permissions;
- clone system role;
- archive/reactivate custom role.

### Permission Matrix

La permission matrix es la forma de habilitar/deshabilitar permisos de cada rol.

Flujo:

```txt
Roles tab
  click role
  open drawer/detail
  edit role metadata
  edit permission matrix
  save
```

UI sugerida:

```txt
Tenant
  [x] tenant.read
  [ ] tenant.manage

Users
  [x] users.read
  [ ] users.manage

Roles
  [ ] roles.manage

Employees
  [x] employees.read
  [ ] employees.manage
  [ ] employees.compensation.read
```

Guardar:

```http
PUT /roles/:roleId/permissions
{
  "permissionIds": ["..."]
}
```

Reglas:

- `owner` read-only;
- system roles read-only o clonables;
- custom roles editables;
- permisos criticos deben mostrar indicador;
- si backend rechaza por policy, mostrar mensaje claro;
- roles archivados no se pueden asignar a usuarios ni invitaciones.

Clone system role:

```txt
Clone Owner/HR Admin/Manager...
  -> create custom role con mismo permission set
  -> user edita nombre/permisos
```

Esto ayuda a admins a partir de templates conocidos sin modificar system roles.

## Invitations Tab

### Tabla

Columnas:

```txt
Email
Roles
Status
Expires
Resends
Last sent
Invited
Actions
```

Status visual:

```txt
PENDING
ACCEPTED
CANCELLED
EXPIRED
```

Display status:

Si backend devuelve `PENDING` pero `expiresAt <= now`, la UI puede mostrarlo
como `EXPIRED` visualmente usando helper:

```ts
getInvitationDisplayStatus(invitation)
```

Esto no reemplaza backend. Backend marca `EXPIRED` al intentar aceptar vencida.

Acciones:

```txt
Invite
Resend
Cancel
```

Reglas:

- `Invite` solo con `users.manage`;
- `Resend` solo para `PENDING` o `EXPIRED`;
- `Cancel` solo para `PENDING` o `EXPIRED`;
- ocultar acciones si no tiene `users.manage`;
- deshabilitar resend si `resendCount >= 3`;
- mostrar `lastSentAt`;
- mostrar `expiresAt`.

### Invite Drawer

Campos:

```txt
Email
Roles multi-select
```

Validaciones frontend:

- email requerido;
- email valido;
- al menos un role;
- roles activos solamente.

Backend valida lo mismo.

Al crear:

```http
POST /tenant-invitations
{
  "email": "ana@company.com",
  "roleIds": ["..."]
}
```

Respuesta temporal:

```ts
{
  acceptanceToken: string
}
```

Mientras no exista email provider real, en development se puede mostrar modal:

```txt
Invitation link generated
https://app.example.com/invitations/accept?token=<acceptanceToken>
```

Precaucion:

- no mostrar este link en produccion;
- cuando exista email provider, enviar correo y no exponer token en UI
  production.

## Invitation Accept Page

Ruta:

```txt
/invitations/accept?token=<acceptanceToken>
```

Esta pagina no debe requerir tenant activo.

### Flujo Base

```txt
1. Leer token de query string.
2. Llamar GET /tenant-invitations/preview?token=...
3. Renderizar tenant, email invitado, expiracion y estado.
4. Revisar sesion Supabase actual.
5. Si hay sesion y email coincide:
   - mostrar Accept invitation o aceptar automaticamente.
6. Si hay sesion y email no coincide:
   - mostrar mismatch.
   - ofrecer sign out.
7. Si no hay sesion:
   - mostrar create account/login options con email bloqueado.
8. Tras crear cuenta/login:
   - llamar POST /tenant-invitations/accept.
9. Si acepta:
   - invalidar /me.
   - redirigir al tenant nuevo o workspace selector.
```

### Sesion Con Otro Usuario

Si el usuario abre el link con una sesion diferente:

```txt
invitation.email = ana@company.com
session.email = other@company.com
```

No se debe aceptar.

UI:

```txt
This invitation was sent to ana@company.com.
You are signed in as other@company.com.
Sign out and continue with the invited email.
```

Acciones:

- Sign out;
- Go back;
- Continue to current workspace.

Backend ya valida email mismatch y responde 409.

### Usuario Nuevo Sin Sesion

No conviene redirigir directamente al login generico como experiencia final,
porque usuarios nuevos pueden no tener password, no usar Google o pertenecer a
empresas con Microsoft/SSO aun no integrado.

La pantalla debe mostrar:

```txt
Email: ana@company.com, locked
Password
Confirm password
Create account and accept invitation
```

Flujo con Supabase email/password:

```txt
1. Usuario ingresa password.
2. Frontend llama supabase.auth.signUp({
     email: invitedEmail,
     password,
     options: {
       emailRedirectTo: /auth/confirm?next=/invitations/accept?token=...
     }
   })
3. Supabase envia email de confirmacion si email confirmation esta activo.
4. Usuario confirma email.
5. /auth/confirm verifica token Supabase.
6. Usuario queda con sesion.
7. Frontend vuelve a /invitations/accept?token=...
8. Frontend llama POST /tenant-invitations/accept.
```

## Email Verification Con Supabase

Supabase Auth puede enviar correos de verificacion. No debemos implementar un
sistema propio de OTP/codigos salvo que exista una razon fuerte.

Supabase maneja:

- email confirmation;
- magic links;
- OTP;
- password reset;
- templates configurables.

Para produccion se recomienda configurar SMTP propio. El servicio default de
Supabase sirve para pruebas y tiene limites bajos.

### Rutas Necesarias

Agregar o revisar:

```txt
/auth/confirm
/invitations/accept
```

`/auth/confirm` debe manejar el callback de Supabase:

```ts
supabase.auth.verifyOtp({
  token_hash,
  type: "email"
})
```

Luego redirigir al `next` preservado:

```txt
/invitations/accept?token=<acceptanceToken>
```

### Dos Tokens Diferentes

No mezclar:

```txt
App invitation token
  nuestro token
  activa TenantInvitation/TenantMembership

Supabase verification token
  token de Supabase
  confirma control del email y crea sesion
```

## Login Options

Fase 5 debe soportar inicialmente:

```txt
Email/password signup con email bloqueado
Login si ya tiene cuenta
Google si esta habilitado y corresponde
```

No asumir que todas las empresas usan Google.

Preparar UI para futuros providers:

```txt
Continue with Microsoft
Continue with SSO
```

pero no mostrar botones no funcionales.

## Seguridad

### No Aceptar Solo Por Token

No se debe activar membership solo con token sin sesion.

Razon:

- el token podria ser reenviado;
- el link podria filtrarse;
- el token se convertiria en credencial completa.

Regla backend:

```txt
authenticatedUser.email == invitation.email
```

### Token Handling

- No guardar token en localStorage.
- No guardar token en DB en claro.
- Guardar solo `tokenHash`.
- En resend, reemplazar tokenHash.
- Token viejo queda invalido automaticamente.
- El token puede estar en URL durante el flujo.
- Despues de aceptar, limpiar URL o redirigir.

### Expiration

Backend debe validar:

```txt
status == PENDING
now < expiresAt
```

Si expiro:

```txt
status = EXPIRED
reject
```

### Resend Abuse

Usar:

```txt
resendCount
lastSentAt
maxResends = 3
```

Futuro:

- cooldown entre resends;
- rate limit por actor;
- audit de delivery errors.

## Riesgos Y Mitigaciones

### Riesgo: UI Asume Un Solo Rol

Mitigacion:

- usar multi-select en Users e Invitations;
- mostrar roles como badges;
- usar `effectivePermissions`.

### Riesgo: Usuario Acepta Con Email Incorrecto

Mitigacion:

- backend valida email match;
- UI muestra mismatch y sign out;
- no aceptar solo por token.

### Riesgo: Invitacion Vencida Parece Activa

Mitigacion:

- helper `getInvitationDisplayStatus`;
- backend marca `EXPIRED` al aceptar vencida;
- mostrar expiresAt claramente.

### Riesgo: Token Expuesto En Produccion

Mitigacion:

- `acceptanceToken` solo para dev/testing;
- cuando haya email provider, no mostrar token en UI production;
- no persistir token en localStorage.

### Riesgo: Roles Archivados En Selectores

Mitigacion:

- selectors usan solo roles `ACTIVE`;
- backend valida roles activos.

### Riesgo: Cambios De Acceso No Refrescan UI

Mitigacion:

- invalidar `CurrentUser`;
- refetch `/me`;
- redirigir si pierde permisos.

### Riesgo: Supabase Email Confirmation Interrumpe Flujo

Mitigacion:

- pantalla "Check your email";
- preservar `next=/invitations/accept?token=...`;
- implementar `/auth/confirm`;
- testear con email confirmation on/off.

## Futuras Extensiones

### 2FA / MFA

Preparar el flujo para que, despues de login/signup:

```txt
if MFA required:
  complete MFA
  then accept invitation
```

No activar membership antes de completar MFA si la politica del tenant lo exige.

Modelo futuro:

```txt
TenantAccessSettings.requireMfaForAdmins
TenantAccessSettings.requireMfaForAllUsers
```

### Bulk Invitations CSV

Futuro:

```txt
Upload CSV
  email, roleKeys
Preview validation
Confirm import
Create invitations in batch
Send emails
Report success/errors
```

Precauciones:

- validar emails duplicados;
- validar roles por tenant;
- partial success report;
- audit batch id;
- rate limit email sending;
- idempotency key para evitar doble import.

### Enterprise SSO / Active Directory / Microsoft Entra ID

Futuro:

Empresas podrian usar sus emails y passwords actuales via:

- Microsoft Entra ID / Azure AD;
- SAML;
- OIDC;
- Google Workspace;
- SCIM provisioning.

La invitacion no deberia crear password local si el tenant requiere SSO.

Flujo futuro:

```txt
Open invitation
Preview tenant
Detect tenant auth policy
Continue with company SSO
Authenticate with IdP
Return with session
Accept invitation
```

Modelo futuro:

```txt
TenantIdentityProvider
  tenantId
  providerType = OIDC | SAML | GOOGLE | MICROSOFT
  enforcedDomains
  status

TenantAccessSettings
  authMode = PASSWORD | SOCIAL | SSO_REQUIRED | MIXED
```

### SCIM / Directory Sync

Futuro:

- crear usuarios automaticamente desde directorio;
- sincronizar status;
- sincronizar grupos a roles;
- desactivar membership cuando el usuario sale de la empresa.

Importante:

No mezclar SCIM groups directamente con permissions sin una capa de mapping:

```txt
ExternalGroup -> Role
```

### Configuracion De Expiracion

Futuro:

```txt
Invitation expiration
  unit = HOURS | DAYS
  value:
    HOURS 24-240
    DAYS 1-10
```

Backend debe validar siempre.

## Orden Recomendado Para Implementar Fase 5

1. `access-types.ts`, `access-api.ts`, `access-utils.ts`.
2. Agregar tags a `baseApi`.
3. Crear `/settings/access` con tabs.
4. Implementar Roles tab y Permission Matrix.
5. Implementar Users tab con multi-role drawer.
6. Implementar Invitations tab con multi-role invite drawer.
7. Agregar backend preview endpoint.
8. Implementar `/invitations/accept`.
9. Revisar/implementar `/auth/confirm` para Supabase email verification.
10. Tests unitarios de helpers.
11. Tests de componentes clave.
12. Typecheck, tests y build.

## Decision Para Fase 5

Implementar ahora:

- Access Settings con tabs;
- roles permission matrix;
- users multi-role assignment;
- invitations multi-role lifecycle;
- invitation accept page;
- preview endpoint;
- signup con email bloqueado usando Supabase email/password;
- manejo de email mismatch;
- preparacion para email verification.

Dejar para futuras fases:

- email provider production;
- SMTP configuration;
- 2FA/MFA;
- bulk CSV invitations;
- SSO/Active Directory;
- SCIM;
- configuracion tenant-level de expiracion.












Lo que sí conviene hacer en Fase 5 no es una refactorización grande, sino ajustes de contrato y una pequeña extensión backend.

  Lo que ya sirve tal como está:

  - GET /permissions: alimenta la Permission Matrix.
  - GET /roles, POST /roles, PATCH /roles/:id, PUT /roles/:id/permissions, archive/reactivate: sirve para la pestaña Roles.
  - GET /tenant-users, PUT /tenant-users/:id/roles, disable/reactivate: sirve para la pestaña Users.
  - GET /tenant-invitations, create/resend/cancel: sirve para la pestaña Invitations.
  - POST /tenant-invitations/accept: sirve para aceptar invitaciones cuando ya existe sesión autenticada y el email coincide.
  - AccessPolicyService, repositories y use cases actuales siguen siendo la capa correcta.

  Lo que sí debemos agregar o ajustar para Fase 5:

  1. Agregar GET /tenant-invitations/preview?token=...

     Esto sí falta. La página /invitations/accept?token=... necesita mostrar tenant, email invitado, status y expiración antes de crear cuenta o aceptar.

     Debe devolver algo mínimo:

     {
       tenantName: string;
       invitedEmail: string;
       status: "PENDING" | "ACCEPTED" | "CANCELLED" | "EXPIRED";
       expiresAt: string;
     }

     No debe devolver tokenHash, IDs internos, permisos ni activar membership.

  2. Actualizar types frontend de /me para multi-role

     Backend ya calcula roles[] y permisos efectivos, pero el frontend todavía tipa TenantSummary con roleKey solamente.

     Conviene mantener roleKey temporalmente por compatibilidad, pero agregar:

     roles: Array<{
       id: string;
       key: string;
       name: string;
       isSystemRole: boolean;
     }>

     Así la UI nueva no depende del rol único.

  3. Revisar permisos de lectura para la pantalla Access

     Hoy:
      - GET /roles requiere roles.manage.
      - GET /permissions requiere roles.manage.
      - GET /tenant-users probablemente requiere users.read.
      - Invitaciones list requiere users.read.

     Si la pantalla /settings/access la vamos a mostrar solo a admins reales, está bien. Pero si permitimos entrar con users.read sin roles.manage, algunas
     pestañas pueden dar 403.

     Mi recomendación para Fase 5: mostrar la página Access si tiene cualquiera de:

     users.read OR users.manage OR roles.manage

     Pero cada tab/action debe cargar solo lo que su permiso permite. Para administrar roles y Permission Matrix, exigir roles.manage.

  4. Decidir si “Clone role” será frontend-only o backend endpoint

     No es obligatorio crear endpoint ahora. Podemos hacerlo simple:
      - UI lee un system role con GET /roles/:id.
      - UI abre drawer con nombre/key nuevo.
      - UI llama POST /roles con los mismos permissionIds.

     Más adelante, si queremos auditoría más explícita, agregamos POST /roles/:id/clone.
  5. Agregar API layer frontend

     Esto no toca backend, pero sí es necesario:
      - access-api.ts
      - access-types.ts
      - access-utils.ts
      - tags: Permission, Role, TenantUser, TenantInvitation, InvitationPreview, CurrentUser.

  Conclusión: no necesitamos rehacer lo anterior. La arquitectura de fases 1-4 sigue funcionando para Fase 5. Los cambios necesarios son puntuales: preview
  endpoint, types multi-role en frontend, permisos/visibilidad por tab, y construir la capa UI/API respetando esos contratos.
