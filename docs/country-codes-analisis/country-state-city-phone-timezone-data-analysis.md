# Country, State, City, Phone And Timezone Data Analysis

Fecha: 2026-05-18

## Objetivo

Analizar si conviene manejar paises, codigos de pais, estados/departamentos,
ciudades, codigos telefonicos y timezones mediante archivos locales JSON/CSV,
APIs externas o una mezcla controlada.

Este analisis toma como base:

```txt
docs/timezone-analisis/timezone-architecture-analysis.md
docs/timezone-analisis/timezone-implementation-phases.md
```

La pregunta no es solo si podemos poner dropdowns. La pregunta correcta es:

```txt
Que datos deben ser autoridad local de la aplicacion, que datos pueden venir de
fuentes externas, y como evitar inputs libres en campos donde hay estandares
claros sin volver pesada la UI?
```

## Resumen Ejecutivo

Recomendacion:

```txt
1. Si, conviene reemplazar country/timezone por dropdowns/comboboxes.
2. Si, conviene reemplazar country code por ISO 3166-1 alpha-2.
3. Si, conviene guardar phone en formato E.164 cuando sea posible.
4. Si, conviene tener metadata local versionada para America.
5. No recomiendo depender de APIs externas en runtime para renderizar forms.
6. No recomiendo cargar todas las ciudades de America en el primer bundle.
7. Estados/departamentos deben ser dropdown dependiente de pais.
8. Ciudades deben ser combobox/typeahead dependiente de pais/subdivision.
9. Timezone debe resolverse desde la capa de timezone ya propuesta.
10. La mejor opcion es un paquete compartido:
    @hr-app/geo
    complementando @hr-app/timezones.
```

Conclusion corta:

```txt
Para paises, subdivisiones, prefijos telefonicos y timezones: datos locales
versionados.

Para ciudades: dataset local curado por America, pero cargado bajo demanda por
pais/subdivision, no en el bundle inicial.

Para APIs externas: usarlas como fuente de actualizacion offline/admin, no como
dependencia directa del formulario principal.
```

## Fuentes Tecnicas Revisadas

Fuentes primarias/oficiales o ampliamente usadas:

```txt
ISO 3166:
https://www.iso.org/iso-3166-country-codes.html

Unicode CLDR Territory/Timezone data:
https://unicode.org/cldr/charts/44/supplemental/territory_containment_un_m_49.html

IANA Time Zone Database:
https://www.iana.org/time-zones

Google libphonenumber:
https://github.com/google/libphonenumber

GeoNames:
https://www.geonames.org/about.html

UN/LOCODE:
https://unece.org/trade/cefact/unlocode-code-list-country-and-territory

REST Countries:
https://restcountries.com/
```

Lectura aplicada:

```txt
ISO 3166 define codigos estandarizados para paises y subdivisiones.
CLDR relaciona territorios con regiones y timezones.
IANA es la referencia para timezones.
libphonenumber es la referencia practica para parsear/formatear/validar numeros.
GeoNames ofrece datos geograficos descargables y webservices.
UN/LOCODE sirve para ubicaciones de comercio/transporte, no necesariamente para
catalogo amigable de ciudades HR.
REST Countries es util para metadata de paises, pero depender de una API publica
en runtime no es ideal para un formulario critico.
```

## Estado Actual En El Codigo

### Company Signup

Archivos:

```txt
apps/web/src/features/company-signup/components/company-signup-page.tsx
apps/web/src/features/company-signup/company-signup-schema.ts
apps/api/src/modules/company-signups/presentation/dto/company-signup-request.dto.ts
packages/database/prisma/schema.prisma
```

Estado actual:

```txt
country:
  - UI usa dropdown hardcodeado.
  - Valor enviado actualmente es nombre humano: "Bolivia", "United States".
  - Schema frontend permite string opcional max 80.
  - Backend permite string opcional max 80.
  - DB guarda String?

timezone:
  - UI usa dropdown hardcodeado.
  - Backend valida @IsTimeZone().

phone:
  - UI usa input libre.
  - Schema frontend solo trim/max 40.
  - Backend solo string/max 40.
  - DB guarda String?
```

Problema:

```txt
CompanySignupRequest.country guarda nombres humanos, mientras Location.country
guarda codigo de pais con default "BO".
```

Eso ya es inconsistencia de modelo.

### Locations

Archivos:

```txt
apps/web/src/features/organization/organization-config.ts
apps/web/src/features/organization/components/organization-settings-page.tsx
apps/api/src/modules/organization/presentation/dto/create-organization-record.dto.ts
packages/database/prisma/schema.prisma
```

Estado actual:

```txt
Location.country:
  - DB: String @default("BO")
  - DTO: @MaxLength(2)
  - UI: input text con placeholder "BO"

Location.city:
  - DB: String?
  - DTO: string max 80
  - UI: input text

Location.timezone:
  - DB: String @default("America/La_Paz")
  - DTO actual no valida @IsTimeZone()
  - UI: input text
```

Problema:

```txt
La DB espera country code ISO alpha-2, pero la UX no guia al usuario.
City es libre, lo cual puede ser aceptable en algunos casos, pero no si se usa
para derivar timezone, reportes o normalizacion.
```

## Principios De Diseno

### 1. Persistir Codigos, Mostrar Nombres

La base debe guardar codigos estables. La UI debe mostrar nombres humanos.

```txt
countryCode: "BO"
countryName: "Bolivia" solo para display derivado
subdivisionCode: "BO-C" o codigo interno normalizado
cityId: opcional si se usa dataset
cityName: "Cochabamba" si se permite texto/combobox
phoneCountryCallingCode: "+591"
phoneE164: "+59170000000"
timezone: "America/La_Paz"
```

No guardar como fuente primaria:

```txt
"Bolivia"
"United States"
"USA"
"EEUU"
"Cochabamba, Bolivia"
```

Motivo:

```txt
Los nombres cambian por idioma, acentos, traducciones y convenciones. Los
codigos ISO/IANA/E.164 son mejores para integraciones y validacion.
```

### 2. Metadata Local Para Formularios Criticos

Formularios como signup, settings y locations no deberian depender de una API
externa para renderizar.

Regla:

```txt
El formulario debe funcionar aunque REST Countries, GeoNames o cualquier API
externa este caida.
```

### 3. APIs Externas Para Actualizacion, No Para Runtime Critico

Las APIs externas pueden servir para:

```txt
generar datasets offline
validar o enriquecer datos en jobs internos
admin tooling
actualizaciones periodicas controladas
```

No deberian ser el camino critico para:

```txt
abrir Company Signup
crear Location
crear Organization Unit
renderizar Employee form
```

### 4. Carga Progresiva

Paises de America son pocos. Subdivisiones son manejables. Ciudades pueden ser
muchas.

Regla:

```txt
Countries/subdivisions/timezones pueden ir en bundle o paquete compartido.
Cities deben cargarse bajo demanda por pais/subdivision.
```

### 5. Timezones No Se Deben Deducir Solo Del Pais

Muchos paises tienen multiples timezones.

Ejemplos:

```txt
US -> America/New_York, America/Chicago, America/Denver, America/Los_Angeles,
      America/Phoenix, etc.
MX -> America/Mexico_City, America/Tijuana, America/Cancun, etc.
BR -> multiples zonas.
CL -> America/Santiago, America/Punta_Arenas, Pacific/Easter.
CA -> multiples zonas.
```

Por eso:

```txt
Pais puede filtrar timezones candidatos.
Ciudad/subdivision puede sugerir timezone.
Pero el timezone operacional de Location debe seguir siendo un campo explicito
validado.
```

## JSON/CSV Local Vs API Externa

### Opcion A: JSON/CSV Local En El Repo

Descripcion:

```txt
Guardar datasets versionados en el repo o en un package local.
```

Pros:

```txt
funciona offline
no depende de uptime externo
rapido para forms
testeable
versionable en git
controla exactamente que paises de America soporta el producto
facil de usar en frontend y backend
evita exponer API keys
reduce latencia
evita rate limits
```

Contras:

```txt
hay que mantenerlo actualizado
puede crecer si se incluyen todas las ciudades
licencias deben revisarse
puede aumentar bundle si se importa mal
requiere pipeline de actualizacion si se quiere precision alta
```

Veredicto:

```txt
Recomendado para paises, codigos telefonicos, timezones por pais y
subdivisiones principales.
Recomendado para ciudades solo si se divide por pais/subdivision y se carga bajo
demanda.
```

### Opcion B: API Externa En Runtime

Descripcion:

```txt
Consultar REST Countries, GeoNames, GeoDB u otra API cada vez que se abre un
formulario o se busca ciudad.
```

Pros:

```txt
datos potencialmente mas actualizados
menos mantenimiento interno inicial
puede ofrecer busqueda grande de ciudades
puede traer metadata enriquecida
```

Contras:

```txt
dependencia de uptime externo
latencia
rate limits
cambios de contrato/API
problemas de privacidad si se envian queries del usuario
necesidad de cache
fallos en signup si el proveedor cae
versionado dificil para reproducir bugs
```

Veredicto:

```txt
No recomendado para el camino critico.
Aceptable solo como fuente secundaria, admin tool o job de sync.
```

### Opcion C: Base Local Generada Desde Fuentes Externas

Descripcion:

```txt
Usar fuentes como ISO/CLDR/GeoNames/libphonenumber para generar archivos locales
versionados.
```

Pros:

```txt
mejor equilibrio entre control y actualizacion
runtime rapido
forms resilientes
permite auditar cambios
se alinea con CI/CD
permite revisar diffs antes de actualizar datos
```

Contras:

```txt
requiere script/pipeline
requiere revisar licencias
requiere decidir frecuencia de updates
```

Veredicto:

```txt
Mejor opcion para la app.
```

## Que Tan Pesado Seria Renderizar Esto?

### Paises

America completa tiene una cantidad pequena de territorios/paises.

Impacto:

```txt
Muy bajo.
Seguro para cargar en bundle.
```

### Codigos Telefonicos

Uno o varios prefijos por pais. Dataset pequeno.

Impacto:

```txt
Muy bajo.
Seguro para cargar en bundle.
```

### Timezones

America tiene decenas de IANA zones, no miles.

Impacto:

```txt
Bajo.
Seguro para cargar en bundle si se centraliza.
```

### Subdivisiones / Estados / Departamentos

Pueden ser cientos en America.

Impacto:

```txt
Bajo a medio.
Seguro si se filtra por pais y se usa memoizacion.
```

### Ciudades

America puede tener miles o decenas de miles de ciudades si se usa GeoNames.

Impacto:

```txt
No se debe cargar todo en el bundle inicial.
```

Estrategia:

```txt
1. No cargar todas las ciudades globales.
2. Dividir por pais: cities/BO.json, cities/US.json, cities/MX.json.
3. Para paises grandes, dividir por subdivision: cities/US-CA.json.
4. Usar dynamic import o endpoint interno con cache.
5. Renderizar con combobox/typeahead, no select gigante.
6. Limitar a ciudades relevantes por poblacion o lista curada para MVP.
```

## Recomendacion De Modelo De Datos

### CompanySignupRequest

Estado actual:

```txt
country String?
phone String?
timezone String?
```

Recomendacion a corto plazo:

```txt
country -> guardar ISO alpha-2, aunque el campo se llame country todavia.
phone -> guardar E.164 cuando sea posible.
timezone -> IANA.
```

Recomendacion a mediano plazo:

```txt
countryCode String? @db.Char(2)
phoneE164 String?
phoneCountryCode String? // ISO alpha-2 usado para parseo, no calling code
timezone String?
```

No recomiendo guardar `countryName` como dato primario. Si se necesita para
auditoria historica, puede guardarse como snapshot adicional:

```txt
countryNameSnapshot String?
```

pero la fuente de verdad debe ser `countryCode`.

### Location

Estado actual:

```txt
country String @default("BO")
city String?
timezone String @default("America/La_Paz")
```

Recomendacion:

```txt
countryCode String @default("BO") // renombrar en mediano plazo
subdivisionCode String?           // ISO 3166-2 o codigo interno
cityName String?
cityGeoNameId String?             // opcional si se usa GeoNames
timezone String
```

Si no se quiere migrar ahora:

```txt
Mantener Location.country, pero tratarlo como countryCode en UI/API.
```

## Package Compartido Recomendado

Crear:

```txt
packages/geo
```

Nombre:

```txt
@hr-app/geo
```

Estructura propuesta:

```txt
packages/geo/
  package.json
  tsconfig.json
  src/
    index.ts
    countries.ts
    country-options.ts
    country-types.ts
    subdivisions.ts
    city-index.ts
    phone.ts
    geo-validation.ts
    geo-resolution.ts
    data/
      america-countries.json
      america-subdivisions.json
      america-country-timezones.json
      america-calling-codes.json
      cities/
        BO.json
        US-CA.json
        US-NY.json
        MX-CMX.json
```

Relaciones con `@hr-app/timezones`:

```txt
@hr-app/timezones:
  valida IANA
  lista timezones soportados
  formatea fechas con timezone
  resuelve timezone efectivo

@hr-app/geo:
  paises
  subdivisiones
  ciudades
  calling codes
  opciones dependientes de pais
  sugerencias de timezone por pais/subdivision/ciudad
```

No mezclar todo en `@hr-app/timezones`. Timezone es una dimension. Geo metadata
es otra.

## Tipos Recomendados

```ts
export type CountryCode = string & { readonly __brand: "CountryCode" };
export type SubdivisionCode = string & { readonly __brand: "SubdivisionCode" };
export type CallingCode = `+${number}`;
export type GeoNameId = string & { readonly __brand: "GeoNameId" };

export interface CountryMetadata {
  readonly code: CountryCode;        // ISO 3166-1 alpha-2
  readonly name: string;
  readonly region: "Americas";
  readonly subregion: "North America" | "Central America" | "Caribbean" | "South America";
  readonly callingCodes: readonly CallingCode[];
  readonly timeZones: readonly string[]; // IANA values validated by @hr-app/timezones
  readonly defaultTimeZone?: string;
  readonly currencyCodes?: readonly string[];
  readonly languages?: readonly string[];
}

export interface SubdivisionMetadata {
  readonly code: SubdivisionCode;    // ideally ISO 3166-2, e.g. US-CA
  readonly countryCode: CountryCode;
  readonly name: string;
  readonly type?: "state" | "department" | "province" | "region" | "district";
  readonly timeZones?: readonly string[];
}

export interface CityMetadata {
  readonly id?: GeoNameId;
  readonly countryCode: CountryCode;
  readonly subdivisionCode?: SubdivisionCode;
  readonly name: string;
  readonly asciiName?: string;
  readonly timeZone?: string;
  readonly population?: number;
}
```

## API Del Package

```ts
getAmericaCountries(): readonly CountryMetadata[];
getCountryByCode(code: string): CountryMetadata | null;
isSupportedCountryCode(value: string): value is CountryCode;

getSubdivisionsByCountry(countryCode: CountryCode): readonly SubdivisionMetadata[];
isSupportedSubdivisionCode(countryCode: CountryCode, value: string): value is SubdivisionCode;

getCountryCallingCodes(countryCode: CountryCode): readonly CallingCode[];
getCountryTimeZones(countryCode: CountryCode): readonly string[];
getDefaultCountryTimeZone(countryCode: CountryCode): string | null;

loadCities(input: {
  readonly countryCode: CountryCode;
  readonly subdivisionCode?: SubdivisionCode;
  readonly query?: string;
  readonly limit?: number;
}): Promise<readonly CityMetadata[]>;
```

## UX Recomendada

### Company Signup

Cambiar:

```txt
Country:
  de opciones hardcodeadas con value "Bolivia"
  a CountrySelect con value "BO"

Timezone:
  usar TimezoneSelect filtrado por pais cuando countryCode exista

Phone:
  usar PhoneInput con selector de pais/calling code
  guardar E.164
```

Flujo:

```txt
1. Usuario selecciona Country = Bolivia (BO).
2. PhoneInput preselecciona +591.
3. TimezoneSelect sugiere America/La_Paz.
4. Usuario puede cambiar timezone si aplica.
5. Submit envia:
   country: "BO"
   timezone: "America/La_Paz"
   phone: "+59170000000"
```

### Locations

Cambiar:

```txt
Country code input -> CountrySelect
City input -> CityCombobox o text input asistido
Timezone input -> TimezoneSelect
```

Flujo:

```txt
1. Tenant timezone default prellena timezone.
2. Usuario selecciona country.
3. App filtra subdivisions y timezones candidatos.
4. Usuario selecciona state/departamento si aplica.
5. Usuario escribe/selecciona city.
6. App sugiere timezone, pero permite elegir explicitamente.
```

### City: Dropdown O Combobox?

No recomiendo dropdown simple para ciudades.

Motivo:

```txt
Las listas de ciudades son grandes.
Un select con cientos/miles de opciones es lento y mala UX.
```

Recomendacion:

```txt
Combobox/typeahead con busqueda.
Permitir texto custom si la ciudad no aparece, pero guardar cityName claro.
Si se elige ciudad del dataset, guardar cityGeoNameId opcional.
```

## Phone Number Strategy

### No Basta Con Un Country Calling Code Dropdown

El prefijo `+1` sirve para multiples paises/territorios. El prefijo no siempre
identifica un pais de forma unica.

Ejemplo:

```txt
US, Canada y varios territorios comparten +1.
```

Por eso:

```txt
PhoneInput debe tener countryCode ISO para parsear y formatear.
Calling code es display/ayuda, no identificador unico.
```

### Guardar E.164

Formato recomendado:

```txt
+59170000000
+14155550100
```

Ventajas:

```txt
estandar para integraciones
facil de comparar
evita formatos locales ambiguos
compatible con SMS/WhatsApp/telefonia
```

### Validacion

Recomendacion:

```txt
Usar libphonenumber o libphonenumber-js.
```

Para frontend:

```txt
libphonenumber-js puede ser mas liviano que google-libphonenumber.
Usar metadata min/mobile segun necesidad.
```

Para backend:

```txt
Validar de nuevo en API.
Normalizar a E.164 antes de persistir.
```

No confiar solo en frontend.

## APIs Y Datasets Evaluados

### ISO 3166

Uso recomendado:

```txt
Fuente conceptual para countryCode y subdivisionCode.
```

Pros:

```txt
estandar internacional
estable
apropiado para codigos de pais y subdivisiones
```

Contras:

```txt
no trae ciudades
los datos oficiales descargables completos pueden requerir proceso/licencia
no resuelve labels UX por idioma por si solo
```

### Unicode CLDR

Uso recomendado:

```txt
Relacionar territorios, regiones, nombres localizados, telephoneCodeData y
timezoneData.
```

Pros:

```txt
muy usado por runtimes/librerias
bueno para internacionalizacion
incluye relacion territory/timezone
```

Contras:

```txt
formato XML/datos requiere transformacion
no es un catalogo de ciudades
```

### IANA tzdb

Uso recomendado:

```txt
Fuente de verdad para timezone IDs.
```

Pros:

```txt
estandar de facto para reglas de zona horaria
compatible con Intl
```

Contras:

```txt
no resuelve pais/ciudad UI completo
```

### libphonenumber

Uso recomendado:

```txt
Validar, parsear y formatear telefonos.
```

Pros:

```txt
metadata especializada
soporta muchos paises/regiones
formato E.164
evita reglas caseras
```

Contras:

```txt
puede aumentar bundle si se usa la version pesada
metadata cambia y hay que actualizar dependencia
```

### GeoNames

Uso recomendado:

```txt
Fuente para ciudades y datos geograficos offline, no API critica de runtime.
```

Pros:

```txt
descargas disponibles
datos amplios
incluye nombres, poblaciones, feature codes
```

Contras:

```txt
dataset grande
calidad variable por pais/fuente
requiere filtrado
licencia requiere attribution
no todas las ciudades son relevantes para un form HR
```

### UN/LOCODE

Uso recomendado:

```txt
No como fuente principal de city dropdown HR.
Puede servir si la app maneja comercio/logistica.
```

Pros:

```txt
estandar de Naciones Unidas para ubicaciones de comercio/transporte
usa ISO country codes
```

Contras:

```txt
no representa todas las ciudades residenciales/oficinas
orientado a trade/transport
puede ser raro para HR
```

### REST Countries

Uso recomendado:

```txt
Fuente auxiliar para generar/validar metadata de paises, no runtime critico.
```

Pros:

```txt
facil de consumir
trae paises, timezones, monedas, idiomas, calling codes
```

Contras:

```txt
API publica externa
uptime/contrato no controlado por la app
no debe bloquear signup
no cubre ciudades/subdivisiones completas como se necesita
```

## JSON Vs CSV

### JSON

Pros:

```txt
nativo para TypeScript/Next/Nest
facil de importar
mantiene estructura jerarquica
ideal para paises, subdivisions, timezones y calling codes
```

Contras:

```txt
diffs grandes si se genera en una sola linea
puede inflar bundle si se importa todo desde un client component
```

### CSV

Pros:

```txt
compacto
bueno para datasets grandes como ciudades
facil de generar desde fuentes externas
```

Contras:

```txt
requiere parser/build step
menos comodo para import directo
tipado mas debil si se lee runtime
```

Recomendacion:

```txt
JSON/TS para metadata pequena y estructurada.
CSV/JSON segmentado generado para ciudades grandes.
```

## Rendimiento En Next.js

Riesgo principal:

```txt
Importar un JSON enorme desde un componente "use client" mete ese dataset en el
bundle del navegador.
```

Mitigacion:

```txt
1. Countries/subdivisions pequenos pueden importarse en client.
2. Cities grandes deben cargarse con dynamic import o via API interna.
3. Usar combobox virtualizado si hay muchas opciones.
4. Filtrar en servidor para datasets grandes.
5. Separar metadata core de city datasets.
```

Patron recomendado:

```txt
CountrySelect:
  importa countries pequenos.

SubdivisionSelect:
  importa subdivisions por pais o filtra lista moderada.

CityCombobox:
  llama endpoint interno /api/geo/cities?country=BO&q=cocha
  o dynamic import de cities/BO.json cuando se selecciona BO.
```

## Validacion Backend

Backend debe ser autoridad final.

Validaciones recomendadas:

```txt
countryCode:
  requerido/opcional segun pantalla
  debe existir en @hr-app/geo supported countries
  almacenar uppercase ISO alpha-2

subdivisionCode:
  si existe, debe pertenecer al countryCode

city:
  si cityId existe, debe pertenecer a country/subdivision
  si cityName libre, trim/max length y no usarlo para inferencias criticas sin
  confirmacion

timezone:
  debe ser IANA valido
  si countryCode existe, puede advertir si timezone no pertenece al pais
  no bloquear todos los casos si hay empleados remotos o casos especiales, salvo
  politica explicita

phone:
  parsear con countryCode
  guardar E.164 si valido
```

## Relacion Country -> Timezone

El pais debe ayudar, pero no reemplazar al timezone.

Reglas:

```txt
1. Country seleccionado filtra timezones candidatos.
2. Si el pais tiene un solo timezone, autoseleccionar.
3. Si el pais tiene varios, sugerir default pero exigir confirmacion/seleccion.
4. City/subdivision puede mejorar la sugerencia.
5. Location.timezone sigue siendo explicito y persistido.
```

Ejemplos:

```txt
BO -> America/La_Paz
CO -> America/Bogota
PE -> America/Lima
US -> multiples; no autodecidir solo por pais
MX -> multiples; no autodecidir solo por pais
BR -> multiples; no autodecidir solo por pais
```

## Riesgos Y Mitigaciones

### Riesgo: Dataset De Ciudades Muy Grande

Mitigacion:

```txt
No cargar todas las ciudades en bundle.
Segmentar por pais/subdivision.
Usar typeahead.
Limitar a ciudades con poblacion minima para MVP.
Permitir cityName custom.
```

### Riesgo: Datos Desactualizados

Mitigacion:

```txt
Versionar datasets.
Crear script de update.
Registrar fuente/version/fecha.
Revisar diff en PR.
```

### Riesgo: Licencias

Mitigacion:

```txt
Revisar licencia antes de copiar datasets.
Preferir fuentes con licencia compatible.
Mantener attribution si se usa GeoNames.
No copiar contenido ISO protegido si no es open data permitido.
```

### Riesgo: APIs Externas Caidas

Mitigacion:

```txt
No depender de APIs externas para render.
Usar APIs externas solo en jobs/admin.
Cachear resultados si se exponen endpoints internos.
```

### Riesgo: Pais Y Telefono No Coinciden

Ejemplo:

```txt
Empresa en Bolivia, admin con telefono de Estados Unidos.
```

Mitigacion:

```txt
No forzar que phone country sea igual a company country.
Preseleccionar, pero permitir cambiar.
Validar numero por el pais seleccionado en PhoneInput.
```

### Riesgo: CountryCode Con Nombre Humano Legacy

Mitigacion:

```txt
Crear migracion/backfill para CompanySignupRequest.country:
  "Bolivia" -> "BO"
  "United States" -> "US"
  etc.
Mientras tanto, crear helper normalizeCountryInput que acepte legacy y devuelva
countryCode.
```

### Riesgo: Timezone Deducido Incorrectamente

Mitigacion:

```txt
Pais/ciudad solo sugieren timezone.
El campo timezone operativo se guarda explicitamente.
```

## Plan De Implementacion Recomendado

### Fase 1: Geo Core

```txt
1. Crear @hr-app/geo.
2. Definir CountryCode, SubdivisionCode, CallingCode.
3. Crear america-countries.json con ISO alpha-2, nombre, calling codes,
   timezones y default timezone.
4. Crear validators puros.
5. Agregar tests.
```

### Fase 2: Company Signup

```txt
1. Reemplazar countryOptions local por CountrySelect.
2. Enviar country como ISO alpha-2.
3. Reemplazar timezoneOptions local por TimezoneSelect filtrado/sugerido por
   pais.
4. Reemplazar phone input libre por PhoneInput.
5. Normalizar phone a E.164.
6. Validar backend country/timezone/phone.
```

### Fase 3: Locations

```txt
1. Cambiar OrganizationFieldConfig para soportar control "country",
   "subdivision", "city", "timezone".
2. CountrySelect para Location.country.
3. SubdivisionSelect opcional.
4. CityCombobox dependiente de country/subdivision.
5. TimezoneSelect con sugerencia por pais/subdivision/ciudad.
```

### Fase 4: Datos De Ciudades

```txt
1. Empezar con ciudades principales por pais de America.
2. Segmentar dataset por pais.
3. Agregar endpoint interno o dynamic import.
4. Permitir cityName custom.
5. Evaluar GeoNames como fuente offline si se necesita cobertura amplia.
```

### Fase 5: Migracion Y Auditoria

```txt
1. Auditar CompanySignupRequest.country legacy.
2. Auditar Location.country no ISO alpha-2.
3. Backfill de valores conocidos.
4. Tests para no volver a guardar nombres como country primario.
```

## Decision Recomendada

La mejor decision para esta app es:

```txt
Crear metadata local versionada para America.
Usar ISO alpha-2 como valor persistido de pais.
Usar ISO 3166-2 o codigo interno para subdivision.
Usar combobox/typeahead para ciudades.
Usar IANA para timezones.
Usar libphonenumber para telefonos y E.164 para persistencia.
No depender de APIs externas en runtime critico.
```

Arquitectura final:

```txt
@hr-app/timezones
  -> IANA, timezone options, validation, formatting, effective timezone

@hr-app/geo
  -> countries, subdivisions, city metadata, calling codes, country/timezone
     suggestions

apps/api/src/common/geo
  -> GeoPolicyService / validation pipes / normalization

apps/web/src/features/geo
  -> CountrySelect, SubdivisionSelect, CityCombobox, PhoneInput
```

Esto mejora UX, reduce datos basura, evita dependencia externa durante signup y
mantiene la app preparada para multi-country/multi-timezone sin cargar datasets
gigantes en el primer render.
