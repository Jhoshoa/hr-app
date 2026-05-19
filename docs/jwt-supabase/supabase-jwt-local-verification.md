# Supabase JWT Local Verification

## Contexto

La API usa Supabase Auth para autenticar usuarios del frontend. El frontend obtiene un access token de Supabase y lo envia a la API en el header:

```http
Authorization: Bearer <access_token>
```

Antes, cada request autenticado pasaba por `SupabaseAuthProvider.verifyAccessToken()` y este llamaba a `supabase.auth.getUser(token)`. Ese flujo es seguro porque Supabase Auth confirma el token contra su servidor, pero tiene un costo operativo: `getUser()` hace un request de red al Auth server de Supabase. Si la red local, DNS, Supabase Auth o la conexion externa estan lentos, cada endpoint autenticado de la API hereda esa latencia.

Durante el diagnostico local se observo:

- `GET /api/v1/health` respondia rapido, aproximadamente 60-80 ms.
- `GET /api/v1/me` sin token respondia rapido con `401`.
- Las rutas autenticadas podian tardar cerca de 29 segundos desde el frontend.
- La llamada remota a Supabase Auth desde el entorno local fallo por conexion.

La primera implementacion local asumio tokens `HS256` firmados con `SUPABASE_JWT_SECRET`. Despues se confirmo que el proyecto real de Supabase emite access tokens con:

- `alg=ES256`
- `kid=<signing-key-id>`

Por eso el verificador se actualizo para soportar JWKS, que es el camino correcto para tokens asimetricos.

## Estado Actual

Archivo principal:

- `apps/api/src/modules/identity/infrastructure/providers/supabase-auth.provider.ts`

Tests:

- `apps/api/src/modules/identity/tests/unit/supabase-auth.provider.spec.ts`

El provider actual soporta dos caminos:

1. `ES256` y `RS256` usando Supabase JWKS.
2. `HS256` usando `SUPABASE_JWT_SECRET` como compatibilidad legacy.

El camino principal para este proyecto es `ES256` con JWKS.

## Flujo Actual

1. `AuthGuard` extrae el bearer token del header `Authorization`.
2. `SupabaseAuthProvider.verifyAccessToken()` separa el JWT en header, payload y signature.
3. El provider valida el algoritmo:
   - `ES256` o `RS256`: busca la public key en `https://<project>.supabase.co/auth/v1/.well-known/jwks.json`.
   - `HS256`: valida HMAC SHA-256 usando `SUPABASE_JWT_SECRET`.
   - cualquier otro algoritmo falla cerrado con `401`.
4. Para JWKS:
   - exige `kid`;
   - descarga/cacha las keys por 10 minutos;
   - busca una key cuyo `kid` coincida;
   - valida firma con la public key;
   - para `ES256` usa encoding `ieee-p1363`, que coincide con la firma compacta del JWT.
5. Para claims:
   - valida expiracion `exp`;
   - valida `nbf` si existe;
   - exige `sub`;
   - exige `email`;
   - reconoce email verificado desde `email_verified`, `email_confirmed_at`, `confirmed_at` o `user_metadata.email_verified`.
6. `ResolveAuthenticatedUserUseCase` resuelve el usuario interno y sus roles desde la base local.
7. Tenant, permisos y platform roles siguen saliendo de nuestra base de datos, no del JWT.

Las operaciones administrativas siguen usando Supabase remoto:

- `getExternalUser()`
- `inviteUser()`
- `disableUser()`

Eso es correcto porque esas operaciones necesitan estado administrativo real.

## Validacion Real

Se valido con un token real de Supabase para `demo.owner@example.test`:

- Login Supabase: `200`
- JWT real: `alg=ES256`
- `GET /api/v1/me`: `200`
- Latencia de `/me`: aproximadamente 145 ms

Tambien se valido:

- API test completo: 45 test suites, 128 tests pasando.
- API typecheck: OK.
- API build: OK.

## Beneficios

- Evita llamar a Supabase Auth remoto por cada request autenticado.
- Reduce latencia y dependencia de red externa.
- Sigue alineado con Supabase Signing Keys/JWKS para tokens asimetricos.
- Permite rotacion de keys sin redeploy inmediato mientras JWKS exponga la key vigente.
- Mantiene permisos y tenant access bajo control de nuestra DB.

## Riesgos y Mitigaciones

### 1. Revocacion no inmediata

La validacion local confirma firma y expiracion, pero no consulta Supabase Auth en cada request. Si una sesion se revoca, un usuario cierra sesion, o Supabase invalida una sesion, la API podria aceptar el access token hasta que expire.

Mitigaciones:

- Configurar access tokens de corta duracion.
- Mantener refresh token gestionado por Supabase en frontend.
- Para endpoints criticos, hacer validacion remota puntual o revisar una denylist local.
- Validar estado interno del usuario en DB si agregamos `User.status` como bloqueo efectivo.
- Considerar version de sesion/token por usuario si se requiere revocacion inmediata.

### 2. JWKS cacheado

El provider cachea JWKS por 10 minutos. Esto mejora performance, pero durante una rotacion/revocacion de key puede existir una ventana donde la API conserve keys antiguas.

Mitigaciones:

- Mantener TTL corto y documentado.
- Agregar mecanismo para purgar cache en runtime si hacemos rotacion de keys.
- En errores de `kid` no encontrado, reintentar una vez refrescando JWKS antes de responder `401`.
- Monitorear `401` por causa para detectar rotaciones incompletas.

### 3. Disponibilidad de JWKS en cold start

El primer request con una key no cacheada necesita descargar JWKS. Si Supabase JWKS no responde, la API no puede verificar tokens `ES256` nuevos.

Mitigaciones:

- Cachear JWKS en memoria.
- Agregar prewarm al boot de la API.
- Reusar cache existente si el refresh falla y todavia no expiró de forma critica.
- Agregar timeout explicito al fetch de JWKS.

### 4. Claims stale

Claims como `email` y metadata vienen del token. Si el usuario cambia email o metadata en Supabase, el token viejo puede contener datos anteriores hasta expirar.

Mitigaciones:

- Usar claims solo para identidad base.
- Usar nuestra DB como fuente de verdad para roles, permisos, tenant access y estado interno.
- Evitar que metadata del token sobrescriba datos internos sensibles sin reglas claras.

### 5. Email verified en metadata

El token real de desarrollo trae `user_metadata.email_verified: true`, no `email_verified` en root. El provider lo reconoce porque el JWT esta firmado y la metadata no puede alterarse sin invalidar la firma.

Mitigaciones:

- Mantener tests para esta variante.
- Revisar claims reales en staging/production antes de cambiar reglas de verificacion.
- Preferir claims estandar si Supabase los expone en root en el futuro.

### 6. Compatibilidad HS256 legacy

El provider conserva soporte `HS256` con `SUPABASE_JWT_SECRET`. Esto ayuda en entornos legacy, pero aumenta superficie de soporte.

Mitigaciones:

- Mantener `HS256` solo mientras sea necesario.
- Documentar que el camino principal del proyecto es JWKS/ES256.
- Remover `HS256` si todos los ambientes usan signing keys asimetricas.

### 7. Implementacion criptografica propia

El codigo usa primitivas nativas de Node para validar firmas. Es pequeno y testeado, pero sigue siendo logica sensible.

Mitigaciones:

- Migrar a una libreria especializada como `jose`.
- Mantener pruebas para algoritmos, expiracion, `nbf`, `kid`, payload invalido y firma invalida.
- Evitar aceptar algoritmos no esperados.

## Recomendaciones Futuras

### Fase 1: Endurecer tests

Agregar tests para:

- token sin `sub`;
- token sin `email`;
- token con `alg` no permitido;
- token `ES256` sin `kid`;
- token con `kid` no encontrado;
- token con JWKS endpoint caido;
- token con `nbf` futuro;
- token con payload JSON invalido;
- token con firma invalida en `ES256`;
- token con `user_metadata.email_verified`;
- token con `email_confirmed_at` y `confirmed_at`.

### Fase 2: Mejorar JWKS cache

Implementar:

- refresh forzado si no se encuentra `kid`;
- timeout con `AbortController`;
- metricas de cache hit/miss;
- log estructurado cuando JWKS falla;
- metodo interno para limpiar cache durante rotacion.

### Fase 3: Migrar a `jose`

Reemplazar la validacion manual por `jose`.

Beneficios:

- Menos codigo criptografico propio.
- Mejor manejo de JWKS remoto.
- Mejor soporte para `kid`, `alg`, cache y rotacion.
- API estandar para validacion de claims.

### Fase 4: Revocacion fuerte

Si el producto requiere revocacion inmediata:

- agregar denylist local de sesiones/tokens;
- guardar `sessionVersion` o `tokenVersion` por usuario;
- validar `User.status` en cada request;
- invalidar sesiones cuando un usuario sea deshabilitado;
- usar validacion remota puntual para acciones de alto riesgo.

### Fase 5: Observabilidad de auth

Agregar metricas:

- tiempo de `verifyAccessToken`;
- tiempo de JWKS fetch;
- cache hit/miss de JWKS;
- cantidad de `401` por razon;
- tokens expirados;
- firmas invalidas;
- `kid` no encontrado;
- tiempo de resolucion de usuario interno;
- tiempo de resolucion de tenant.

Esto ayudaria a detectar regresiones antes de que el frontend vuelva a mostrar errores genericos como "Could not load your workspace".

### Fase 6: Mejor UX de errores en frontend

El mensaje actual del frontend no distingue entre:

- API caida;
- token invalido;
- usuario sin tenant;
- usuario pendiente de enlace;
- falta de permisos;
- timeout.

Recomendacion:

- mapear `401` a re-login;
- mapear `403` a no-access;
- mostrar error tecnico solo para `5xx` o network failure;
- registrar detalles en consola/dev tools sin exponer informacion sensible al usuario final.

## Referencias

- Supabase `getUser()` hace network request al Auth server: https://supabase.com/docs/reference/javascript/auth-getuser
- Supabase JWT guide: https://supabase.com/docs/guides/auth/jwts
- Supabase JWT signing keys y JWKS: https://supabase.com/docs/guides/auth/signing-keys
- Supabase `getClaims()` y JWKS cacheado: https://supabase.com/docs/reference/javascript/auth-getclaims
