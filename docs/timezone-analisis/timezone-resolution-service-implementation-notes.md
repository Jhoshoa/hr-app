# Timezone Resolution Service Implementation Notes

Fecha: 2026-05-19

## Alcance De Esta Implementacion

Esta fase implementa la base reutilizable para resolver timezones sin duplicar
fallbacks por modulo.

Incluye:

- ampliar `@hr-app/timezones` con mas zonas relevantes para Estados Unidos;
- agregar helpers puros de resolucion de timezone efectivo;
- agregar helpers de formateo con timezone explicito;
- crear `TimezoneResolutionService` en API;
- usar el servicio al crear locations;
- mantener `Tenant.timezone` y `Location.timezone` como fuente de configuracion;
- agregar tests para resolucion y defaults.

No incluye:

- migrar campos `DateTime` que representan fechas puras a columnas `date`;
- agregar `User.timezone` o `Employee.operationalTimezone`;
- crear modelos de asistencia, vacaciones o payroll;
- recalcular historicos;
- agregar constraints DB con lista completa de timezones.

## Decision

La regla base queda centralizada asi:

```txt
tenant default:
  tenant.timezone valido -> DEFAULT_TIME_ZONE

location operational:
  location.timezone valido -> tenant.timezone valido -> DEFAULT_TIME_ZONE

employee operational:
  employee.timezone futuro valido
  -> employee.currentLocation.timezone valido
  -> tenant.timezone valido
  -> DEFAULT_TIME_ZONE

display:
  userTimezone valido
  -> contextLocation.timezone valido
  -> tenant.timezone valido
  -> DEFAULT_TIME_ZONE
```

`DEFAULT_TIME_ZONE` pasa a ser `America/New_York` porque el producto se esta
orientando a un mercado SaaS de Estados Unidos. Los tenants existentes con otro
timezone no cambian automaticamente; solo afecta nuevos defaults y fallbacks.

## Regla Importante

Los modulos de negocio no deben construir manualmente expresiones como:

```ts
location?.timezone ?? tenant.timezone ?? "UTC"
```

Deben usar la capa central:

```ts
timezoneResolution.resolveLocationOperational({ tenant, location })
```

Esto reduce deuda cuando se agregue timezone por usuario, empleado remoto,
reportes o asistencia.

