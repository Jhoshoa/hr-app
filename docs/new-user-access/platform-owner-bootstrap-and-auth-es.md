# Platform Owner, Bootstrap Y Autenticacion

Creado: 13 de mayo de 2026.

## Proposito

Este documento explica como manejar el primer usuario con permisos de plataforma
(`PLATFORM_OWNER`) sin mezclar autenticacion con autorizacion.

La regla principal es:

```text
Supabase Auth autentica a la persona.
La base de datos de la app autoriza lo que esa persona puede hacer.
```

En otras palabras:

```text
Login con Google/email/password = identidad
PlatformUserRole/TenantMembership = permisos
```

## Decision Recomendada

El primer `PLATFORM_OWNER` debe crearse con seed o bootstrap, pero eso no significa que
deba iniciar sesion obligatoriamente con email/password.

Recomendacion:

```text
Desarrollo: seed desde PLATFORM_OWNER_EMAIL.
Testing automatizado: usuarios fake o auth mockeada.
Produccion: script one-time para conceder PLATFORM_OWNER.
Login real: Google, Microsoft, magic link o email/password segun proveedor configurado.
```

Para el caso actual, usar tu correo personal en desarrollo esta bien:

```env
PLATFORM_OWNER_EMAIL=tu-correo-personal@example.com
```

Mas adelante se cambia por otro correo sin cambiar la arquitectura.

## Por Que El Seeder No Necesita Password

El seeder de la app no deberia crear passwords reales.

Si usamos Supabase Auth, las credenciales viven en Supabase, no en la tabla local `User`.
La tabla local `User` solo necesita representar al usuario dentro del dominio de la app.

El seeder debe crear o actualizar datos locales como:

```text
User
PlatformUserRole
Tenant
TenantMembership
CompanySignupRequest
```

Pero no debe asumir que controla el metodo real de login.

Flujo recomendado:

```text
1. Seeder crea User local por email.
2. Seeder asigna PLATFORM_OWNER en PlatformUserRole.
3. La persona inicia sesion con Google usando ese mismo email.
4. Supabase devuelve identidad verificada.
5. Backend vincula esa identidad al User local.
6. Backend permite acceso a rutas /platform por PlatformUserRole.
```

## Desarrollo Local

En desarrollo, el seed puede leer:

```env
PLATFORM_OWNER_EMAIL=tu-correo-personal@example.com
```

Y ejecutar:

```text
upsert User por email
upsert PlatformUserRole con PLATFORM_OWNER
opcional: upsert TenantMembership como owner de assuresoft-demo
```

Ejemplo conceptual:

```text
User.email = PLATFORM_OWNER_EMAIL
User.status = INVITED o ACTIVE
PlatformUserRole.roleKey = PLATFORM_OWNER
```

La membresia opcional a `assuresoft-demo` solo sirve para probar pantallas normales de
tenant con la misma cuenta.

Importante:

```text
PLATFORM_OWNER no viene de TenantMembership.
TenantMembership no da acceso a /platform.
```

## Produccion

En produccion no conviene conceder `PLATFORM_OWNER` automaticamente en cada arranque de
la app.

Eso seria riesgoso porque una variable de entorno mal configurada podria crear o mantener
privilegios altos sin revision humana.

Recomendacion para produccion:

```text
Usar un script one-time o comando CLI seguro.
```

Ejemplo:

```text
pnpm platform:grant-owner --email admin@empresa.com
```

Ese comando debe:

```text
verificar o crear User local por email
asignar PLATFORM_OWNER
ser idempotente
imprimir un resultado verificable
no correr automaticamente en cada boot
```

## Testing Automatizado

Para tests, no deberiamos depender de Google real.

Opciones recomendadas:

```text
mockear Supabase Auth
usar tokens de prueba
crear usuarios locales fake
seedear PlatformUserRole y TenantMembership segun el caso
```

Ejemplo de fixtures:

```text
platform.owner@example.test -> PLATFORM_OWNER
platform.admin@example.test -> PLATFORM_ADMIN
tenant.owner@example.test -> owner de assuresoft-demo
employee@example.test -> employee de assuresoft-demo
```

Estos usuarios de prueba pueden existir solo en la base de datos local o de test. No
necesitan tener cuentas reales de Google.

## Platform Admin No Es Un Tenant

No crear un tenant especial llamado `platform`.

Evitar este modelo:

```text
tenant: platform
tenant role: owner
```

Ese enfoque mezcla permisos globales con permisos de tenant y puede causar errores de
seguridad.

Modelo correcto para permisos globales:

```text
User -> PlatformUserRole
```

Modelo correcto para permisos de empresa/tenant:

```text
User -> TenantMembership -> TenantRole
```

Las rutas internas de plataforma deben revisar:

```text
Supabase identity -> User -> PlatformUserRole
```

Ejemplos:

```text
/platform/company-signups
/platform/tenants
/platform/users
```

Las rutas de una empresa deben revisar:

```text
Supabase identity -> User -> TenantMembership del tenant seleccionado
```

Ejemplos:

```text
/employees
/departments
/payroll
/settings
```

## Company Signup Y Primer Admin

Cuando se aprueba un formulario de company signup, el backend debe crear el usuario local
del primer admin por email, aunque todavia no haya iniciado sesion.

Flujo:

```text
1. Empresa envia company signup.
2. Platform owner/admin aprueba.
3. Backend crea Tenant.
4. Backend crea roles y permisos default.
5. Backend crea o reutiliza User por adminEmail.
6. Backend crea TenantMembership como owner.
7. Admin inicia sesion con Google usando ese email.
8. Backend vincula la identidad de Supabase al User existente.
```

Esto permite aprobar acceso antes de que el usuario exista en Supabase Auth.

Para soportarlo, `User.externalAuthUserId` debe ser nullable:

```prisma
model User {
  id                   String      @id @default(uuid()) @db.Uuid
  email                String      @unique
  name                 String?
  status               UserStatus  @default(INVITED)
  externalAuthProvider String?
  externalAuthUserId   String?     @unique
  createdAt            DateTime    @default(now())
  updatedAt            DateTime    @updatedAt
}
```

## Resolucion De Usuario Al Login

Cuando alguien inicia sesion con Supabase, el backend debe resolver el usuario local asi:

```text
1. Buscar por externalAuthProvider + externalAuthUserId.
2. Si no existe, buscar por email normalizado.
3. Si existe por email y no tiene externalAuthUserId, vincular la identidad de Supabase.
4. Si no existe por identidad ni por email, crear User sin acceso a tenants.
5. Consultar PlatformUserRole para rutas /platform.
6. Consultar TenantMembership para rutas tenant-scoped.
```

Para Google, validar que el email venga verificado por Supabase.

## Resumen Practico

La sugerencia de usar seeders para el primer platform owner es correcta.

Lo que no conviene es hacer que email/password sea obligatorio solo porque el usuario se
crea desde seeders.

La separacion recomendada es:

```text
Seeder/bootstrap = crea autorizacion local por email.
Supabase Auth = autentica a la persona.
PlatformUserRole = permite usar dashboard de plataforma.
TenantMembership = permite usar una empresa/tenant.
```

Para desarrollo:

```text
Usar PLATFORM_OWNER_EMAIL con tu correo personal.
Permitir login con Google.
Seedear datos fake para tenants, usuarios y signups.
```

Para produccion:

```text
Usar script one-time para asignar PLATFORM_OWNER.
No depender de seed automatico permanente.
Permitir el metodo de login aprobado por el producto.
```
