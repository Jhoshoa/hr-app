# Tenant Configuration Scope And Priorities

Created: May 13, 2026.

## Purpose

This document expands the tenant/organization configuration scope beyond the catalogs already implemented under Organization Settings.

Current implemented catalogs:

- Departments.
- Locations.
- Job titles.
- Employment types.
- Work modes.
- Client projects.

Those are useful, but they are only the structural setup. A real HR SaaS tenant also needs policies, calendars, document rules, employee field configuration, access settings, notifications, and module-level defaults.

The main implementation principle:

```text
Simple reference data can use catalog tables and drawer forms.
Business rules and policy-heavy configuration need dedicated pages.
```

## Configuration Categories

### 1. Company Profile And Localization

Purpose:

- Define tenant identity and default operating context.

Settings:

- Company legal name.
- Display name.
- Tax/legal identifier.
- Main country.
- Main timezone.
- Default language.
- Default currency.
- Date format.
- Work week start day.
- Company logo later.

UI shape:

- Dedicated page: `/settings/company`.
- Form-based layout, not a table.

Backend shape:

- `GET /tenants/current`
- `PATCH /tenants/current`

Priority:

- **Now / soon.**

Reason:

- `Tenant` already has `name`, `slug`, `defaultLanguage`, `defaultCurrency`, and `timezone`.
- This is low complexity and affects the whole product.

## 2. Holiday Calendars

Purpose:

- Support Bolivia holidays, company-specific holidays, and client/location calendars.

Settings:

- Holiday calendars.
- Calendar country.
- Optional location.
- Holiday name.
- Holiday date.
- Recurring yearly flag.
- Half-day flag later.
- Paid/non-paid flag later.

UI shape:

- Dedicated page: `/settings/holidays`.
- Calendar list plus holiday table.
- Drawer works for adding one holiday.
- Bulk import/generate holidays should be a page action.

Backend shape:

- `GET /holiday-calendars`
- `POST /holiday-calendars`
- `PATCH /holiday-calendars/:id`
- `POST /holiday-calendars/:id/archive`
- `GET /holiday-calendars/:id/holidays`
- `POST /holiday-calendars/:id/holidays`
- `PATCH /holidays/:id`
- `POST /holidays/:id/archive`

Priority:

- **Next after Organization Settings and before Leave.**

Reason:

- Leave calculation and time-off calendars depend on holidays.
- Bolivia-specific value depends heavily on this.

## 3. Leave Types

Purpose:

- Define what employees can request.

Settings:

- Name.
- Code.
- Paid/unpaid.
- Requires approval.
- Requires attachment.
- Minimum notice days.
- Allow half days.
- Status.

Examples:

- Vacation.
- Sick leave.
- Personal leave.
- Unpaid leave.
- Maternity leave.
- Paternity leave.
- Bereavement or special company leave.

UI shape:

- Catalog-like table, but with more fields than current simple catalogs.
- Drawer is still fine for create/edit.

Backend shape:

- `GET /leave-types`
- `POST /leave-types`
- `PATCH /leave-types/:id`
- `POST /leave-types/:id/archive`
- `POST /leave-types/:id/reactivate`

Priority:

- **Next, together with holiday calendars.**

Reason:

- Leave Policies cannot exist without Leave Types.

## 4. Leave Policies

Purpose:

- Define accrual and balance rules for each leave type.

Settings:

- Policy name.
- Leave type.
- Applies to employment types.
- Applies to locations.
- Applies to departments optionally.
- Accrual method:
  - none/manual
  - fixed annual allowance
  - monthly accrual
  - anniversary-based accrual later
- Annual allowance.
- Accrual frequency.
- Carryover limit.
- Carryover expiration.
- Proration for new hires.
- Negative balance allowed.
- Approval workflow.
- Effective date.

UI shape:

- Dedicated page: `/settings/leave-policies`.
- Not a simple drawer-only table.
- Use a policy detail page or multi-section drawer because the rules are more complex.

Backend shape:

- `GET /leave-policies`
- `POST /leave-policies`
- `GET /leave-policies/:id`
- `PATCH /leave-policies/:id`
- `POST /leave-policies/:id/archive`
- `POST /leave-policies/:id/assignments`

Priority:

- **Implement after Holiday Calendars and Leave Types.**

Reason:

- This is central to PTO but has business rules that need careful tests.

## 5. Approval Workflows

Purpose:

- Configure who approves which process.

Settings:

- Workflow name.
- Request type:
  - time off
  - employee profile change
  - document acknowledgement exception later
  - onboarding task approval later
- Steps.
- Approver type:
  - direct manager
  - HR admin
  - specific role
  - specific user later
- Escalation/delegation later.

UI shape:

- Dedicated page: `/settings/workflows`.
- Needs a workflow builder-like UI, but the first version can be a simple ordered step editor.

Backend shape:

- `GET /workflow-definitions`
- `POST /workflow-definitions`
- `PATCH /workflow-definitions/:id`
- `POST /workflow-definitions/:id/archive`
- `PUT /workflow-definitions/:id/steps`

Priority:

- **After basic Leave Policies or as part of Leave MVP.**

Reason:

- Leave request approval needs at least manager + HR rules.
- But full reusable workflows can be simplified initially.

Recommended first shortcut:

- Hard-code default leave approval behavior first:
  - manager approval
  - HR override
- Add configurable workflows after leave request flow is stable.

## 6. Employee Custom Fields

Purpose:

- Let each tenant configure extra employee profile fields without schema changes.

Settings:

- Key.
- Label.
- Type:
  - text
  - number
  - date
  - boolean
  - select
  - multi-select
- Required flag.
- Visibility:
  - HR only
  - manager visible
  - employee visible
- Options for select fields.

UI shape:

- Dedicated page: `/settings/employee-fields`.
- Table plus drawer is acceptable.
- Select/multi-select options need embedded field controls.

Backend shape:

- Existing schema already includes `EmployeeCustomFieldDefinition`.
- Needed endpoints:
  - `GET /employee-custom-fields`
  - `POST /employee-custom-fields`
  - `PATCH /employee-custom-fields/:id`
  - `POST /employee-custom-fields/:id/archive`

Priority:

- **Soon, before deep Employee Profile work.**

Reason:

- Employee profile forms need to know custom fields.
- This avoids hard-coding Bolivia/customer-specific fields too early.

## 7. Document Categories And Requirements

Purpose:

- Define document types, required documents, acknowledgements, and expiration behavior.

Settings:

- Category name.
- Applies to:
  - employee documents
  - company policies
  - candidate documents later
- Requires acknowledgement.
- Requires expiration date.
- Required for employment types.
- Required for locations.
- Required for job titles optionally.
- Visibility.

Examples:

- Employment contract.
- ID document.
- Confidentiality agreement.
- Company handbook.
- Remote work policy.
- Client-specific policy.

UI shape:

- Dedicated page: `/settings/documents`.
- Category table plus requirements panel.
- Not just a two-input catalog because requirement rules affect missing document reports.

Backend shape:

- `GET /document-categories`
- `POST /document-categories`
- `PATCH /document-categories/:id`
- `POST /document-categories/:id/archive`
- `GET /document-requirements`
- `PUT /document-requirements`

Priority:

- **After Employee Core, before Documents MVP.**

Reason:

- Documents cannot produce useful missing/expiring reports without category rules.

## 8. Onboarding Templates

Purpose:

- Configure repeatable onboarding processes by role, department, location, or work mode.

Settings:

- Template name.
- Applies to department/job title/location/work mode.
- Tasks.
- Task owner type:
  - HR
  - manager
  - employee
  - IT/admin
  - finance
- Due offset days.
- Required document references.
- Policy acknowledgement references.

UI shape:

- Full page: `/settings/onboarding/templates`.
- Template detail page is better than drawer.

Backend shape:

- `GET /onboarding-templates`
- `POST /onboarding-templates`
- `GET /onboarding-templates/:id`
- `PATCH /onboarding-templates/:id`
- `PUT /onboarding-templates/:id/tasks`
- `POST /onboarding-templates/:id/archive`

Priority:

- **Later, after Documents and Employee Core.**

Reason:

- Depends on employees, documents, and assignment catalogs.

## 9. Notification Settings

Purpose:

- Control reminders and communication defaults.

Settings:

- Email notifications enabled.
- In-app notifications enabled.
- Time-off request notifications.
- Approval reminder cadence.
- Document expiration reminder days.
- Onboarding task reminder cadence.
- Default sender name/email later.

UI shape:

- Dedicated page: `/settings/notifications`.
- Form with grouped toggles and numeric inputs.

Backend shape:

- `GET /notification-settings`
- `PATCH /notification-settings`

Priority:

- **Later, when notifications module exists.**

Reason:

- No immediate value until emails/in-app notifications are implemented.

## 10. Access And User Management

Purpose:

- Control tenant membership, invitations, roles, and optional domain-based access.

Settings:

- Users.
- Invitations.
- Roles.
- Permissions.
- Allowed email domains.
- Self-join mode.
- Access request behavior.

UI shape:

- Multiple dedicated pages:
  - `/settings/users`
  - `/settings/roles`
  - `/settings/access`

Backend shape:

- Already planned in `tenant-onboarding-and-access-plan.md`.

Priority:

- **Users/invitations soon for production readiness.**
- **Domain/self-join later.**

Reason:

- Local auto-join is only a development shortcut.
- Production requires explicit tenant access management.

## 11. Reports And Export Settings

Purpose:

- Configure saved reports and export defaults.

Settings:

- Saved report definitions.
- Default visible columns.
- Export format.
- Timezone/currency used in exports.
- Scheduled exports later.

UI shape:

- Reports module pages, not only Settings.
- Settings may expose defaults, but report creation belongs under `/reports`.

Backend shape:

- `GET /saved-reports`
- `POST /saved-reports`
- `PATCH /saved-reports/:id`
- `POST /exports`

Priority:

- **Later.**

Reason:

- Depends on stable Employee, Leave, Documents, and Onboarding data.

## 12. Billing And Plan Limits

Purpose:

- Track subscription status and feature limits per tenant.

Settings:

- Current plan.
- Employee limit.
- Job opening limit.
- Storage usage.
- Enabled modules.
- Billing contact.

UI shape:

- Dedicated page: `/settings/billing`.
- Mostly read-only at first.

Backend shape:

- `GET /billing/current`
- `PATCH /billing/current` only for internal/admin later.

Priority:

- **Later, before paid pilot or production billing.**

Reason:

- Not needed for local feature development, but important before real customers.

## Priority Recommendation

### Implement Now / Next

1. **Company Profile And Localization**
   - Small backend/frontend scope.
   - Uses existing `Tenant` fields.
   - Should live in Settings.

2. **Holiday Calendars**
   - Required for leave and Bolivia localization.
   - Needs schema and dedicated UI.

3. **Leave Types**
   - Required before Leave Policies.
   - Can be table + drawer.

4. **Employee Custom Fields**
   - Already partially modeled.
   - Important before overbuilding employee profile fields.

### Implement After Employee Core

5. **Leave Policies**
   - Needs real employee/job assignment data.
   - Requires stronger tests.

6. **Document Categories And Requirements**
   - Should come before full Documents MVP.

7. **Users And Invitations**
   - Needed before production use.
   - Can be implemented in parallel with Employee Core if auth/access becomes blocking.

### Implement Later

8. **Approval Workflows**
   - Start with a default leave approval rule first.
   - Build configurable workflows after the first approval flow works.

9. **Onboarding Templates**
   - Depends on employee/document foundations.

10. **Notification Settings**
    - Depends on notification delivery infrastructure.

11. **Reports And Export Settings**
    - Depends on stable source data.

12. **Billing And Plan Limits**
    - Needed for production commercialization, not for current HR core development.

## Recommended Next Implementation Slice

The best next tenant-configuration slice is:

```text
Company Profile + Holiday Calendars + Leave Types
```

Why:

- Company Profile completes the basic tenant setup surface.
- Holiday Calendars and Leave Types unblock the Leave module.
- Leave is one of the most important first-release workflows.
- These features are still manageable before implementing complex Leave Policies.

Avoid implementing full Leave Policies, Workflows, and Onboarding Templates in the same slice. Those require more domain rules, stronger tests, and more careful UI design.


Resumen de la recomendación:

  - Implementar ahora/siguiente:
      - Company Profile + Localization
      - Holiday Calendars
      - Leave Types
      - Leave Policies
      - Document Categories + Requirements
      - Users + Invitations para producción
  - Más adelante:
      - Approval Workflows configurables
      - Onboarding Templates
      - Notification Settings
      - Reports/export settings
      - Billing/plan limits


