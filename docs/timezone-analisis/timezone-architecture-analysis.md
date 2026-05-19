# Timezone Architecture Analysis

Fecha: 2026-05-18

## Objetivo

Definir como debe manejar la aplicacion las zonas horarias para Company
Settings, Locations, empleados, horas trabajadas, vacaciones, reportes y
futuros modulos operativos.

La pregunta central no es solamente si `Location.timezone` debe existir como
input. La pregunta real es:

```txt
Que timezone representa la realidad operativa de cada dato, como se valida, y
como se evita que fechas, horas, vacaciones y reportes cambien de significado
cuando una compania opera en varias ciudades o paises?
```

## Resumen Ejecutivo

La recomendacion es:

```txt
1. Guardar instantes reales en UTC.
2. Guardar fechas puras como fechas puras, no como DateTime convertido.
3. Mantener `Tenant.timezone` como default global obligatorio.
4. Mantener `Location.timezone` como override operativo por sucursal/oficina.
5. No usar un input text libre para timezone.
6. Usar IANA time zone IDs validados, por ejemplo `America/La_Paz`.
7. Resolver un "effective timezone" con prioridad clara:
   employee/user preference -> employee current location -> tenant default.
8. No hardcodear una lista pequena en cada pantalla.
9. Centralizar catalogo, validacion y labels de timezones en una utilidad
   compartida.
10. Para el primer alcance, exponer solo America en la UI, pero validar contra
    IANA real para no bloquear crecimiento global.
```

Conclusion corta:

```txt
Si, `Location.timezone` es necesario.
No, no debe ser un text input.
No, no basta con una configuracion unica para todos si la compania puede tener
sucursales o empleados en distintas zonas.
Si, la fuente de verdad para almacenamiento de eventos instantaneos debe ser
UTC.
```

## Estado Actual En La Aplicacion

El estado actual tiene una mezcla peligrosa:

```txt
Tenant.timezone
  - existe en Prisma
  - default inicial documentado: America/La_Paz
  - default actualizado para USA-first: America/New_York
  - Company Settings lo edita con un dropdown hardcodeado
  - backend usa @IsTimeZone() en update tenant

Location.timezone
  - existe en Prisma
  - default inicial documentado: America/La_Paz
  - default actualizado para USA-first: America/New_York
  - UI lo renderiza como Input text normal
  - backend solo valida string/maxLength, no valida IANA timezone
  - repository tenia fallback America/La_Paz aunque el tenant tuviera otro
```

Referencias locales:

```txt
packages/database/prisma/schema.prisma
apps/web/src/features/tenants/components/company-settings-page.tsx
apps/web/src/features/tenants/company-settings-schema.ts
apps/api/src/modules/tenants/presentation/dto/update-current-tenant.dto.ts
apps/web/src/features/organization/organization-config.ts
apps/web/src/features/organization/components/organization-settings-page.tsx
apps/api/src/modules/organization/presentation/dto/create-organization-record.dto.ts
apps/api/src/modules/organization/infrastructure/persistence/prisma-organization.repository.ts
```

El problema mas serio no es visual, aunque el text input se ve mal. El problema
real es que la app permite guardar valores invalidos en `Location.timezone`.
Ejemplos:

```txt
"Bolivia"
"La Paz"
"GMT-4"
"America/LaPaz"
"EST"
"asdf"
```

Algunos de esos valores parecen humanos, pero no son suficientemente seguros
para calcular fechas, DST, reportes, vacaciones o limites de jornada.

## Principios De Arquitectura

### 1. UTC Para Instantes

Todo evento que representa un momento exacto debe guardarse en UTC.

Ejemplos:

```txt
clock-in exacto
clock-out exacto
creacion de registros
actualizacion de registros
aprobacion de vacaciones
timestamp de auditoria
envio de invitacion
expiracion de token
```

Forma recomendada:

```txt
startedAtUtc DateTime
endedAtUtc   DateTime
createdAt    DateTime @default(now())
updatedAt    DateTime @updatedAt
```

La zona horaria no debe cambiar el instante almacenado. Solo cambia como se
interpreta y se muestra ese instante.

### 2. Fechas Puras No Deben Ser DateTime Si No Representan Un Instante

HR tiene muchos datos que son fechas de calendario, no instantes.

Ejemplos:

```txt
fecha de nacimiento
fecha de inicio de empleo
fecha de terminacion
dia de vacaciones
feriado local
fecha efectiva de una asignacion laboral
periodo de payroll
```

Estas fechas no deberian depender de si el servidor esta en UTC, Bolivia o New
York. Si el negocio dice "vacacion el 2026-07-10", ese valor es un dia de
calendario en el contexto de la politica laboral aplicable.

Prisma actualmente usa `DateTime` para varios campos de este tipo:

```txt
Employee.startDate
Employee.terminationDate
EmployeeProfile.birthDate
EmployeeJobAssignment.effectiveFrom
EmployeeJobAssignment.effectiveTo
CompensationRecord.effectiveFrom
CompensationRecord.effectiveTo
ClientAssignment.startDate
ClientAssignment.endDate
```

Eso no obliga a migrar ahora, pero si exige una convencion: cuando un campo
`DateTime` representa una fecha pura, la aplicacion debe tratarlo como
`LocalDate` de negocio, no como timestamp para mostrar en timezone del usuario.

Decision recomendada a mediano plazo:

```txt
Usar Date o columnas date para fechas puras cuando el schema madure.
Usar DateTime UTC solo para instantes reales.
```

### 3. IANA Time Zone IDs, No Offsets Fijos

El valor correcto a guardar es un ID IANA:

```txt
America/La_Paz
America/New_York
America/Mexico_City
America/Bogota
America/Lima
America/Santiago
America/Sao_Paulo
```

No se debe guardar:

```txt
UTC-04
GMT-4
EST
Bolivia Time
La Paz
```

Motivo:

```txt
Los offsets cambian por daylight saving time, cambios legales, historia local y
reglas por pais. Un offset fijo no contiene suficiente informacion.
```

Aunque Bolivia no use DST actualmente, la app no puede asumir que todas las
locations funcionan igual. Una sucursal en New York, Santiago, Asuncion o
Mexico puede tener reglas distintas.

## Debe Existir Timezone En Locations?

Si, debe existir.

La razon es que una location no es solo una direccion bonita para reportes. En
una app de HR, la location puede determinar:

```txt
hora local de entrada/salida
cierre del dia laboral
limites de asistencia por dia
feriados aplicables
calendario laboral
horarios por sucursal
ventanas de aprobacion
reportes por oficina
periodos de payroll local
notificaciones programadas
interpretacion de vacaciones por dia calendario
```

Si una compania tiene solo una ciudad, `Tenant.timezone` resuelve casi todo. Pero
si la misma compania tiene empleados en:

```txt
La Paz       -> America/La_Paz
New York     -> America/New_York
Los Angeles  -> America/Los_Angeles
Mexico City  -> America/Mexico_City
Bogota       -> America/Bogota
```

un unico timezone global rompe casos reales.

### Ejemplo De Falla Con Un Solo Timezone Global

Un empleado en Los Angeles marca entrada:

```txt
2026-05-18 08:00 America/Los_Angeles
```

El instante UTC seria:

```txt
2026-05-18 15:00 UTC
```

Si la app usa el timezone global `America/La_Paz` para mostrar o agrupar, ese
mismo instante se interpreta como:

```txt
2026-05-18 11:00 America/La_Paz
```

El instante es correcto, pero el dato operativo que HR espera ver para esa
sucursal es incorrecto: el empleado entro a las 08:00 local, no a las 11:00.

### Ejemplo Mas Grave: Cruce De Dia

Un empleado en Los Angeles marca entrada:

```txt
2026-05-18 23:30 America/Los_Angeles
```

UTC:

```txt
2026-05-19 06:30 UTC
```

Si agrupas asistencia por fecha UTC, cae el 19 de mayo. Si agrupas por fecha
local de la location, cae el 18 de mayo. Para asistencia, payroll y horas extra,
la fecha correcta normalmente es la local de la location/politica laboral, no la
fecha UTC.

## Debe Ser Obligatorio En Locations?

Recomendacion:

```txt
Location.timezone debe ser requerido a nivel efectivo, pero puede autollenarse
con el Tenant.timezone al crear una location.
```

Esto significa:

```txt
1. La base puede mantener `Location.timezone String`.
2. La UI debe mostrar un selector.
3. El valor inicial debe ser el timezone actual del tenant.
4. El usuario puede cambiarlo si la sucursal esta en otra zona.
5. El backend debe validar que sea un timezone IANA real.
```

No recomiendo quitar `Location.timezone`. Quitar este campo ahora ahorra una
decision de UI, pero empuja el problema hacia modulos mas sensibles: time
tracking, vacaciones, payroll y reportes.

Tampoco recomiendo hacerlo opcional de verdad en runtime. Un `null` obliga a
resolver fallback en cada uso. Es mejor tener valor persistido y claro. El
fallback es util solo al crear o migrar datos.

## Configuracion Unica Vs Configuracion Por Location

### Opcion A: Solo Tenant.timezone

Pros:

```txt
simple de implementar
menos campos visibles
menos decisiones para el admin
sirve para companias de una sola zona horaria
```

Contras:

```txt
no soporta multi-sucursal real
rompe reportes locales
rompe asistencia por dia local
obliga a hacks cuando aparezca time tracking
no expresa la realidad de empleados distribuidos
```

Veredicto:

```txt
Insuficiente para una app HR seria.
```

### Opcion B: Tenant.timezone + Location.timezone

Pros:

```txt
mantiene default simple
soporta sucursales en distintas zonas
permite reportes correctos por location
prepara time tracking, vacaciones y payroll
se alinea con EmployeeJobAssignment.locationId
```

Contras:

```txt
requiere selector correcto
requiere validacion centralizada
requiere reglas de timezone efectivo
requiere cuidado al cambiar timezone de una location existente
```

Veredicto:

```txt
Recomendado.
```

### Opcion C: Tenant.timezone + Location.timezone + Employee/User Timezone

Pros:

```txt
soporta empleados remotos que viven en una zona distinta a la sucursal
permite preferencias de visualizacion por usuario
mejora experiencia en notificaciones y calendario personal
```

Contras:

```txt
mas complejidad de producto
puede confundir si se usa para calculo laboral sin reglas claras
requiere separar timezone de visualizacion y timezone operacional
```

Veredicto:

```txt
Deseable, pero no tiene que ser el primer ajuste.
```

La arquitectura debe dejar espacio para esto, pero no hace falta bloquear el
arreglo actual esperando una pantalla de preferencias por empleado.

## Timezone Operacional Vs Timezone De Visualizacion

Hay dos conceptos distintos:

```txt
Operational timezone:
  La zona que define la regla de negocio.

Display timezone:
  La zona en la que el usuario quiere ver un timestamp.
```

Ejemplo:

```txt
Un HR manager en Bolivia revisa asistencia de una oficina en New York.
```

Para calcular si el empleado llego tarde, se debe usar:

```txt
America/New_York
```

Para mostrar en una auditoria personal del manager podria usarse:

```txt
America/La_Paz
```

Si la app no separa esos conceptos, tarde o temprano mezclara reglas de negocio
con preferencias de interfaz.

## Resolucion Recomendada Del Effective Timezone

Para eventos y vistas relacionadas a un empleado:

```txt
1. Si el empleado tiene timezone operacional explicito, usarlo.
2. Si no, usar timezone de su current job assignment location.
3. Si no tiene location, usar Tenant.timezone.
4. Si no hay tenant timezone por datos legacy, usar UTC como fallback tecnico.
```

En pseudocodigo:

```txt
resolveEmployeeOperationalTimezone(employee, tenant):
  if employee.operationalTimezone exists:
    return employee.operationalTimezone

  currentAssignment = getCurrentAssignment(employee)
  if currentAssignment.location.timezone exists:
    return currentAssignment.location.timezone

  return tenant.timezone ?? "UTC"
```

Para vistas de administracion general:

```txt
1. Si el usuario tiene timezone de preferencia, usarlo para display.
2. Si esta viendo datos de una location especifica, ofrecer display en timezone
   de esa location.
3. Si no, usar Tenant.timezone.
```

Para reportes por location:

```txt
Usar Location.timezone como timezone de agrupacion.
```

Para reportes tenant-wide:

```txt
Permitir parametro de timezone de reporte:
  - Tenant timezone por default
  - Timezone por location al agrupar por location
  - UTC solo para auditoria tecnica o integraciones
```

## Como Guardar Horas De Empleados

Para time tracking, no basta con guardar `localDate` y `localTime`. Se debe
guardar el instante UTC y tambien la zona usada para interpretarlo.

Modelo recomendado:

```txt
TimeEntry
  id
  tenantId
  employeeId
  locationId?
  startedAtUtc
  endedAtUtc?
  timezone              // IANA usada al registrar/calcular
  localStartDate        // derivada o persistida para query/reportes
  localStartTime        // opcional, util para auditoria humana
  source
  createdAt
  updatedAt
```

La columna `timezone` en el registro historico es importante porque una location
puede cambiar de timezone por correccion administrativa o cambio legal. Un
clock-in historico debe conservar la interpretacion con la que fue capturado o
calculado.

Regla:

```txt
Los timestamps UTC son la fuente de verdad del instante.
El timezone historico es la fuente de verdad de la interpretacion local usada
en ese momento.
```

## Como Guardar Vacaciones Y Ausencias

Vacaciones normalmente se manejan por dias locales, no por instantes UTC.

Modelo conceptual:

```txt
LeaveRequest
  id
  tenantId
  employeeId
  timezone              // IANA efectiva al crear la solicitud
  startDate             // local date
  endDate               // local date
  partialDay?
  startTimeLocal?
  endTimeLocal?
  status
  createdAt
  updatedAt
```

Si la ausencia es por dia completo:

```txt
Guardar fechas locales.
No convertir "2026-05-18" a midnight UTC para luego mostrarlo como otro dia.
```

Si la ausencia es parcial por horas:

```txt
Guardar fecha local + hora local + timezone, y derivar instantes UTC si se
necesita interoperabilidad con calendarios o notificaciones.
```

## Como Manejar Cambios De Timezone

Cambiar el timezone de una compania o location no debe reescribir historicos de
asistencia o vacaciones ya aprobadas.

Reglas recomendadas:

```txt
1. Tenant.timezone afecta defaults futuros y visualizacion default.
2. Location.timezone afecta nuevos calculos operativos de esa location.
3. Registros historicos que guardaron timezone propio mantienen su timezone.
4. Reportes historicos deben poder explicar que timezone se uso.
5. Si se corrige un timezone mal configurado, debe existir una decision
   explicita de si se recalculan derivados.
```

Para el MVP se puede evitar un flujo complejo, pero al menos se debe documentar
y no hacer updates masivos silenciosos.

## Lista Hardcodeada: Que Esta Mal Y Que Hacer

Una lista hardcodeada pequena en un componente tiene estos problemas:

```txt
se duplica entre pantallas
queda incompleta rapido
no sirve para Locations si Company Settings tiene otra lista
no valida backend
mezcla valor tecnico con UX
dificulta pruebas
```

No esta mal limitar la UI al continente americano para el primer alcance. Lo
que esta mal es hacerlo como lista local suelta en cada pantalla.

Recomendacion:

```txt
Crear un modulo compartido de timezones.
```

Ejemplo frontend:

```txt
apps/web/src/features/timezones/timezone-options.ts
```

Ejemplo backend:

```txt
apps/api/src/common/timezones/supported-timezones.ts
```

O mejor, si se quiere evitar duplicacion:

```txt
packages/shared/src/timezones/supported-timezones.ts
```

Contenido inicial:

```txt
SUPPORTED_TIMEZONE_REGIONS = ["America"]
SUPPORTED_TIMEZONES = lista derivada/curada de IANA America
DEFAULT_TIMEZONE = "America/La_Paz"
```

## America Como Alcance Inicial

Para enfocarse en America sin cerrar el sistema:

```txt
1. UI muestra timezones `America/*`.
2. Backend valida que sea IANA real.
3. Producto puede decidir si acepta solo `America/*` por ahora o acepta IANA
   global aunque la UI no lo exponga.
```

Mi recomendacion:

```txt
UI: America first.
Backend: IANA real + feature flag/politica de soportados.
```

Si el negocio quiere restringir estrictamente por ahora:

```txt
Backend: @IsTimeZone() + IsIn(SUPPORTED_TIMEZONES)
```

Si quiere estar listo para clientes globales:

```txt
Backend: @IsTimeZone()
UI: America list by default, con busqueda global mas adelante.
```

Para esta app, que hoy ya habla de America y usa Bolivia/US como seeds, la
mejor decision pragmatica es:

```txt
Validar IANA real siempre.
Mostrar America/* en dropdown/combobox.
No aceptar texto libre.
```

## UX Recomendada

### Company Settings

Mantener el campo `Timezone`, pero cambiar de `select` hardcodeado local a un
componente reutilizable:

```txt
TimezoneSelect
  value
  onChange
  allowedRegion = "America"
  includeUtc = true/false segun pantalla
```

Company Settings representa:

```txt
Default timezone del tenant.
```

Copy recomendado:

```txt
Default timezone
```

Texto de ayuda:

```txt
Used as the fallback for company-wide views and new locations.
```

### Locations

Reemplazar el input text por el mismo `TimezoneSelect`.

Al crear location:

```txt
timezone default = tenant.timezone
```

Label recomendado:

```txt
Local timezone
```

Texto de ayuda:

```txt
Used for local attendance days, schedules, holidays, and location reports.
```

No usar placeholder como unica guia. Un placeholder `America/La_Paz` no evita
errores.

### Organization Units

Actualmente al crear primary location desde Organization Units, el timezone
default es `America/New_York`. Eso deberia cambiar.

Recomendacion:

```txt
primaryLocationTimezone default = tenant.timezone
```

Y tambien usar `TimezoneSelect`.

## Validacion Recomendada

### Frontend

Company Settings:

```txt
z.string()
 .trim()
 .min(1)
 .refine(isSupportedTimezone)
```

Location:

```txt
timezone requerido en el form efectivo.
selector evita valores invalidos.
schema/submit valida contra lista central.
```

### Backend

Tenant ya usa:

```txt
@IsTimeZone()
```

Location deberia usar lo mismo:

```txt
@IsOptional()
@IsString()
@IsTimeZone()
@MaxLength(80)
timezone?: string;
```

Si se restringe a America:

```txt
@IsIn(SUPPORTED_TIMEZONES)
```

Pero cuidado: `@IsIn` con una lista manual incompleta puede bloquear clientes
validos. Si se usa, debe vivir en un modulo central y tener tests.

## Defaults Recomendados

### Tenant

```txt
Tenant.timezone default tecnico USA-first: America/New_York
```

Esto es coherente para un producto SaaS orientado a Estados Unidos. Para otros
mercados, el signup debe pedir timezone o inferirlo de pais/ciudad con
confirmacion.

### Location

Cambiar mentalmente el default:

```txt
No deberia ser siempre America/La_Paz.
Deberia ser tenant.timezone al crear una location.
```

Hoy el repository de organization usa:

```txt
timezone: input.timezone ?? "America/La_Paz"
```

Eso es incorrecto para tenants cuyo default sea otro timezone.

Mejor:

```txt
timezone: input.timezone ?? tenant.timezone
```

Si el repository no tiene `tenant.timezone`, el use case debe resolverlo antes
o el endpoint debe requerir timezone desde frontend. A nivel arquitectura, el
default pertenece al tenant, no a una constante global escondida.

## Reglas Para Mostrar Fechas

### Timestamps Tecnicos

Ejemplos:

```txt
createdAt
updatedAt
audit.createdAt
invitation.acceptedAt
```

Mostrar en:

```txt
user display timezone, si existe
tenant timezone, si no
UTC solo para logs tecnicos
```

### Datos Operativos Por Location

Ejemplos:

```txt
attendance day
schedule
holiday
shift start
location report
```

Mostrar/calcular en:

```txt
location timezone
```

### Datos Operativos Por Empleado

Ejemplos:

```txt
employee attendance
employee leave
employee calendar
```

Mostrar/calcular en:

```txt
employee operational timezone
```

que inicialmente puede venir de:

```txt
current assignment location timezone
```

## Riesgos Si Se Deja Como Esta

Riesgos tecnicos:

```txt
timezone invalido guardado en Location
errores runtime al formatear fechas
reportes agrupados en dias incorrectos
asistencia calculada con timezone equivocado
datos historicos dificiles de corregir
duplicacion de listas en frontend/backend
defaults inconsistentes entre Company y Locations
```

Riesgos de producto:

```txt
la app se percibe poco profesional
admins no saben que escribir
soporte tendra que corregir datos manualmente
clientes multi-location pierden confianza
futuro payroll/time tracking nace con deuda estructural
```

## Decision Arquitectonica Recomendada

Decision:

```txt
Mantener `Tenant.timezone` y `Location.timezone`.
Usar UTC para instantes.
Usar timezone IANA para interpretacion local.
Eliminar inputs text libres para timezone.
Centralizar catalogo y validacion.
Default de location = tenant timezone.
Preparar `employee/user timezone` para una fase futura.
```

No hacer:

```txt
No eliminar Location.timezone.
No usar offsets fijos.
No guardar valores humanos como "Bolivia" o "Eastern".
No hardcodear listas distintas por componente.
No convertir fechas puras a DateTime sin convencion explicita.
No recalcular historicos silenciosamente al cambiar timezone.
```

## Plan De Implementacion Recomendado

### Fase 1: Correccion Inmediata De Calidad

Objetivo:

```txt
Quitar el input text libre y evitar datos invalidos nuevos.
```

Tareas:

```txt
1. Crear lista central de timezones soportados para America.
2. Crear componente `TimezoneSelect` o `TimezoneCombobox`.
3. Reemplazar dropdown hardcodeado de Company Settings.
4. Reemplazar input text de Locations.
5. Reemplazar input text de primary location en Organization Units.
6. Agregar validacion frontend con lista central.
7. Agregar `@IsTimeZone()` a CreateLocationDto/UpdateLocationDto.
8. Ajustar tests de schema y DTO.
```

### Fase 2: Defaults Correctos

Objetivo:

```txt
Que una nueva location herede el timezone del tenant, no America/La_Paz fijo.
```

Tareas:

```txt
1. En frontend, inicializar timezone de location desde current tenant.
2. En Organization Units, inicializar primaryLocationTimezone desde tenant.
3. En backend, evitar fallback fijo America/La_Paz en location create.
4. Decidir si create location exige timezone o si use case consulta tenant.
5. Agregar tests para tenant America/New_York creando location sin timezone.
```

### Fase 3: Effective Timezone Service

Objetivo:

```txt
Tener una unica forma de resolver timezone operativo.
```

Tareas:

```txt
1. Crear helper backend `resolveTenantTimezone`.
2. Crear helper backend `resolveEmployeeOperationalTimezone`.
3. Crear helper frontend para formateo con timezone explicito.
4. Documentar que reportes por location agrupan con Location.timezone.
5. Evitar llamadas directas a Intl.DateTimeFormat sin timezone cuando el dato
   sea operativo.
```

### Fase 4: Preparacion Para Time Tracking Y Leave

Objetivo:

```txt
Evitar disenar time tracking/vacaciones encima de DateTime ambiguos.
```

Tareas:

```txt
1. Definir cuales campos son Instant UTC.
2. Definir cuales campos son LocalDate.
3. Persistir timezone historico en time entries y leave requests.
4. Agregar columnas derivadas de fecha local si los reportes las necesitan.
5. Crear pruebas con cruce de medianoche y DST.
```

## Tests Minimos Que Deberian Existir

Backend:

```txt
CreateLocationDto rechaza "not-a-timezone".
CreateLocationDto acepta "America/La_Paz".
UpdateLocationDto rechaza "GMT-4" si se decide exigir IANA.
Crear location sin timezone usa Tenant.timezone o falla con error claro.
Tenant update sigue rechazando timezones invalidos.
```

Frontend:

```txt
Company Settings renderiza timezones desde lista central.
Location drawer no renderiza input text para timezone.
Location drawer inicializa timezone con tenant timezone.
Organization Units primary location usa el mismo selector.
Formulario no permite guardar timezone vacio/invalido.
```

Dominio/futuro:

```txt
Clock-in cerca de medianoche se agrupa por fecha local de location.
DST spring-forward no crea hora local inexistente sin validacion.
DST fall-back distingue instantes diferentes con misma hora local.
Vacacion full-day conserva la fecha local elegida.
Cambio de Location.timezone no modifica registros historicos.
```

## Implicaciones Para Base De Datos

No es necesario eliminar columnas actuales. El schema actual ya tiene los campos
base:

```txt
Tenant.timezone String
Location.timezone String
EmployeeJobAssignment.locationId String?
```

Cambios recomendados ahora:

```txt
1. Mantener ambos timezone como String.
2. Validar en aplicacion con IANA.
3. Considerar constraint/check solo si se tiene lista soportada estable.
4. No agregar Employee.timezone todavia si no hay UI ni reglas.
```

Cambios recomendados despues:

```txt
1. Evaluar Employee.operationalTimezone nullable.
2. Evaluar User.timezone para preferencias de display.
3. Migrar fechas puras importantes a tipo date si Prisma/proyecto lo permite
   sin costo alto.
4. Agregar timezone historico a tablas de asistencia/vacaciones cuando existan.
```

## Recomendacion Sobre Employee Timezone

No lo agregaria en esta fase salvo que exista un caso claro de empleados remotos
desacoplados de una location.

La prioridad correcta es:

```txt
1. Tenant default correcto.
2. Location override correcto.
3. Employee assignment usa location.
4. Despues, employee/user timezone si producto lo necesita.
```

Si se agrega demasiado pronto, se abre una ambiguedad:

```txt
El timezone del empleado define calculo laboral o solo visualizacion?
```

Esa pregunta debe resolverse antes de agregar el campo.

## Decision Sobre UTC

Mantener todo en UTC es correcto solo para instantes. No significa que la app
pueda ignorar timezones.

Frase precisa:

```txt
Persistimos instantes en UTC, pero calculamos y mostramos reglas de negocio en
el timezone efectivo correspondiente.
```

UTC resuelve consistencia tecnica. Timezone efectivo resuelve significado de
negocio.

## Conclusion

La mejor arquitectura para esta app es un modelo por capas:

```txt
Tenant.timezone
  default global de la compania

Location.timezone
  timezone operativo de sucursal/oficina

Employee/User timezone futuro
  preferencia o override explicito cuando el producto lo necesite

UTC
  almacenamiento de instantes reales

LocalDate
  fechas de negocio que no son instantes
```

Por eso, el campo timezone de Locations si tiene sentido y debe quedarse. Lo que
debe cambiar es su UX y validacion. Un input text libre para timezone en una app
HR no es aceptable porque permite datos invalidos justo en una configuracion que
despues afectara asistencia, vacaciones, horarios, reportes y payroll.

La accion recomendada inmediata es reemplazar cualquier captura manual de
timezone por un selector/combobox centralizado, validar con IANA en backend, y
hacer que las nuevas locations hereden por default el timezone del tenant.
