# Language Translation Analysis

## Current State

The app currently stores language preference, but it does not translate the product UI.

Implemented today:

- Company signup captures `preferredLanguage` with `es` and `en`.
- Tenant settings stores `defaultLanguage` with `es` and `en`.
- Backend validates both fields.
- Approved company signup copies `preferredLanguage` into tenant `defaultLanguage`.
- `next-intl` is installed and wired minimally.

Not implemented today:

- The active UI locale is not derived from tenant, user, route, cookie, or browser preference.
- `apps/web/app/layout.tsx` hardcodes `locale="es"` and imports only `es.json`.
- `apps/web/src/i18n/messages/en.json` and `es.json` only contain `app.name`.
- Most labels, tabs, table headers, buttons, toasts, validation messages, empty states, and page titles are hardcoded in English.

This means the language selectors are currently configuration data, not an actual app translation feature.

## Product Risk

Leaving the selector visible in v1 can confuse users because selecting Spanish or English does not change the interface. In a SaaS app for the United States market, that mismatch is worse than simply shipping English-only at first.

The field is still useful as future-facing data:

- It can drive email language later.
- It can set the default locale once localization is implemented.
- It can help support teams understand customer preference.
- It can be used for employee-facing self-service pages before the admin console is fully localized.

However, until the UI honors it, the label should not imply that the app will immediately switch languages.

## Browser Translation

Browser translation can help some users, but it should not be treated as product localization.

Pros:

- No engineering cost.
- Useful as a temporary accessibility fallback for users who prefer Spanish.
- Works for static visible text in many browsers.

Cons:

- It is inconsistent across Chrome, Edge, Firefox, and Safari.
- It may mistranslate HR, legal, payroll, benefits, job, and compliance language.
- It can miss dynamic toasts, validation messages, select options, modals, and embedded app surfaces.
- It can alter labels in ways that do not match support docs or screenshots.
- It cannot reliably translate emails, PDFs, exports, audit logs, or backend-generated messages.
- It creates QA uncertainty because translated output is controlled by the browser, not the product.

Recommended use: allow browser translation as a fallback, but do not design the product around it.

## Options

### Option 1: English-only v1 and hide language selector

This is the most practical v1 option for a US-focused SaaS product.

Behavior:

- Keep storing `preferredLanguage/defaultLanguage` in the database.
- Hide or temporarily remove the language selector from Company signup and Company settings.
- Default new tenants to `en`.
- Keep backend support for `es/en` so the schema does not need to be reversed later.
- Add a clear internal note that localization is planned but not active.

Pros:

- No misleading UI.
- Lower delivery risk.
- Keeps product, support, screenshots, and tests consistent.
- Best fit if the initial buyer/admin audience is US-based.

Cons:

- Spanish-speaking users rely on browser translation for now.
- Future localization still requires systematic work.

Recommendation: best for v1 unless Spanish UI is a hard requirement for launch.

### Option 2: Keep selector but relabel it as communication preference

Behavior:

- Keep the selector visible.
- Rename it from "Preferred language" / "Default language" to something like "Communication language".
- Use helper text: "Used for future emails and support communications. App interface is currently English."

Pros:

- Honest about current behavior.
- Preserves useful data collection.
- Good if sales/support wants to know customer language preference early.

Cons:

- Adds explanatory UI.
- Still risks some confusion if users expect app translation.

Recommendation: acceptable if we need to collect the preference now, but not as clean as hiding it.

### Option 3: Start full app localization now

Behavior:

- Use `next-intl` across all user-facing UI.
- Move strings into namespaced message files.
- Add locale resolution from tenant/user preference.
- Add route, cookie, or middleware strategy.
- Translate English and Spanish for all active screens.
- Localize dates, currency, status labels, validation messages, toasts, emails, and exported content.

Pros:

- Correct long-term architecture.
- Avoids growing hardcoded strings.
- Better for multilingual customers.

Cons:

- Large scope right now.
- Requires content QA, translation QA, and a strategy for tenant/user locale precedence.
- Every new feature must follow localization discipline.
- Can slow development while core SaaS modules are still changing heavily.

Recommendation: do not start full app localization unless multilingual UI is part of the near-term product commitment.

### Option 4: Localize only employee self-service first

Behavior:

- Keep admin/product configuration screens English-only.
- Localize employee-facing profile/self-service flows first.
- Use the employee/user preference when available.
- Keep tenant default as fallback.

Pros:

- Good fit for HR SaaS because employees are the largest and most diverse user group.
- Smaller translation surface.
- Reduces risk around complex admin workflows.
- Easier to QA.

Cons:

- Mixed-language product experience.
- Requires a clear boundary: employee self-service is localized, admin console is not.

Recommendation: strong phase 2 approach after v1 foundation stabilizes.

## Recommended Strategy

For this SaaS app targeting the United States market:

1. Ship v1 admin console in English.
2. Hide the language selector from Company settings for now, or relabel it as communication preference if product wants to keep collecting it.
3. In Company signup, either hide `preferredLanguage` and default it to `en`, or relabel it as communication language with clear helper text.
4. Keep backend fields and validation in place.
5. Keep `next-intl` installed, but do not convert everything until there is a real localization milestone.
6. When localization starts, begin with employee self-service/profile flows, then expand to admin modules.

This avoids misleading users while preserving the future path.

## Best-Practice Localization Architecture

When the app is ready for real localization, use this approach:

### Locale Ownership

Use this precedence:

1. Explicit user preference, when user profile settings exist.
2. Tenant default language.
3. Browser `Accept-Language`.
4. Product default: `en`.

For public company signup:

1. Route or cookie locale, if implemented.
2. Browser `Accept-Language`.
3. Product default: `en`.

### Next.js / next-intl Implementation

Recommended structure:

- Add locale-aware routing or middleware only when the app is ready to support visible locale switching.
- Use `next-intl` message namespaces by domain:
  - `common`
  - `settings.company`
  - `settings.hr`
  - `organizationUnits`
  - `employees`
  - `auth`
  - `companySignup`
  - `validation`
- Use `useTranslations()` in client components.
- Use server-side message loading for layouts/routes.
- Avoid passing entire message catalogs to deeply nested client components when only a namespace is needed.
- Keep messages statically analyzable to avoid unnecessary bundle bloat.

### Text Ownership

Move these into translation files:

- Page titles and descriptions.
- Tab names.
- Table headers.
- Button labels.
- Drawer titles.
- Empty/error/loading states.
- Toast titles and descriptions.
- Confirmation modal text.
- Form labels and helper text.
- Status labels like Active, Archived, Pending.
- Validation messages.

Keep these out of translation files:

- User-entered data.
- Tenant-created names such as departments, locations, job titles, organization units.
- Permission keys and internal codes.
- Audit event keys, though display labels can be translated.

### Backend Messages

Backend should continue returning stable machine-readable error codes. Frontend should translate user-visible messages from codes when possible.

Preferred response shape:

```json
{
  "error": {
    "code": "ORGANIZATION_UNIT_TYPE_KEY_EXISTS",
    "message": "Organization unit type key already exists."
  }
}
```

Frontend behavior:

- Prefer translating `code`.
- Fall back to backend `message` if no translation exists.
- Keep backend messages in English for logs and API consumers.

### Formatting

Localization is not only translation.

Use locale-aware formatting for:

- Dates and times.
- Currency.
- Numbers.
- Percentages.
- Timezones.

Current helpers default to `es-BO` and `BOB` in places. For a US-focused v1, defaults should move toward:

- `en-US`
- `USD`
- Tenant timezone, commonly US timezones for US customers.

Tenant overrides can still support other countries.

## Suggested V1 Changes

Minimal recommended implementation:

- Company signup:
  - Remove the visible `Preferred language` field.
  - Submit `preferredLanguage: "en"` by default.
  - Keep backend validation unchanged.
- Company settings:
  - Remove the visible `Default language` field from the Profile tab.
  - Continue sending the existing `defaultLanguage` only when backend requires it, or omit it from updates if not changed.
  - Keep the database field.
- Seed/defaults:
  - For US demo tenants, use `defaultLanguage: "en"`, `defaultCurrency: "USD"`, and a US timezone.
- Docs:
  - Mark app localization as planned, not active.

Alternative if we still want the field visible:

- Rename to `Communication language`.
- Add helper text: `Used for future emails and support communications. The app interface is currently English.`

## Future Phases

### Phase 1: Localization foundation

- Decide locale routing strategy.
- Add locale resolution utility.
- Expand message files.
- Convert shared UI primitives and layout shell first.
- Add tests for locale resolution.

### Phase 2: Employee self-service localization

- Convert employee profile pages.
- Translate employee-facing validation and toasts.
- Format dates/currency from locale and tenant settings.
- Add English/Spanish test coverage for the main profile flow.

### Phase 3: Admin settings localization

- Convert Settings > Company, HR, Access.
- Translate confirmation modals and destructive-action warnings.
- Add coverage for locale switching.

### Phase 4: System outputs

- Emails.
- CSV/PDF exports.
- Invite messages.
- Audit display labels.
- Support/admin review screens.

## Final Recommendation

Do not promise full translation in v1 through a language selector.

For the current product maturity and US SaaS target, the best decision is:

- English-only admin UI for v1.
- Hide or relabel language fields so they do not imply UI translation.
- Keep backend fields for future use.
- Localize employee-facing profile/self-service flows first when translation becomes a committed product milestone.

