# Geo And Timezone Legacy Data Rollout

Fecha: 2026-05-19

## Objetivo

Cerrar la primera tanda critica antes de construir modulos operativos encima de
country, timezone, location y phone.

El alcance de esta tanda es:

```txt
1. Mantener columnas actuales: country, timezone, phone.
2. Tratar country como ISO 3166-1 alpha-2 aunque el nombre de columna siga igual.
3. Tratar timezone como IANA soportado por el producto.
4. Tratar phone de company signup como E.164 validado por metadata telefonica.
5. Mantener city como texto libre y solo display.
6. No usar city para inferir timezone.
7. Auditar/backfill legacy conocido antes de depender de estos campos.
```

## Politica De Escritura Nueva

Backend sigue siendo la autoridad final.

```txt
Tenant.timezone:
  debe ser un timezone soportado por @hr-app/timezones.

Location.country:
  debe normalizar a country code soportado por @hr-app/geo.

Location.subdivisionCode:
  si existe, debe pertenecer al country.

Location.timezone:
  debe normalizar a timezone soportado por @hr-app/timezones.

CompanySignupRequest.country:
  debe normalizar a country code soportado.

CompanySignupRequest.phone:
  debe persistirse en formato E.164 con calling code y pais soportados.
```

## Phone Validation Reusable

La validacion telefonica vive en `@hr-app/geo`, no dentro de una pantalla.
Esto permite reutilizarla en:

```txt
1. Company signup.
2. Employee profile phone.
3. Emergency contact phone.
4. Futuras pantallas de contactos o usuarios.
```

API compartida:

```txt
parseSupportedPhoneNumber(value, countryCode?)
  retorna:
    e164
    countryCode
    callingCode
    nationalNumber

normalizePhoneNumber(value, countryCode?)
  retorna solo E.164 o null.

isSupportedPhoneNumber(value, countryCode?)
  retorna boolean para schemas/forms.
```

Reglas:

```txt
1. Si el usuario escribe un numero local, se parsea con el countryCode
   seleccionado.
2. Si el usuario escribe un numero internacional con +, se respeta ese pais
   aunque sea distinto al pais de la compania.
3. El pais parseado debe estar soportado por el catalogo de @hr-app/geo.
4. El calling code debe estar soportado.
5. El numero debe ser valido segun libphonenumber-js, no solo cumplir regex.
```

Ejemplos:

```txt
70000000 + BO -> +59170000000
+1 415 555 0100 -> +14155550100
+1 555 0100 -> rechazado aunque +1 sea soportado
+34 600 000 000 -> rechazado porque ES no esta en el catalogo soportado
```

## Backfill Inicial

La migracion de backfill debe ser idempotente y conservadora:

```txt
1. Convertir nombres legacy conocidos a country codes:
   Bolivia -> BO
   United States / USA / EEUU -> US
   Mexico -> MX
   Colombia -> CO
   Peru -> PE
   Argentina -> AR
   Chile -> CL
   Brazil -> BR

2. Uppercase para country codes soportados en CompanySignupRequest y Location.

3. Reemplazar Tenant.timezone no soportado con America/New_York.

4. Reemplazar Location.timezone no soportado con Tenant.timezone si esta
   soportado; si no, America/New_York.

5. Normalizar telefonos simples ya existentes en CompanySignupRequest quitando
   separadores comunes cuando ya tienen calling code soportado.
```

Esta migracion no intenta inferir pais desde city ni reparar telefonos locales
sin country/calling code suficiente. Esos registros deben quedar visibles para
auditoria manual si no pueden normalizarse de forma segura.

## Auditoria Post-Backfill

La auditoria posterior vive en `@hr-app/database` y reutiliza los validadores
de `@hr-app/geo` y `@hr-app/timezones`.

Comando:

```txt
corepack pnpm --filter @hr-app/database audit:geo-timezone
```

Modo estricto para CI o releases:

```txt
corepack pnpm --filter @hr-app/database audit:geo-timezone -- --fail-on-findings
```

El reporte es JSON y separa:

```txt
errors:
  bloquean modulos operativos porque afectan datos fuente obligatorios.

warnings:
  requieren revision manual, pero no necesariamente bloquean operar la app.
```

Cobertura actual:

```txt
Tenant.timezone:
  error si no esta en el catalogo soportado.

Location.country:
  error si no es country code soportado.

Location.timezone:
  error si esta vacio o no soportado.

Location.subdivisionCode:
  warning si no pertenece al country seleccionado.

CompanySignupRequest.country:
  warning si no es country code soportado.

CompanySignupRequest.timezone:
  warning si no esta soportado.

CompanySignupRequest.phone:
  warning si no es un telefono E.164 valido y soportado.
```

## Fuera De Alcance De Esta Tanda

```txt
1. Renombrar columnas a countryCode o phoneE164.
2. Agregar city dataset o cityGeoNameId.
3. Normalizar telefonos de employee profile.
4. Agregar timezone historico en asistencia/vacaciones.
```

## Criterio De Done

```txt
1. Tenant settings no acepta timezones fuera del catalogo soportado.
2. Approve company signup no crea tenants con timezone legacy invalido.
3. Existe migracion de backfill para datos legacy conocidos.
4. Tests unitarios cubren politica de timezone y normalizacion.
5. Typecheck y tests focalizados pasan.
6. API y web arrancan para prueba local.
```

## Implementado En 2026-05-19

```txt
1. Se agrego TimezonePolicyService para validar tenant.timezone contra el
   catalogo soportado.
2. Se agrego migracion de backfill legacy para country/timezone/phone.
3. Se conecto libphonenumber-js en @hr-app/geo.
4. normalizePhoneNumber ahora usa metadata telefonica real.
5. parseSupportedPhoneNumber expone metadata reutilizable para futuros modulos.
6. Company signup backend y frontend consumen la misma API compartida.
7. Tests cubren numeros locales, numeros internacionales validos, calling
   codes soportados pero numeros nacionales invalidos, y paises no soportados.
8. Se agrego auditoria post-backfill en @hr-app/database con reporte JSON y
   modo estricto opcional.
```
