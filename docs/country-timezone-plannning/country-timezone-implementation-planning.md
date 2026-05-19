# Country And Timezone Implementation Planning

Fecha: 2026-05-18

## Decision

Si, necesitamos este planning antes de implementar.

El cambio no es solo visual. Toca:

```txt
shared packages
frontend forms
frontend validation
backend DTO validation
backend normalization
tenant approval flow
location creation
organization unit inline location creation
tests
seed/demo data
posible migracion de datos legacy
```

Sin un plan especifico por archivo seria facil introducir una segunda fuente de
verdad, romper la reorganizacion reciente del frontend o dejar validaciones solo
en UI.

Este documento consolida:

```txt
docs/timezone-analisis/timezone-architecture-analysis.md
docs/timezone-analisis/timezone-implementation-phases.md
docs/country-codes-analisis/country-state-city-phone-timezone-data-analysis.md
```

## Estado Actual Relevante

### Frontend

Company signup:

```txt
apps/web/src/features/company-signup/components/company-signup-page.tsx
  - countryOptions hardcodeado localmente.
  - timezoneOptions hardcodeado localmente.
  - phone number es Input libre.
  - country envia nombres humanos como "Bolivia" y "United States".

apps/web/src/features/company-signup/company-signup-schema.ts
  - country es string opcional max 80.
  - timezone es string requerido max 80, sin validacion IANA/local.
  - phone es string opcional max 40.

apps/web/src/features/company-signup/company-signup-schema.test.ts
  - espera country: "Bolivia".
```

Company settings:

```txt
apps/web/src/features/tenants/components/company-settings-page.tsx
  - timezoneOptions hardcodeado localmente.

apps/web/src/features/tenants/company-settings-schema.ts
  - timezone es string requerido max 80, sin validacion contra lista central.
```

Organization / locations:

```txt
apps/web/src/features/organization/organization-config.ts
  - Location.country label "Country code", placeholder "BO".
  - Location.city Input generico.
  - Location.timezone Input generico.

apps/web/src/features/organization/components/organization-catalog-panel.tsx
  - Drawer generico renderiza todos los fields con Input.
  - No hay renderer por tipo de control.
  - cleanPayload trata country/timezone como no-null en edit.

apps/web/src/features/organization/components/organization-units-panel.tsx
  - create primary location inline usa Input para country/city/timezone.
  - defaults hardcodeados: primaryLocationCountry "US",
    primaryLocationTimezone "America/New_York".
```

Nota de reorganizacion:

```txt
El frontend ya fue reorganizado. El planning debe usar
organization-catalog-panel.tsx y hr-catalog-settings-page.tsx, no asumir que
todo vive en organization-settings-page.tsx.
```

### Backend

Company signup:

```txt
apps/api/src/modules/company-signups/presentation/dto/company-signup-request.dto.ts
  - country: string opcional max 80.
  - timezone: @IsTimeZone().
  - phone: string opcional max 40.

apps/api/src/modules/company-signups/domain/company-signup-normalization.ts
  - normaliza email, slug, optional text, website.
  - no normaliza country/timezone/phone.

apps/api/src/modules/company-signups/application/use-cases/approve-company-signup-request.use-case.ts
  - tenant timezone = request.timezone ?? "America/La_Paz".
```

Organization:

```txt
apps/api/src/modules/organization/presentation/dto/create-organization-record.dto.ts
  - Location.country max 2, pero no IsISO31661Alpha2.
  - Location.timezone string max 80, no @IsTimeZone().

apps/api/src/modules/organization/infrastructure/persistence/prisma-organization.repository.ts
  - create location usa country ?? "BO".
  - create location usa timezone ?? "America/La_Paz".
```

Database:

```txt
packages/database/prisma/schema.prisma
  - CompanySignupRequest.country String?
  - CompanySignupRequest.phone String?
  - CompanySignupRequest.timezone String?
  - Location.country String @default("BO")
  - Location.city String?
  - Location.timezone String @default("America/La_Paz")
```

## Implementation Strategy

Implementar en capas, no pantalla por pantalla.

Orden recomendado:

```txt
1. Shared metadata packages.
2. Backend validation/normalization.
3. Frontend shared controls.
4. Company Settings.
5. Company Signup.
6. Locations catalog.
7. Organization Units inline location.
8. Formatting/default cleanup.
9. Tests full pass.
```

## Target Architecture

```txt
packages/timezones
  @hr-app/timezones
  - IANA timezone types, constants, options, validation.

packages/geo
  @hr-app/geo
  - America countries, calling codes, country/timezone relation,
    optional subdivision/city metadata.

apps/api/src/common/timezones
  - TimezonePolicyService.
  - TimezoneResolutionService.

apps/api/src/common/geo
  - GeoPolicyService.
  - PhoneNormalizationService or pure phone helpers if dependency is small.

apps/web/src/features/timezones
  - TimezoneSelect.
  - timezone schema helpers.

apps/web/src/features/geo
  - CountrySelect.
  - PhoneInput.
  - future SubdivisionSelect / CityCombobox.
```

## Scope For First Implementation

Para evitar una implementacion demasiado grande, dividir en MVP y future slice.

### MVP

```txt
1. America country dropdown.
2. Country persisted as ISO alpha-2.
3. Timezone dropdown centralizado.
4. Country filters/suggests timezone.
5. Backend rejects invalid country/timezone.
6. Locations no usan text input para country/timezone.
7. Company signup no usa hardcoded country/timezone local.
8. Organization units inline location no usa text input para country/timezone.
9. Tests unitarios y componentes principales.
```

### Defer Explicitamente

```txt
1. Full city dataset.
2. Subdivision/state/departamento schema migration.
3. cityGeoNameId.
4. Phone E.164 con dependencia externa si no se quiere agregar dependency ahora.
5. DB column rename country -> countryCode.
```

Razon:

```txt
El primer riesgo real hoy es country/timezone invalido y defaults incorrectos.
City y subdivision pueden quedar como texto asistido en esta fase, siempre que
no se usen para inferencias criticas.
```

## Phase 1: Shared Timezone Package

Crear:

```txt
packages/timezones/package.json
packages/timezones/tsconfig.json
packages/timezones/src/index.ts
packages/timezones/src/timezone-types.ts
packages/timezones/src/timezone-data.ts
packages/timezones/src/timezone-validation.ts
packages/timezones/src/timezone-options.ts
packages/timezones/src/timezone-resolution.ts
packages/timezones/src/timezone-validation.test.ts
```

Exports minimos:

```ts
export type IanaTimeZone = string & { readonly __brand: "IanaTimeZone" };
export const DEFAULT_TIME_ZONE = "America/La_Paz";
export const FALLBACK_TIME_ZONE = "UTC";
export function isIanaTimeZone(value: string): value is IanaTimeZone;
export function isSupportedTimeZone(value: string): value is IanaTimeZone;
export function getAmericaTimeZoneOptions(): readonly TimeZoneOption[];
```

Tests:

```txt
isIanaTimeZone acepta America/La_Paz.
isIanaTimeZone rechaza not-a-timezone.
isSupportedTimeZone acepta America/New_York.
DEFAULT_TIME_ZONE esta incluido en opciones.
```

Notas:

```txt
No meter cities ni countries aqui.
No usar una dependencia runtime para timezone en esta fase.
Validar con Intl.DateTimeFormat y lista soportada por producto.
```

## Phase 2: Shared Geo Package

Crear:

```txt
packages/geo/package.json
packages/geo/tsconfig.json
packages/geo/src/index.ts
packages/geo/src/country-types.ts
packages/geo/src/america-countries.ts
packages/geo/src/country-options.ts
packages/geo/src/geo-validation.ts
packages/geo/src/phone-country-codes.ts
packages/geo/src/geo-timezones.ts
packages/geo/src/geo-validation.test.ts
```

Exports minimos:

```ts
export type CountryCode = string & { readonly __brand: "CountryCode" };
export type CallingCode = `+${number}`;

export interface CountryMetadata {
  readonly code: CountryCode;
  readonly name: string;
  readonly callingCodes: readonly CallingCode[];
  readonly timeZones: readonly string[];
  readonly defaultTimeZone: string;
}

export function getAmericaCountries(): readonly CountryMetadata[];
export function getCountryOptions(): readonly CountryOption[];
export function isSupportedCountryCode(value: string): value is CountryCode;
export function getCountryDefaultTimeZone(countryCode: string): string | null;
export function getCountryTimeZones(countryCode: string): readonly string[];
export function normalizeCountryCode(value: string): CountryCode | null;
```

Initial country set:

```txt
BO, US, MX, CO, PE, AR, CL
```

Agregar mas America en una segunda pasada si se quiere cobertura completa desde
el principio.

Tests:

```txt
BO existe y defaultTimeZone es America/La_Paz.
US existe y tiene multiples timezones.
Bolivia legacy normaliza a BO si decidimos soportar backfill compatible.
XX no es supported.
```

Notas:

```txt
No cargar city datasets en MVP.
No incluir JSON enorme en client bundle.
```

## Phase 3: Backend Common Services

Crear:

```txt
apps/api/src/common/timezones/timezone-policy.service.ts
apps/api/src/common/timezones/timezone-resolution.service.ts
apps/api/src/common/timezones/timezone.module.ts
apps/api/src/common/timezones/timezone-resolution.service.spec.ts

apps/api/src/common/geo/geo-policy.service.ts
apps/api/src/common/geo/geo.module.ts
apps/api/src/common/geo/geo-policy.service.spec.ts
```

Responsibilities:

```txt
TimezonePolicyService:
  - assertSupportedTimeZone(value)
  - default timezone constants

TimezoneResolutionService:
  - resolveTenantDefault(tenant)
  - resolveLocationOperational({ tenant, location })

GeoPolicyService:
  - assertSupportedCountryCode(value)
  - normalizeCountryCode(value)
  - getCountryDefaultTimeZone(value)
```

Tests:

```txt
resolveLocationOperational: location > tenant > UTC.
resolveTenantDefault rechaza/recupera invalid legacy con fallback controlado.
GeoPolicyService rechaza country invalido.
GeoPolicyService normaliza lowercase "bo" a "BO".
```

NestJS practices:

```txt
Servicios pequenos y enfocados.
Constructor injection.
Evitar service locator.
Exportar modules solo donde se necesiten.
No meter Prisma dentro de TimezonePolicyService ni GeoPolicyService.
```

## Phase 4: Backend DTO And Use Case Validation

Actualizar:

```txt
apps/api/src/modules/company-signups/presentation/dto/company-signup-request.dto.ts
apps/api/src/modules/company-signups/domain/company-signup-normalization.ts
apps/api/src/modules/company-signups/application/use-cases/create-company-signup-request.use-case.ts
apps/api/src/modules/company-signups/application/use-cases/approve-company-signup-request.use-case.ts
apps/api/src/modules/organization/presentation/dto/create-organization-record.dto.ts
apps/api/src/modules/organization/application/use-cases/create-organization-record.use-case.ts
apps/api/src/modules/organization/application/use-cases/update-organization-record.use-case.ts
apps/api/src/modules/organization/infrastructure/persistence/prisma-organization.repository.ts
```

Changes:

```txt
CompanySignupRequestDto.country:
  - max 2 or custom validator for supported country.
  - normalize uppercase in use case.

CreateLocationDto.country:
  - validate ISO alpha-2/supported country.

CreateLocationDto.timezone:
  - add @IsTimeZone().
  - optionally policy service validates supported America.

ApproveCompanySignupRequestUseCase:
  - replace "America/La_Paz" fallback with DEFAULT_TIME_ZONE.

CreateOrganizationRecordUseCase:
  - if kind location and no timezone, default from tenant timezone.
```

Important design point:

```txt
Repository should persist resolved data.
Use case/application service should decide defaults and policy.
```

Potential dependency issue:

```txt
CreateOrganizationRecordUseCase needs tenant timezone for location default.
```

Preferred solution:

```txt
Inject TenantsRepository or a narrow TenantSettingsReader port into
OrganizationModule.
```

Avoid:

```txt
Reading tenant inside PrismaOrganizationRepository as hidden business policy.
```

Backend tests:

```txt
apps/api/src/modules/company-signups/tests/unit/company-signup-request.dto.spec.ts
  - accepts country BO.
  - rejects country Bolivia if strict API.
  - rejects invalid timezone.

apps/api/src/modules/company-signups/tests/unit/create-company-signup-request.use-case.spec.ts
  - normalizes country lowercase bo -> BO if accepted.
  - stores phone trimmed/normalized behavior.

apps/api/src/modules/company-signups/tests/unit/approve-company-signup-request.use-case.spec.ts
  - uses request timezone.
  - falls back to DEFAULT_TIME_ZONE, not string literal.

apps/api/src/modules/organization/tests/unit/create-organization-record.use-case.spec.ts
  - rejects invalid country.
  - rejects invalid timezone.
  - creates location with tenant timezone when missing.

apps/api/src/modules/organization/tests/unit/update-organization-record.use-case.spec.ts
  - rejects invalid country/timezone.
```

## Phase 5: Frontend Shared Controls

Crear:

```txt
apps/web/src/features/timezones/components/timezone-select.tsx
apps/web/src/features/timezones/timezone-schema.ts
apps/web/src/features/timezones/timezone-options.ts
apps/web/src/features/timezones/components/timezone-select.test.tsx

apps/web/src/features/geo/components/country-select.tsx
apps/web/src/features/geo/components/phone-input.tsx
apps/web/src/features/geo/geo-schema.ts
apps/web/src/features/geo/country-options.ts
apps/web/src/features/geo/components/country-select.test.tsx
```

Control behavior:

```txt
CountrySelect:
  - value is ISO alpha-2.
  - label is human name.
  - includes empty option when optional.

TimezoneSelect:
  - value is IANA.
  - accepts optional countryCode to filter/suggest.
  - includes empty option when form needs placeholder.

PhoneInput:
  - MVP can be country calling code select + input.
  - No heavy dependency until phase decides.
  - Should not force admin phone country to match company country.
```

React/Next performance rules:

```txt
Keep country/timezone options small and static.
Do not import city datasets in client root.
Use memoization only when filtering non-trivial option lists.
Avoid defining big option arrays inside components.
No async client component.
```

Frontend tests:

```txt
CountrySelect renders Bolivia with value BO.
TimezoneSelect renders America/La_Paz.
TimezoneSelect filters/suggests by country.
PhoneInput preserves typed number and selected calling code.
```

## Phase 6: Company Settings Update

Actualizar:

```txt
apps/web/src/features/tenants/components/company-settings-page.tsx
apps/web/src/features/tenants/company-settings-schema.ts
apps/web/src/features/tenants/company-settings-schema.test.ts
```

Changes:

```txt
Remove local timezoneOptions.
Use TimezoneSelect.
Schema uses shared timezone validation.
```

Tests:

```txt
schema accepts America/New_York.
schema rejects not-a-timezone.
component renders timezone option from shared list.
save still dispatches updateCurrentTenantName.
```

## Phase 7: Company Signup Update

Actualizar:

```txt
apps/web/src/features/company-signup/components/company-signup-page.tsx
apps/web/src/features/company-signup/company-signup-schema.ts
apps/web/src/features/company-signup/company-signup-schema.test.ts
apps/web/src/features/company-signup/company-signup-types.ts
apps/web/src/features/company-signup/components/company-signup-page tests if present/needed
```

Changes:

```txt
Remove local countryOptions.
Remove local timezoneOptions.
Country value becomes "BO", not "Bolivia".
Timezone suggested by selected country.
Phone field uses PhoneInput or at least phone country code UI.
```

Important compatibility decision:

```txt
For new submissions, country should be ISO alpha-2.
For existing platform review rows, display helper should map BO -> Bolivia and
fallback to raw legacy string if needed.
```

Tests:

```txt
companySignupSchema normalizes country "bo" to "BO" if accepted.
schema rejects unsupported country.
schema rejects invalid timezone.
empty optional country/phone still becomes undefined.
payload uses country "BO".
```

## Phase 8: Locations Catalog Update

Actualizar:

```txt
apps/web/src/features/organization/organization-types.ts
apps/web/src/features/organization/organization-config.ts
apps/web/src/features/organization/components/organization-catalog-panel.tsx
apps/web/src/features/organization/organization-utils.ts
apps/web/src/features/organization/organization-utils.test.ts
```

Changes:

```txt
Extend OrganizationFieldConfig:
  control?: "text" | "country" | "city" | "timezone";

Location fields:
  country -> control "country", required true or defaulted.
  city -> control "city" for now can still render Input/combobox later.
  timezone -> control "timezone".

OrganizationRecordDrawer:
  add renderField(field).
  use CountrySelect for country.
  use TimezoneSelect for timezone.
  preserve generic input for other fields.
```

Avoid:

```txt
if field.key === "timezone" spread in multiple locations.
```

Preferred:

```txt
switch(field.control ?? "text")
```

Tests:

```txt
Locations drawer renders CountrySelect.
Locations drawer renders TimezoneSelect.
Saving location sends country BO and timezone America/La_Paz.
Details display maps BO to Bolivia or "Cochabamba, BO" according to chosen UX.
```

## Phase 9: Organization Units Inline Location Update

Actualizar:

```txt
apps/web/src/features/organization/components/organization-units-panel.tsx
apps/web/src/features/organization/components/company-settings-structure.test.tsx
```

Changes:

```txt
primaryLocationCountry default should come from tenant/company context or
DEFAULT_COUNTRY_CODE if no tenant country exists.

primaryLocationTimezone default should be tenant.timezone, not America/New_York.

Use CountrySelect.
Use TimezoneSelect.
Keep city as Input or future CityCombobox.
```

Current blocker:

```txt
useCurrentTenant only exposes tenantSlug in current usage, not tenant timezone.
OrganizationUnitsPanel currently does not fetch current tenant.
```

Options:

```txt
1. Fetch current tenant in OrganizationUnitsPanel via useGetCurrentTenantQuery.
2. Pass tenant timezone from parent if CompanySettingsPage already has tenant.
3. Use DEFAULT_TIME_ZONE as UI default and backend resolves tenant timezone.
```

Recommended:

```txt
Backend must resolve tenant timezone regardless.
Frontend should also fetch/pass tenant timezone for better UX, but not be the
source of truth.
```

Tests:

```txt
Inline create primary location no longer shows free text country/timezone.
Payload uses selected country/timezone.
If tenant timezone is America/New_York, initial timezone is America/New_York.
```

## Phase 10: Optional Phone Normalization

Decision needed before implementation:

```txt
Do we add libphonenumber-js now?
```

Option A: Add dependency now.

```txt
Pros:
  real phone validation and E.164 normalization.

Cons:
  dependency install required.
  bundle care needed.
```

Option B: MVP without dependency.

```txt
Pros:
  faster, no dependency/network.
  can still improve UX with calling code select.

Cons:
  phone validation remains weak.
  E.164 normalization is not robust.
```

Recommended:

```txt
Use country/calling code UI now.
Add libphonenumber-js in a focused follow-up unless phone correctness is a
release blocker.
```

If dependency is added:

```txt
Frontend:
  apps/web package dependency.

Backend:
  apps/api package dependency.

Tests:
  BO local number -> +591...
  US local number -> +1...
  invalid number rejected.
```

## Phase 11: Data Migration / Compatibility

No DB schema migration is required for MVP if:

```txt
CompanySignupRequest.country continues as String? but stores ISO alpha-2.
Location.country continues as String but stores ISO alpha-2.
```

Recommended compatibility helpers:

```txt
normalizeCountryCode("Bolivia") -> "BO"
normalizeCountryCode("United States") -> "US"
normalizeCountryCode("bo") -> "BO"
```

Potential future migration:

```txt
CompanySignupRequest.country -> countryCode
Location.country -> countryCode
Location.subdivisionCode String?
Location.cityGeoNameId String?
```

Tests:

```txt
legacy country names still display safely in platform review.
new writes use ISO alpha-2.
```

## Verification Commands

Run after implementation:

```txt
corepack pnpm --filter @hr-app/timezones test
corepack pnpm --filter @hr-app/geo test
corepack pnpm --filter @hr-app/api test
corepack pnpm --filter @hr-app/api typecheck
corepack pnpm --filter @hr-app/web test
corepack pnpm --filter @hr-app/web typecheck
```

If package-level tests are not configured for new packages yet:

```txt
corepack pnpm test
corepack pnpm typecheck
```

## Risks And Mitigations

### Risk: Package Setup Slows Implementation

Mitigation:

```txt
Start with minimal packages and exports.
No build complexity beyond TypeScript source if workspace supports it.
Avoid introducing bundler-specific behavior.
```

### Risk: Frontend Bundle Grows

Mitigation:

```txt
Only ship countries/timezones initially.
No city datasets in MVP bundle.
Avoid barrel imports that pull all future city data.
```

### Risk: Backend And Frontend Validation Diverge

Mitigation:

```txt
Both import @hr-app/geo and @hr-app/timezones.
Backend remains final authority.
Tests cover both sides.
```

### Risk: Existing Data Uses Country Names

Mitigation:

```txt
Support legacy normalization for known names.
Display unknown raw value with fallback.
Do not silently delete old values.
```

### Risk: Tenant Timezone Default Requires Cross-Module Dependency

Mitigation:

```txt
Use a narrow repository/reader port.
Avoid circular module imports.
Keep default resolution in use case/application layer.
```

### Risk: Phone Validation Becomes Too Large

Mitigation:

```txt
Defer libphonenumber-js if needed.
If added, use smallest metadata that satisfies requirements.
Backend validates independently.
```

## Definition Of Done

Implementation is complete when:

```txt
1. No hardcoded timezoneOptions remain in Company Settings or Signup.
2. Company signup country submits ISO alpha-2.
3. Location country is selected, not typed.
4. Location timezone is selected, not typed.
5. Organization Units inline primary location uses the same controls.
6. Backend rejects invalid country/timezone.
7. Location default timezone resolves from tenant, not fixed America/La_Paz.
8. Shared packages have unit tests.
9. API DTO/use case tests cover invalid and valid values.
10. Web schema/component tests cover new controls and payloads.
11. Typecheck passes for api and web.
```

## Recommended First PR Boundary

Best first implementation slice:

```txt
1. Create @hr-app/timezones.
2. Create @hr-app/geo with minimal America countries.
3. Replace Company Settings timezone.
4. Replace Company Signup country/timezone options.
5. Add backend DTO validation for country/timezone.
6. Add tests.
```

Second PR:

```txt
1. Locations catalog field renderer.
2. Organization Units inline location controls.
3. Tenant timezone default resolution for location creation.
4. Tests.
```

Third PR:

```txt
1. PhoneInput and optional libphonenumber-js.
2. City/subdivision combobox strategy.
3. Data migration/backfill helpers.
```

This sequence gives value quickly, reduces risk, and keeps each PR reviewable.
