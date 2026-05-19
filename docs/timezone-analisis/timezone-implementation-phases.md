# Timezone Implementation Phases

Fecha: 2026-05-18

## Objetivo

Definir un plan de implementacion por fases para convertir el manejo de
timezones en una capa consistente, reusable y segura en la aplicacion.

Este documento complementa:

```txt
docs/timezone-analisis/timezone-architecture-analysis.md
```

La meta no es solamente cambiar inputs por dropdowns. La meta es crear una capa
central de timezone que:

```txt
1. Valide valores IANA de forma consistente.
2. Evite listas hardcodeadas por pantalla.
3. Resuelva el timezone efectivo sin repetir if/else en cada modulo.
4. Separe almacenamiento UTC de interpretacion local.
5. Prepare la app para asistencia, vacaciones, horarios, reportes y payroll.
```

## Fuentes Tecnicas Usadas

Fuentes consultadas para no basar el plan en suposiciones:

```txt
IANA Time Zone Database:
https://www.iana.org/time-zones

IANA tz theory:
https://data.iana.org/time-zones/theory.html

MDN Intl.supportedValuesOf:
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/supportedValuesOf
```

Resumen aplicado:

```txt
1. La fuente conceptual correcta son IDs IANA/tzdb, por ejemplo
   America/La_Paz.
2. Los offsets fijos y abreviaciones no son suficiente para reglas civiles de
   tiempo.
3. JavaScript moderno puede exponer timezones soportados por el runtime con
   Intl.supportedValuesOf("timeZone").
4. La aplicacion debe tratar la lista del runtime como soporte tecnico, no como
   unica decision de producto.
```

## Estado Actual Detectado

### Backend

```txt
Tenant.timezone
  packages/database/prisma/schema.prisma
  apps/api/src/modules/tenants/presentation/dto/update-current-tenant.dto.ts

Estado:
  - Existe.
  - Tenia default America/La_Paz.
  - Default actualizado para USA-first: America/New_York.
  - UpdateCurrentTenantDto usa @IsTimeZone().
```

```txt
Location.timezone
  packages/database/prisma/schema.prisma
  apps/api/src/modules/organization/presentation/dto/create-organization-record.dto.ts
  apps/api/src/modules/organization/infrastructure/persistence/prisma-organization.repository.ts

Estado:
  - Existe.
  - Tenia default America/La_Paz.
  - Default actualizado para USA-first: America/New_York.
  - DTO solo valida string/maxLength.
  - Repository crea location con input.timezone ?? "America/La_Paz".
```

Riesgo actual:

```txt
Una location puede guardar cualquier texto como timezone.
Una location de un tenant configurado en otra zona puede heredar America/La_Paz
por error silencioso.
```

### Frontend

```txt
Company Settings
  apps/web/src/features/tenants/components/company-settings-page.tsx

Estado:
  - Usa dropdown.
  - Lista hardcodeada dentro del componente.
```

```txt
Organization Locations
  apps/web/src/features/organization/organization-config.ts
  apps/web/src/features/organization/components/organization-settings-page.tsx

Estado:
  - Timezone se modela como field generico.
  - El drawer renderiza todos los fields como Input text.
```

```txt
Organization Units primary location
  apps/web/src/features/organization/components/organization-units-panel.tsx

Estado:
  - Permite crear una location primaria inline.
  - Usa primaryLocationTimezone como texto.
  - Default actual: America/New_York.
```

Riesgo actual:

```txt
La UI se ve inconsistente y permite datos que despues no sirven para calculos.
```

## Decision De Diseno

La implementacion debe tener dos capas:

```txt
1. Timezone Core
   Reglas puras, listas, tipos, validacion y formateo.

2. Timezone Application Layer
   Resolucion de timezone efectivo usando tenant, location, empleado o usuario.
```

La razon para separar ambas:

```txt
Timezone Core no debe depender de Prisma, NestJS, React ni Redux.
Timezone Application Layer si puede depender de repositories, use cases y data
del tenant actual.
```

Esto evita duplicar condiciones como:

```txt
employee.timezone ?? employee.location.timezone ?? tenant.timezone ?? "UTC"
```

en cada modulo.

## Ubicacion Recomendada

El repo tiene `packages/utils` y `packages/types`, pero hoy estan vacios y sin
`package.json`. Como API y Web necesitan la misma fuente de verdad, recomiendo
crear un paquete especifico:

```txt
packages/timezones
```

Estructura propuesta:

```txt
packages/timezones/
  package.json
  tsconfig.json
  src/
    index.ts
    constants.ts
    iana-timezone.ts
    supported-timezones.ts
    timezone-labels.ts
    timezone-format.ts
    timezone-resolution.ts
    timezone.test.ts
```

Nombre del paquete:

```txt
@hr-app/timezones
```

Uso esperado:

```txt
apps/api -> @hr-app/timezones
apps/web -> @hr-app/timezones
```

Alternativa aceptable si se quiere evitar un paquete nuevo al inicio:

```txt
Duplicar temporalmente una utilidad minima en api/web, pero solo por una fase
corta y con ticket explicito de convergencia.
```

No recomiendo esa alternativa porque el problema actual viene precisamente de
duplicar decisiones.

## API Del Timezone Core

### Tipos

Usar tipos branded para evitar pasar cualquier string como timezone dentro de
codigo critico.

```ts
export type IanaTimeZone = string & { readonly __brand: "IanaTimeZone" };

export type TimeZoneRegion = "America" | "UTC";

export interface TimeZoneOption {
  readonly value: IanaTimeZone;
  readonly label: string;
  readonly region: TimeZoneRegion;
  readonly countryCodes?: readonly string[];
}
```

Beneficio:

```txt
El borde del sistema recibe string.
El dominio trabaja con IanaTimeZone cuando ya fue validado.
```

### Constantes

```ts
export const DEFAULT_TIME_ZONE = "America/New_York" as IanaTimeZone;
export const FALLBACK_TECHNICAL_TIME_ZONE = "UTC" as IanaTimeZone;
export const SUPPORTED_TIME_ZONE_REGION = "America";
```

### Validacion

API recomendada:

```ts
export function isIanaTimeZone(value: string): value is IanaTimeZone;
export function assertIanaTimeZone(value: string): asserts value is IanaTimeZone;
export function parseIanaTimeZone(value: unknown): IanaTimeZone | null;
export function isSupportedProductTimeZone(value: string): value is IanaTimeZone;
```

Regla:

```txt
isIanaTimeZone:
  Valida que el runtime pueda usar ese timezone con Intl.DateTimeFormat.

isSupportedProductTimeZone:
  Valida que el timezone este dentro del alcance de producto actual, por
  ejemplo America/* y opcionalmente UTC.
```

Implementacion conceptual:

```ts
export function isIanaTimeZone(value: string): value is IanaTimeZone {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}
```

Nota:

```txt
Intl.DateTimeFormat valida soporte del runtime. Para listas de seleccion se
puede usar Intl.supportedValuesOf("timeZone") cuando este disponible.
```

### Lista De Opciones

API recomendada:

```ts
export function getSupportedTimeZoneOptions(input?: {
  readonly region?: "America";
  readonly includeUtc?: boolean;
}): readonly TimeZoneOption[];
```

La lista debe estar centralizada. Para el primer alcance:

```txt
Mostrar America/* en UI.
Permitir UTC solo donde tenga sentido tecnico o de integracion.
No mostrar offsets fijos.
No mostrar abreviaciones.
```

### Labels

No mostrar solamente:

```txt
America/La_Paz
```

Mejor:

```txt
La Paz (America/La_Paz)
New York (America/New_York)
Mexico City (America/Mexico_City)
```

Pero el valor guardado siempre debe ser el ID IANA:

```txt
America/La_Paz
```

## Timezone Application Layer Backend

Crear una capa en API, no en cada use case.

Ubicacion recomendada:

```txt
apps/api/src/common/timezones/
  timezone.module.ts
  timezone-policy.service.ts
  timezone-resolution.service.ts
  timezone-validation.pipe.ts
  timezone-resolution.service.spec.ts
```

### TimezonePolicyService

Responsabilidad:

```txt
Decidir si un timezone es valido para el producto actual.
```

API:

```ts
@Injectable()
export class TimezonePolicyService {
  isAllowed(value: string): boolean;
  assertAllowed(value: string): IanaTimeZone;
  getDefault(): IanaTimeZone;
}
```

Uso:

```txt
DTO/class-validator filtra inputs basicos.
TimezonePolicyService aplica politica de producto y mensajes consistentes.
```

### TimezoneResolutionService

Responsabilidad:

```txt
Resolver timezone efectivo para casos de negocio.
```

API inicial recomendada:

```ts
export interface TenantTimezoneSource {
  readonly timezone?: string | null;
}

export interface LocationTimezoneSource {
  readonly timezone?: string | null;
}

export interface EmployeeTimezoneSource {
  readonly timezone?: string | null;
  readonly currentLocation?: LocationTimezoneSource | null;
}

@Injectable()
export class TimezoneResolutionService {
  resolveTenantDefault(tenant: TenantTimezoneSource): IanaTimeZone;

  resolveLocationOperational(input: {
    readonly tenant: TenantTimezoneSource;
    readonly location?: LocationTimezoneSource | null;
  }): IanaTimeZone;

  resolveEmployeeOperational(input: {
    readonly tenant: TenantTimezoneSource;
    readonly employee?: EmployeeTimezoneSource | null;
  }): IanaTimeZone;

  resolveDisplay(input: {
    readonly tenant: TenantTimezoneSource;
    readonly userTimezone?: string | null;
    readonly contextLocation?: LocationTimezoneSource | null;
  }): IanaTimeZone;
}
```

Prioridad recomendada:

```txt
Employee operational:
  employee.timezone futuro
  -> current assignment location timezone
  -> tenant timezone
  -> UTC fallback tecnico

Location operational:
  location.timezone
  -> tenant timezone
  -> UTC fallback tecnico

Display:
  user timezone futuro
  -> context location timezone si la vista es location-specific
  -> tenant timezone
  -> UTC fallback tecnico
```

Importante:

```txt
El servicio debe normalizar y validar. Los use cases no deben repetir fallback.
```

## Timezone Frontend Layer

Ubicacion recomendada:

```txt
apps/web/src/features/timezones/
  components/timezone-select.tsx
  timezone-form-schema.ts
  timezone-hooks.ts
  timezone-format.ts
```

### TimezoneSelect

Componente reusable:

```ts
interface TimezoneSelectProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
  readonly includeUtc?: boolean;
  readonly region?: "America";
  readonly id?: string;
  readonly "aria-invalid"?: boolean;
}
```

Uso:

```txt
Company Settings
Locations drawer
Organization Units create primary location
Company signup si aplica
Futuras preferencias de usuario/empleado
```

### Formatting Helper

Reemplazar usos directos dispersos de:

```ts
new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(...)
```

por:

```ts
formatDateInTimeZone(value, {
  locale,
  timeZone,
  dateStyle: "medium",
  timeStyle: "short"
})
```

Regla:

```txt
Si el dato es operativo, el caller debe pasar timezone explicito.
Si el dato es tecnico/display general, usar display timezone resuelto.
```

## Fase 0: Baseline Y Pruebas De Seguridad

Objetivo:

```txt
Congelar el comportamiento actual antes de tocar UI y validacion.
```

Tareas:

```txt
1. Agregar tests que documenten que Tenant.timezone acepta IANA validos.
2. Agregar tests que hoy fallarian para Location.timezone invalido.
3. Inventariar todos los campos DateTime que son fechas puras vs instantes.
4. Inventariar todos los Intl.DateTimeFormat sin timezone explicito.
5. Documentar seeds actuales con America/La_Paz y America/New_York.
```

Riesgos:

```txt
Tests nuevos pueden exponer deuda existente.
Puede aparecer ambiguedad sobre campos DateTime actuales.
```

Mitigaciones:

```txt
No migrar schema en esta fase.
Clasificar campos como "instant", "local date" o "unknown".
Convertir hallazgos en TODOs priorizados.
```

Exit criteria:

```txt
Hay lista clara de puntos de uso y pruebas que protegen el cambio siguiente.
```

## Fase 1: Timezone Core Compartido

Objetivo:

```txt
Crear una fuente de verdad reusable para timezones.
```

Tareas:

```txt
1. Crear package @hr-app/timezones.
2. Exportar DEFAULT_TIME_ZONE y FALLBACK_TECHNICAL_TIME_ZONE.
3. Exportar tipo IanaTimeZone.
4. Implementar isIanaTimeZone/parseIanaTimeZone/assertIanaTimeZone.
5. Implementar getSupportedTimeZoneOptions({ region: "America" }).
6. Agregar tests unitarios del paquete.
7. Conectar package.json de api/web al nuevo paquete.
```

Riesgos:

```txt
Intl.supportedValuesOf puede no estar disponible en todos los runtimes.
Node/browser pueden tener diferencias de ICU/tzdata.
Un paquete nuevo puede requerir ajustes de build/turbo/tsconfig.
```

Mitigaciones:

```txt
1. Usar fallback estatico curado para America si Intl.supportedValuesOf no
   existe.
2. Validar cada opcion con Intl.DateTimeFormat antes de exponerla.
3. Mantener el paquete sin dependencias runtime al inicio.
4. Agregar tests en api y web para import del paquete.
```

Exit criteria:

```txt
API y Web pueden importar la misma lista y la misma validacion.
```

## Fase 2: Validacion Backend Centralizada

Objetivo:

```txt
Evitar que entren timezones invalidos por API.
```

Tareas:

```txt
1. Agregar @IsTimeZone() a CreateLocationDto.timezone.
2. Agregar @IsTimeZone() a UpdateLocationDto via PartialType.
3. Decidir politica:
   - IANA global valido, o
   - IANA valido + soportado por America.
4. Crear TimezonePolicyService si la politica excede @IsTimeZone().
5. Usar BadRequestException con mensaje consistente.
6. Agregar tests DTO/use case para invalid timezone.
```

Recomendacion concreta:

```txt
Backend debe validar IANA real siempre.
Para restriccion de producto America-only, usar TimezonePolicyService, no una
lista local en cada DTO.
```

Riesgos:

```txt
Registros existentes invalidos podrian quedar en base.
Clientes/API externos podrian estar enviando valores no IANA.
@IsTimeZone() valida formato soportado, pero no necesariamente politica de
producto.
```

Mitigaciones:

```txt
1. Script/query de auditoria para Location.timezone existentes.
2. Migracion manual o seed correction antes de activar restriccion fuerte.
3. Mensajes de error claros con ejemplo America/La_Paz.
4. Mantener politica centralizada y testeada.
```

Exit criteria:

```txt
No se puede crear ni actualizar una location con timezone invalido.
```

## Fase 3: Defaults Correctos En Backend

Objetivo:

```txt
Eliminar fallbacks fijos incorrectos al crear locations.
```

Problema actual:

```txt
PrismaOrganizationRepository.create usa:
timezone: input.timezone ?? "America/La_Paz"
```

Decision recomendada:

```txt
El default de Location.timezone debe ser Tenant.timezone.
```

Tareas:

```txt
1. Extender OrganizationRepository o use case para obtener tenant timezone.
2. Preferir resolver default en CreateOrganizationRecordUseCase.
3. Pasar timezone explicito al repository cuando kind === "location".
4. Dejar repository como persistencia simple, no como policy engine.
5. Agregar test: tenant America/New_York crea location sin timezone y queda
   America/New_York.
```

Diseno recomendado:

```txt
CreateOrganizationRecordUseCase
  - recibe tenantId
  - si kind === location:
      timezone = input.timezone ?? timezoneResolution.resolveTenantDefault(...)
  - llama repository.create con timezone ya resuelto
```

Riesgos:

```txt
OrganizationModule no importa TenantsModule actualmente.
Inyectar TenantsRepository puede crear dependencia cruzada si no se cuida.
```

Mitigaciones:

```txt
1. Exportar solo el repository/port necesario desde TenantsModule si ya existe.
2. Evitar importar OrganizationModule dentro de TenantsModule.
3. Si aparece ciclo, crear un CommonTenantSettingsReader port en common.
4. Mantener la resolucion en application layer, no en Prisma repository.
```

Exit criteria:

```txt
Ninguna location nueva cae a America/La_Paz salvo que ese sea el timezone del
tenant o fallback tecnico explicito.
```

## Fase 4: UI Reusable Y Sin Text Inputs

Objetivo:

```txt
Eliminar captura libre de timezones en frontend.
```

Tareas:

```txt
1. Crear TimezoneSelect.
2. Reemplazar lista hardcodeada en Company Settings.
3. Reemplazar Input text de Locations por TimezoneSelect.
4. Reemplazar Input text de primary location inline por TimezoneSelect.
5. Inicializar nuevas locations con tenant.timezone.
6. Agregar zod refine con isSupportedProductTimeZone.
7. Agregar tests de render y submit.
```

Riesgos:

```txt
El OrganizationRecordDrawer hoy renderiza fields genericos como Input.
Meter logica especial puede ensuciar el componente.
```

Mitigaciones:

```txt
1. Agregar `inputType` o `control` a OrganizationFieldConfig.
2. Para timezone usar control: "timezone".
3. Mantener el drawer generico, pero con un renderer por tipo de campo.
4. No hardcodear `field.key === "timezone"` en muchos lugares.
```

Modelo propuesto:

```ts
export interface OrganizationFieldConfig {
  readonly key: keyof OrganizationRecordPayload;
  readonly label: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly control?: "text" | "timezone" | "country";
}
```

Exit criteria:

```txt
No queda ningun input text editable para timezone.
```

## Fase 5: Timezone Resolution Service

Objetivo:

```txt
Crear el helper/capa que resuelve condiciones de timezone una sola vez.
```

Tareas:

```txt
1. Crear TimezoneResolutionService en API.
2. Crear funciones puras equivalentes en @hr-app/timezones cuando no dependan
   de NestJS.
3. Usar el servicio en create location.
4. Usarlo en futuros modulos de employees/time tracking/leave.
5. Crear tests de prioridad:
   employee -> location -> tenant -> UTC.
```

Regla importante:

```txt
Los use cases deben pedir "timezone efectivo" a la capa central, no construirlo
manual.
```

Ejemplo de uso correcto:

```ts
const timeZone = this.timezoneResolution.resolveLocationOperational({
  tenant,
  location
});
```

Ejemplo de uso incorrecto:

```ts
const timeZone = location?.timezone ?? tenant.timezone ?? "UTC";
```

Riesgos:

```txt
El servicio puede crecer demasiado si se le agregan reglas de todos los modulos.
```

Mitigaciones:

```txt
1. Mantenerlo limitado a resolucion de timezone.
2. No meter reglas de payroll, vacaciones o permisos.
3. Crear helpers especificos por modulo que reciban el timezone ya resuelto.
```

Exit criteria:

```txt
Existe una unica API interna para resolver timezone operativo/display.
```

## Fase 6: Formatting Y Display Consistente

Objetivo:

```txt
Evitar formateos dependientes del timezone local del navegador/servidor.
```

Puntos actuales detectados:

```txt
apps/web/src/lib/format/date.ts
apps/web/src/features/company-signup/platform-company-signups-utils.ts
apps/web/src/features/access/access-utils.ts
apps/web/src/features/organization/components/organization-settings-page.tsx
```

Tareas:

```txt
1. Crear formatDateTimeInTimeZone.
2. Crear formatDateOnly si el dato es fecha pura.
3. Agregar parametro timeZone obligatorio para timestamps operativos.
4. Revisar usages existentes y clasificarlos como tecnico/display/operativo.
5. Agregar tests con timeZone explicito.
```

Riesgos:

```txt
Cambiar formatters puede alterar snapshots/textos existentes.
Algunos datos actuales no tienen timezone contextual disponible.
```

Mitigaciones:

```txt
1. Migrar primero helpers, luego pantallas.
2. Usar tenant timezone como fallback display.
3. No cambiar semantica de fechas puras hasta tener decision de schema.
```

Exit criteria:

```txt
Los formatters principales aceptan timezone explicito y no dependen
silenciosamente del navegador.
```

## Fase 7: Preparacion Para Time Tracking Y Leave

Objetivo:

```txt
Evitar que modulos futuros nazcan con deuda de timezone.
```

Tareas:

```txt
1. Definir modelos de time tracking con startedAtUtc/endedAtUtc.
2. Persistir timezone historico en eventos operativos.
3. Persistir localDate derivado cuando se necesite query/reporting eficiente.
4. Definir LeaveRequest con fechas locales y timezone efectivo.
5. Agregar tests de cruce de medianoche.
6. Agregar tests de DST para America/New_York.
```

Riesgos:

```txt
DateTime actual puede usarse para fechas puras.
Prisma schema actual no diferencia Date vs DateTime en varios campos.
```

Mitigaciones:

```txt
1. Documentar convencion por campo antes de usarlo en calculos.
2. Para campos nuevos, elegir tipo correcto desde el inicio.
3. No usar UTC midnight para representar vacaciones full-day.
4. Guardar timezone historico en registros operativos.
```

Exit criteria:

```txt
Nuevos modulos tienen convencion clara: Instant UTC vs LocalDate.
```

## Fase 8: Auditoria De Datos Y Migracion

Objetivo:

```txt
Corregir datos existentes y evitar sorpresas en clientes activos.
```

Tareas:

```txt
1. Query para detectar Location.timezone no IANA.
2. Query para detectar Tenant.timezone no IANA.
3. Backfill de Location.timezone invalido con Tenant.timezone.
4. Revisar seeds.
5. Agregar constraint opcional si la politica queda estable.
```

Riesgos:

```txt
Corregir timezone historico puede cambiar interpretacion de reportes.
```

Mitigaciones:

```txt
1. Antes de time tracking/leave, el impacto historico es menor.
2. Registrar auditoria de cambios de timezone.
3. No recalcular derivados sin decision explicita.
```

Exit criteria:

```txt
No quedan timezones invalidos en tenants/locations.
```

## Orden Recomendado De Ejecucion

Orden pragmatica:

```txt
1. Fase 1: Timezone Core Compartido.
2. Fase 2: Validacion Backend Centralizada.
3. Fase 4: UI Reusable Y Sin Text Inputs.
4. Fase 3: Defaults Correctos En Backend.
5. Fase 5: Timezone Resolution Service.
6. Fase 6: Formatting Y Display Consistente.
7. Fase 8: Auditoria De Datos.
8. Fase 7: Preparacion Para Time Tracking Y Leave.
```

Motivo:

```txt
Primero se corta la entrada de datos malos.
Luego se corrigen defaults.
Despues se consolida resolucion y display.
Finalmente se prepara la semantica profunda de modulos futuros.
```

## Riesgos Globales Y Mitigaciones

### Riesgo: Confiar En Offsets

Problema:

```txt
UTC-04 no representa reglas civiles ni DST.
```

Mitigacion:

```txt
Guardar IANA IDs, nunca offsets como configuracion primaria.
```

### Riesgo: Runtime Con tzdata Distinta

Problema:

```txt
Node, navegador y entorno de deploy pueden tener versiones distintas de ICU/tzdata.
```

Mitigacion:

```txt
Validar en backend como fuente final.
Mantener tests de zonas criticas.
Evitar depender de labels generados por runtime para persistencia.
```

### Riesgo: Lista America Incompleta

Problema:

```txt
Una lista manual puede olvidar zonas reales.
```

Mitigacion:

```txt
Centralizar la lista.
Generarla con Intl.supportedValuesOf cuando exista.
Filtrar America/*.
Tener fallback estatico testeado.
```

### Riesgo: Romper Tenants Existentes

Problema:

```txt
Activar validacion fuerte puede rechazar datos legacy.
```

Mitigacion:

```txt
Auditar antes.
Backfill antes de constraints.
Errores claros para nuevos writes.
```

### Riesgo: Helper Demasiado Generico

Problema:

```txt
Un helper que intenta resolver payroll, vacaciones, display y permisos se vuelve
un god service.
```

Mitigacion:

```txt
TimezoneResolutionService solo resuelve timezone.
Cada modulo aplica sus reglas usando ese timezone.
```

### Riesgo: Fechas Puras Como Instantes

Problema:

```txt
Una vacacion full-day puede moverse de dia si se guarda como midnight UTC.
```

Mitigacion:

```txt
Distinguir Instant UTC vs LocalDate en modelos nuevos.
Agregar documentacion por campo legacy.
```

## Testing Strategy

### Unit Tests Del Package

```txt
isIanaTimeZone acepta America/La_Paz.
isIanaTimeZone rechaza not-a-timezone.
getSupportedTimeZoneOptions devuelve solo America/* cuando region America.
parseIanaTimeZone retorna null para valores no string.
DEFAULT_TIME_ZONE es valido.
```

### Backend Tests

```txt
CreateLocationDto rechaza timezone invalido.
UpdateLocationDto rechaza timezone invalido.
Create location sin timezone usa tenant timezone.
TimezoneResolutionService aplica prioridad correcta.
TimezonePolicyService rechaza valores fuera de politica si America-only.
```

### Frontend Tests

```txt
Company Settings usa TimezoneSelect.
Locations usa TimezoneSelect.
Organization Units inline location usa TimezoneSelect.
TimezoneSelect no permite submit vacio.
TimezoneSelect muestra labels humanos y guarda ID IANA.
```

### Edge Case Tests

```txt
UTC instant cerca de medianoche se agrupa distinto en America/Los_Angeles y
America/La_Paz.
America/New_York DST spring-forward.
America/New_York DST fall-back.
America/Phoenix sin DST.
America/La_Paz sin DST.
```

## Definition Of Done

La implementacion puede considerarse lista cuando:

```txt
1. No hay inputs text libres para timezone.
2. API rechaza timezones invalidos en Tenant y Location.
3. Company Settings y Locations usan la misma fuente de opciones.
4. Crear location usa tenant timezone por default.
5. Existe TimezoneResolutionService/helper central.
6. Los formatters principales aceptan timezone explicito.
7. Hay tests de validacion, defaults y resolucion.
8. El documento de arquitectura queda alineado con el codigo.
```

## Recomendacion Final

La forma mas eficiente y reusable es:

```txt
@hr-app/timezones
  -> reglas puras, tipos, opciones, labels, validacion, formatting basico

apps/api/src/common/timezones
  -> policy service y resolution service con DI de NestJS

apps/web/src/features/timezones
  -> TimezoneSelect, schemas de formulario y helpers de display
```

Con esta separacion:

```txt
1. La validacion no se repite.
2. La UI no hardcodea listas.
3. Los use cases no duplican fallbacks.
4. Backend sigue siendo la fuente final de seguridad.
5. La app queda preparada para multi-location, empleados remotos, vacaciones,
   asistencia y reportes sin redisenar todo despues.
```
