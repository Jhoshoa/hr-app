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
4. Tratar phone de company signup como E.164 cuando sea posible.
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
  debe persistirse en formato E.164-like con calling code soportado.
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

## Fuera De Alcance De Esta Tanda

```txt
1. Renombrar columnas a countryCode o phoneE164.
2. Agregar city dataset o cityGeoNameId.
3. Validar phone con libphonenumber-js.
4. Normalizar telefonos de employee profile.
5. Agregar timezone historico en asistencia/vacaciones.
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
