# Settings Reorganization Implementation Plan

## Goal

Split the current mixed Organization settings screen into clearer SaaS settings areas:

- Settings > Company
  - Profile
  - Locations
  - Structure
    - Organization unit types
    - Organization units
- Settings > HR
  - Departments
  - Job titles
  - Employment types
  - Work modes
  - Client projects

## Backend impact

No backend changes are required for this phase.

The current APIs already support the target split:

- Company profile: `GET/PATCH /api/v1/tenants/current`
- Company locations: `GET/POST/PATCH/... /api/v1/locations`
- Company structure: `organization-unit-types` and `organization-units`
- HR catalogs: `departments`, `job-titles`, `employment-types`, `work-modes`, `client-projects`

The endpoints should remain stable. This avoids unnecessary API churn and keeps existing integrations/tests valid.

## Frontend phases

### Phase 1: Extract reusable catalog panel

- Move the generic catalog table/drawer behavior out of `OrganizationSettingsPage`.
- Create a reusable `OrganizationCatalogPanel`.
- Keep the existing API hooks and DTOs unchanged.

### Phase 2: Company settings composition

- Keep the existing Company profile form in `CompanySettingsPage`.
- Add local tabs for:
  - Profile
  - Locations
  - Structure
- Render `Locations` with the reusable catalog panel.
- Render structure with:
  - `OrganizationUnitTypesPanel`
  - `OrganizationUnitsPanel`

### Phase 3: HR settings composition

- Create `HrCatalogSettingsPage`.
- Render only HR assignment catalogs:
  - Departments
  - Job titles
  - Employment types
  - Work modes
  - Client projects

### Phase 4: Routing and navigation

- Add `/settings/hr`.
- Update the settings index cards:
  - Company: profile, locations, structure.
  - HR: assignment catalogs.
  - Access: unchanged.
- Redirect `/settings/organization` to `/settings/hr` for backward compatibility.

### Phase 5: Tests and validation

- Update settings page tests to cover the new split.
- Keep existing unit/structure tests passing after extraction.
- Validate:
  - web typecheck
  - web lint
  - relevant web tests

## Naming decisions

- Use "HR" in navigation because the catalogs are employee-assignment oriented.
- Keep internal API/module names as `organization` for now to avoid churn.
- Prefer component extraction over backend or API renaming.

## Follow-up considerations

- Later, consider route-level pages for `/settings/company/locations` and `/settings/company/structure` if the Company screen becomes too dense.
- Later, consider moving organization frontend files into separate `company-structure` and `hr-catalogs` feature folders if the module keeps growing.
