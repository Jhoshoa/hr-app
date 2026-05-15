# Phase 4 Invitation Expiration, Resend And Configuration Notes

Fecha: 2026-05-15

## Objetivo

Documentar los ajustes y decisiones complementarias para la Fase 4 de
invitaciones:

- expiracion de tokens;
- comportamiento de `send` y `resend`;
- validez de invitaciones;
- link de aceptacion;
- campos recomendados para reenvios;
- configuracion futura de expiracion por tenant.

Este documento complementa:

```txt
docs/role-permission-plaanning/tenant-access-rbac-implementation-plan.md
```

## Estado Actual De Fase 4

La Fase 4 ya implementa la base segura de invitaciones:

```txt
TenantInvitation
  email
  tokenHash
  status
  expiresAt
  acceptedAt
  cancelledAt
```

Comportamiento actual:

- Al crear invitacion se genera un token aleatorio.
- En DB se guarda solo `tokenHash`.
- El token en claro se devuelve temporalmente en `acceptanceToken`.
- Se crea/reusa `User`.
- Se crea/reusa `TenantMembership` en estado `INVITED`.
- Se materializan roles iniciales en `TenantMembershipRole`.
- Al aceptar se valida token, email autenticado, status y expiracion.
- Al aceptar se activa el membership.

## Send Y Resend

Actualmente `send` y `resend` no envian correo real porque el proyecto todavia
no tiene email provider integrado.

Por ahora significan:

```txt
send:
  crear invitacion
  generar token
  guardar tokenHash
  setear expiresAt
  devolver acceptanceToken para desarrollo/testing

resend:
  generar nuevo token
  reemplazar tokenHash
  renovar expiresAt
  devolver nuevo acceptanceToken para desarrollo/testing
```

Cuando se integre email provider, `send` y `resend` deberan:

1. Construir link de aceptacion.
2. Renderizar template de email.
3. Enviar correo real.
4. Registrar metadata de envio.
5. Dejar de exponer `acceptanceToken` en produccion.

## Link De Aceptacion

El link recomendado para aceptar invitaciones es:

```txt
https://app.example.com/invitations/accept?token=<acceptanceToken>
```

Flujo esperado:

```txt
1. Admin crea invitacion.
2. Backend genera acceptanceToken.
3. Backend guarda tokenHash.
4. Backend envia email con link.
5. Usuario abre link.
6. Frontend lee token desde query string.
7. Si no hay sesion, redirige a login/signup.
8. Usuario autentica con el mismo email invitado.
9. Frontend llama POST /tenant-invitations/accept con token.
10. Backend hashea token y busca tokenHash.
11. Backend valida:
    status == PENDING
    now < expiresAt
    authenticatedUser.email == invitation.email
12. Backend activa membership y marca invitacion ACCEPTED.
13. Frontend refresca /me y redirige al tenant.
```

El token nunca debe persistirse en localStorage. El frontend debe mantenerlo en
memoria o en la URL solo durante el flujo de aceptacion.

## Expiracion

La recomendacion es mantener `expiresAt`.

Al crear o reenviar:

```txt
expiresAt = now + duration
```

Al aceptar:

```txt
if now >= expiresAt:
  reject
else:
  accept
```

No se necesita cron job para que la seguridad funcione. La validacion se hace
en el momento de aceptar.

Un cron job futuro solo seria util para UX o limpieza:

- marcar invitaciones antiguas como `EXPIRED`;
- limpiar invitaciones viejas;
- enviar recordatorios;
- actualizar metricas.

## No Agregar isValid Boolean

No recomiendo agregar:

```txt
isValid Boolean
```

Razon:

- Duplica estado.
- Puede quedar inconsistente con `status` y `expiresAt`.
- No expresa bien por que una invitacion ya no sirve.

La validez debe derivarse de:

```txt
status == PENDING && now < expiresAt
```

Estados existentes:

```txt
PENDING
ACCEPTED
CANCELLED
EXPIRED
```

Cuando acepta:

```txt
status = ACCEPTED
acceptedAt = now
acceptedByUserId = user.id
```

Cuando cancela:

```txt
status = CANCELLED
cancelledAt = now
```

Cuando intenta aceptar vencida:

```txt
status puede actualizarse a EXPIRED
```

Ese ultimo ajuste mejora la UX porque la UI puede mostrar claramente que la
invitacion expiro sin depender solo de comparar fechas.

## Mejoras Recomendadas Ahora Para Resend

Agregar campos a `TenantInvitation`:

```prisma
resendCount Int       @default(0)
lastSentAt  DateTime?
```

Comportamiento:

```txt
create:
  resendCount = 0
  lastSentAt = now

resend:
  validar status PENDING o EXPIRED
  validar resendCount < maxResends
  generar nuevo token
  reemplazar tokenHash
  renovar expiresAt
  resendCount += 1
  lastSentAt = now
  status = PENDING
```

`resendCount` permite:

- limitar abuso;
- mostrar informacion al admin;
- auditar reenvios;
- aplicar cooldowns futuros.

`lastSentAt` permite:

- mostrar cuando se envio por ultima vez;
- bloquear reenvios demasiado frecuentes;
- diagnosticar problemas de entrega.

No recomiendo guardar todos los tokens anteriores. Al reenviar, el token nuevo
invalida el anterior porque reemplaza `tokenHash`.

## Max Resends

Recomendacion inicial:

```txt
maxResends = 3
```

Este valor puede vivir primero como constante backend.

Mas adelante puede moverse a configuracion:

```txt
TenantAccessSettings.maxInvitationResends
```

Pero no lo haria configurable por admin en la primera UI, salvo que aparezca
una necesidad clara.

## Configuracion Futura De Expiracion Por Tenant

La idea de que el tenant admin configure la expiracion es buena, pero conviene
implementarla despues de tener:

- email provider real;
- UI de Access Settings;
- settings tenant-level consolidados.

Modelo futuro sugerido:

```prisma
enum InvitationExpirationUnit {
  HOUR
  DAY
}

model TenantAccessSettings {
  tenantId                  String @id @db.Uuid
  invitationExpirationValue Int
  invitationExpirationUnit  InvitationExpirationUnit
  maxInvitationResends      Int    @default(3)
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
}
```

Reglas de validacion:

```txt
Si unit = HOUR:
  min = 24
  max = 240

Si unit = DAY:
  min = 1
  max = 10
```

Backend tambien puede validar todo convertido a horas:

```txt
minHours = 24
maxHours = 240
```

Esto evita inconsistencias:

```txt
1 day == 24 hours
10 days == 240 hours
```

## UI Futura Para Configurar Expiracion

En Access Settings o Tenant Settings:

```txt
Invitation expiration
  Unit dropdown:
    Hours
    Days

  Value input:
    if Hours: 24 - 240
    if Days: 1 - 10
```

Validaciones frontend:

- campo requerido;
- numero entero;
- limites segun unidad;
- ayuda visual con fecha estimada de expiracion.

Validaciones backend:

- mismas reglas que frontend;
- nunca confiar solo en UI;
- devolver `VALIDATION_FAILED` si excede limites.

## Email Futuro

Cuando se integre email real, el correo deberia tener:

```txt
Subject:
  You have been invited to <tenantName>

Title:
  Join <tenantName>

Body:
  <inviterName> invited you to access <tenantName>.
  Your invitation expires on <expiresAt>.

Button:
  Accept invitation

Footer:
  If you did not expect this invitation, ignore this email.
```

Datos utiles:

- tenant name;
- inviter name/email;
- role names asignados;
- expiration date;
- support/contact link;
- accept link.

## Recomendacion De Implementacion

Orden recomendado:

1. Mantener `expiresAt` como esta.
2. Agregar `resendCount` y `lastSentAt` a `TenantInvitation`.
3. En `resend`, rotar token, renovar expiracion e incrementar contador.
4. En `accept`, si expiro, marcar `EXPIRED` y rechazar.
5. Mantener `acceptanceToken` solo como salida temporal para dev/testing.
6. Integrar email provider en una subfase posterior.
7. Agregar configuracion tenant-level de expiracion cuando exista UI de
   Settings.

## Decision

Para el estado actual del proyecto:

- Si usar `expiresAt`.
- No usar `isValid`.
- Si agregar `resendCount`.
- Si agregar `lastSentAt`.
- No requerir cron job para seguridad.
- Preparar configuracion futura, pero no bloquear Fase 4 por esa UI.
