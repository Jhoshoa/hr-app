# HR SaaS First Approach

> First product and architecture approach for a Bolivia-focused HR SaaS inspired by BambooHR Core, using the findings from:
>
> - `docs/brainstorm/hr-saas-product-findings.md`
> - `docs/brainstorm/bamboohr-company-review.md`
>
> Created: May 12, 2026.

---

## Product Thesis

Many outsourcing, software, and professional services companies in Bolivia and Latin America already pay for BambooHR or similar HR platforms. A 300-person company paying around $10 USD per employee/month spends about $3,000 USD/month for the base subscription before add-ons.

That creates a clear local opportunity: build a simpler, localized HR SaaS that covers the foundational HR features these companies use most, while avoiding US-specific or enterprise-heavy functionality in the first release.

The first version should not try to become a full global HR suite. It should become a strong HR operations system for Bolivia-based and Latin America-based companies that need:

- Employee records.
- Time off and leave management.
- Documents.
- Onboarding.
- Basic applicant tracking.
- Approval workflows.
- Reports.
- Manager and employee self-service.
- Spanish/English support.
- A modular path to payroll, performance, integrations, and analytics.

---

## Initial Market Focus

### Primary Customer

The first customer profile should be:

- Bolivia-based outsourcing companies.
- Software development agencies.
- Nearshore service companies.
- Professional services companies with 50-500 employees.
- Companies serving US clients but operating with Latin American teams.
- Companies currently using BambooHR, spreadsheets, or disconnected internal tools.

### Buyer Personas

| Persona | What They Need |
|---------|----------------|
| HR Manager | Clean employee records, documents, PTO, onboarding, reports, and less manual work. |
| Operations Manager | Visibility into headcount, teams, absences, changes, and onboarding status. |
| Finance / Admin | Payroll-ready employee data, exports, contracts, and absence information. |
| Managers | Team directory, approvals, time-off calendar, and onboarding tasks. |
| Employees | Self-service profile, documents, PTO requests, holidays, and task visibility. |
| Company Owner / Executive | Lower software cost, operational visibility, compliance confidence, and scalability. |

### Positioning

Recommended first positioning:

> A modern HR operations platform for Bolivia and Latin American service companies that need BambooHR-like core HR, localized workflows, and simpler pricing.

---

## BambooHR Core Features To Match

BambooHR Core is the best reference point for the first release because it focuses on foundational HR automation and insights. Based on the BambooHR review document, the Core-level feature set includes these areas:

| BambooHR Core Area | Include In First Version? | Notes |
|--------------------|---------------------------|-------|
| Employee records | Yes | Mandatory foundation. |
| Employee database / HRIS | Yes | Core system of record. |
| Standard and custom reports | Yes | Start with standard reports plus simple configurable exports. |
| Workflows and approvals | Yes | Needed for PTO, profile changes, documents, and onboarding tasks. |
| Dashboards | Yes | Start with operational HR dashboard. |
| AI assistant for HR data questions | Later | Useful, but not necessary for first release. |
| Candidate records | Yes | Keep ATS lightweight at first. |
| Job posting | Partial | Support internal/public job pages first; external job board integrations later. |
| Email templates | Yes | Useful and low-complexity. |
| Offer letter templates | Yes | Should support localized templates and e-signature later. |
| ATS job opening limits | Yes | Use plan limits as a pricing lever. |
| New-hire packet | Yes | Essential for onboarding. |
| Onboarding checklist | Yes | Essential. |
| E-signatures | Later / integration first | Start with file upload and acceptance tracking; add e-signature integration later. |
| Time-off management | Yes | Essential. |
| Time-off calendar | Yes | Essential. |
| Unlimited custom time-off policies | Yes | Important for Bolivia and company-specific policies. |
| Benefits tracking | Partial | Track benefits and assignments, but avoid full benefits administration at first. |
| Employee satisfaction | Later | Not foundational for first release. |
| Employee wellbeing | Later | Not foundational for first release. |
| Compliance intelligence | Localized later | Replace with Bolivia/LatAm policy templates and audit trails first. |
| Compliance training | Later | Can be added as document acknowledgements and training tracking later. |
| Mobile access | Responsive web first | Native apps later; mobile-friendly web is mandatory. |

---

## Bolivia-Specific Adjustments

### Features To Add Or Prioritize For Bolivia

These features are more valuable locally than copying BambooHR exactly:

- Spanish-first UI with English support.
- Bolivia holiday calendar.
- Company-specific holiday calendars for teams serving US clients.
- Leave policy templates for common Bolivia company practices.
- Contract and document templates for local HR operations.
- Employee fields for local identifiers and administrative data.
- Payroll export files instead of full payroll processing.
- USD and BOB currency support for compensation records.
- Remote, hybrid, office, and client-assigned work modes.
- Client/project assignment history for outsourcing companies.
- Equipment assignment tracking as a lightweight HR/operations feature.
- Document acknowledgement for policies, contracts, and internal rules.

### Features To Avoid In The First Version

These are not good first-release priorities:

- US payroll tax filing.
- US I-9 and E-Verify workflows.
- US benefits carrier connections.
- Full benefits administration.
- Mercer compensation benchmarking.
- Employer of Record.
- Advanced AI assistant.
- Complex compliance intelligence across many countries.
- Native mobile apps before the responsive web app is solid.
- Large enterprise talent suite functionality.

### Features To Keep Generic

Some features should be built in a generic way so they work in Bolivia first and other countries later:

- Holidays by country and company.
- Leave types and accrual rules.
- Document types.
- Employee identifiers.
- Compensation currency.
- Employment types.
- Contract types.
- Approval workflows.
- Report filters.

---

## First Release Scope

### Module 1: Organization Setup

Purpose: configure each customer company as a tenant.

Capabilities:

- Company profile.
- Departments.
- Locations.
- Job titles.
- Employment types.
- Work modes.
- Cost centers or client/project assignments.
- Holiday calendars.
- Default language.
- Default currency.
- User invitations.

### Module 2: Employee Records

Purpose: single source of truth for employee data.

Capabilities:

- Employee profile.
- Personal information.
- Contact information.
- Emergency contacts.
- Job information.
- Manager and reporting line.
- Department, location, role, employment type.
- Start date, termination date, employment status.
- Compensation snapshot.
- Client/project assignment.
- Custom fields.
- Profile change history.
- Import employees from CSV.
- Export employees to CSV/XLSX.

### Module 3: Directory And Org Chart

Purpose: help employees and managers understand the company structure.

Capabilities:

- Searchable employee directory.
- Filters by department, location, role, status, and manager.
- Public profile fields controlled by permissions.
- Org chart by reporting line.
- Team view for managers.

### Module 4: Documents

Purpose: centralize contracts, policies, IDs, certificates, and internal HR documents.

Capabilities:

- Document upload per employee.
- Company documents and policy library.
- Document categories.
- Expiration dates.
- Visibility controls.
- Employee acknowledgements for policies.
- Required document checklist.
- Missing document report.
- Download and export controls.

First version can use upload plus acknowledgement tracking. E-signature can be added later through integration.

### Module 5: Time Off And Leave

Purpose: replace manual PTO spreadsheets and chat-based leave requests.

Capabilities:

- Leave types.
- Leave policies.
- Accrual rules.
- Manual balance adjustments.
- Time-off requests.
- Manager approval flow.
- HR override.
- Team time-off calendar.
- Company holiday calendar.
- Employee leave balance view.
- Leave report.
- Audit history for balance changes.

Important leave types to support:

- Vacation.
- Sick leave.
- Personal leave.
- Unpaid leave.
- Maternity / paternity leave as configurable leave types.
- Company-specific special leave.

### Module 6: Workflows And Approvals

Purpose: provide reusable approval infrastructure for HR processes.

Capabilities:

- Approval rules by request type.
- Manager approval.
- HR approval.
- Multi-step approvals.
- Request comments.
- Status history.
- Notifications.
- Delegated approvers.
- Approval dashboard.

Initial request types:

- Time off.
- Employee profile change.
- Document acknowledgement.
- Onboarding task completion.
- Optional HR request.

### Module 7: Onboarding

Purpose: make new-hire setup repeatable.

Capabilities:

- Onboarding templates by role, department, location, and work mode.
- New-hire packet.
- Task assignment to HR, manager, IT/admin, finance, and employee.
- Due dates and reminders.
- Required document collection.
- Policy acknowledgement.
- First-day details.
- Onboarding progress dashboard.
- Convert candidate to employee if ATS is enabled.

### Module 8: Lightweight ATS

Purpose: match BambooHR Core enough for small HR teams without building a full recruiting suite.

Capabilities:

- Job openings.
- Public job page.
- Candidate records.
- Resume and document upload.
- Candidate status pipeline.
- Candidate rating.
- Interview notes.
- Email templates.
- Offer letter template.
- Candidate-to-employee conversion.
- Candidate source tracking.
- Basic hiring report.

First release should not require LinkedIn, Indeed, or other job board integrations. Start with shareable job links and manual candidate intake.

### Module 9: Reports And Dashboards

Purpose: give HR and leadership useful visibility.

Capabilities:

- HR home dashboard.
- Headcount by department.
- Headcount by location.
- Active, inactive, and terminated employees.
- New hires by period.
- Terminations by period.
- PTO balances.
- Upcoming time off.
- Missing documents.
- Onboarding progress.
- Open job openings.
- Candidate pipeline.
- Employee export.
- Leave export.
- Document compliance report.

Custom report builder can be basic in the first release: saved filters, visible columns, and CSV/XLSX export.

### Module 10: Notifications

Purpose: keep workflows moving without HR manually chasing people.

Capabilities:

- In-app notifications.
- Email notifications.
- Approval reminders.
- Onboarding task reminders.
- Document expiration reminders.
- Time-off status notifications.
- Candidate status notifications.

Slack or Teams notifications can be added later.

### Module 11: Permissions And Audit

Purpose: make the platform trustworthy for sensitive HR data.

Capabilities:

- Tenant isolation.
- Role-based access control.
- Permission groups.
- Employee self-service permissions.
- Manager self-service permissions.
- HR admin permissions.
- Field-level visibility for sensitive data.
- Audit log for sensitive changes.
- Audit log for document access.
- Login history.

Initial roles:

- Owner.
- HR Admin.
- HR Staff.
- Manager.
- Employee.
- Finance Viewer.
- Recruiter.

---

## Proposed Modular Architecture

The product should be architected as a modular SaaS from the beginning, even if it starts as a single deployable application. The main principle is: modular monolith first, clean boundaries always.

### Recommended Architecture Style

Use a modular monolith for the first product stage.

Reasons:

- Faster to build than microservices.
- Easier to deploy and debug.
- Lower infrastructure cost.
- Better for a small team.
- Still allows future extraction of modules if needed.

The codebase should be organized by domain modules, not only by technical layers.

Suggested modules:

- Identity and access.
- Tenants and billing.
- Organization.
- Employees.
- Documents.
- Leave.
- Workflows.
- Onboarding.
- Recruiting.
- Reports.
- Notifications.
- Audit.
- Integrations.

Each module should own:

- Data models.
- Business rules.
- Application services.
- API endpoints.
- Background jobs.
- Events it publishes.
- Events it consumes.

### Tenant Model

This must be multi-tenant from day one.

Recommended approach:

- Every business record has `tenant_id`.
- Tenant isolation is enforced in application queries and database constraints where possible.
- Users can belong to one or many tenants.
- Roles are assigned per tenant.
- Billing and plan limits are tenant-level.

Avoid separate databases per tenant in the first version unless there is a specific enterprise requirement. A shared database with strong tenant isolation is simpler and more cost-effective.

### Module Boundaries

| Module | Owns | Should Not Own |
|--------|------|----------------|
| Identity | Users, auth, sessions, MFA later | Employee business profile |
| Organization | Departments, locations, job titles, calendars | Personal employee data |
| Employees | Employee profiles, employment history, custom fields | Login credentials |
| Documents | Files, categories, acknowledgements, expiration | Leave balances |
| Leave | Leave policies, balances, requests, approvals | Payroll processing |
| Workflows | Generic approvals, status history, approvers | Module-specific business data |
| Onboarding | Templates, packets, tasks, progress | Candidate sourcing |
| Recruiting | Jobs, candidates, offers | Employee lifecycle after hire |
| Reports | Read models, exports, dashboard metrics | Source-of-truth writes |
| Notifications | Email, in-app alerts, templates | Business decisions |
| Audit | Change logs and access logs | Authorization policy itself |
| Integrations | External sync jobs and webhooks | Core domain rules |

### Event-Driven Internals

Use internal domain events to keep modules decoupled.

Example events:

- `employee.created`
- `employee.updated`
- `employee.terminated`
- `document.uploaded`
- `document.expiring_soon`
- `leave.requested`
- `leave.approved`
- `leave.rejected`
- `onboarding.started`
- `onboarding.task_completed`
- `candidate.converted_to_employee`

Events can initially be stored and processed in the same database/application. A message broker can be added later if scale requires it.

### API Strategy

The app should expose an internal product API first, with an external public API later.

Initial API needs:

- Authenticated JSON API.
- Tenant-aware endpoints.
- Pagination and filtering.
- Export endpoints for HR reports.
- File upload/download endpoints.
- Webhook-ready event records, even if public webhooks are added later.

Future external API:

- Employee read/write.
- Time-off requests.
- Documents metadata.
- Webhooks for employee and leave changes.
- API keys or OAuth client credentials.

### Data Security

Security is not optional because HR data is sensitive.

Required from the first release:

- Tenant isolation.
- RBAC.
- Field-level permissions for sensitive fields.
- Password hashing through a mature auth provider/library.
- Secure file storage.
- Signed URLs for document downloads.
- Audit log for sensitive changes.
- Encryption in transit.
- Encryption at rest through the database and storage provider.
- Backups.
- Principle of least privilege for admins and support users.

Later:

- MFA.
- SSO/SAML.
- SCIM.
- Data retention policies.
- Advanced audit exports.

---

## Data Model First Draft

Core entities:

- Tenant.
- User.
- Role.
- Permission.
- Employee.
- EmployeeFieldDefinition.
- EmployeeFieldValue.
- Department.
- Location.
- JobTitle.
- EmploymentType.
- ManagerRelationship.
- CompensationRecord.
- ClientAssignment.
- Document.
- DocumentCategory.
- DocumentAcknowledgement.
- LeaveType.
- LeavePolicy.
- LeaveBalance.
- LeaveRequest.
- HolidayCalendar.
- Holiday.
- WorkflowDefinition.
- ApprovalStep.
- ApprovalRequest.
- OnboardingTemplate.
- OnboardingPacket.
- OnboardingTask.
- JobOpening.
- Candidate.
- CandidateStage.
- OfferTemplate.
- Notification.
- AuditEvent.
- ReportView.
- BillingPlan.
- Subscription.

Important design choices:

- Keep employee login user and employee HR profile separate but linkable.
- Store compensation history instead of overwriting salary values.
- Store manager relationship history instead of only current manager.
- Store document metadata separately from file storage.
- Store leave balance transactions, not only current balance.
- Store audit events as append-only records.

---

## Suggested Pricing Strategy

BambooHR Core at 300 employees is roughly $3,000 USD/month before discounts and add-ons. A local competitor can be attractive without racing to the bottom.

Possible first pricing:

| Plan | Price Idea | Target |
|------|------------|--------|
| Starter | $4-$5 USD per employee/month | Companies replacing spreadsheets. |
| Core | $6-$8 USD per employee/month | Companies replacing BambooHR Core-like usage. |
| Plus | $9-$12 USD per employee/month | Adds ATS, onboarding, advanced reports, API, integrations. |

Recommended early strategy:

- Offer transparent pricing.
- Include a minimum monthly platform fee, for example $150-$250/month.
- Give annual discounts.
- Provide migration support as paid onboarding.
- Price in USD for outsourcing companies, with optional BOB invoice support.

Do not underprice too much. The product stores critical HR data and needs support, security, backups, and reliability.

---

## MVP Delivery Plan

### Milestone 1: Platform Foundation

- Multi-tenant setup.
- Authentication.
- Roles and permissions.
- Company setup.
- Departments, locations, job titles.
- Employee records.
- Employee import/export.
- Audit log.

### Milestone 2: Core HR Operations

- Employee directory.
- Org chart.
- Document storage.
- Document categories.
- Employee self-service profile.
- Manager team view.
- Basic reports.

### Milestone 3: Leave And Approvals

- Leave types.
- Leave policies.
- Leave balances.
- PTO requests.
- Manager approvals.
- Team time-off calendar.
- Holiday calendar.
- Leave reports.

### Milestone 4: Onboarding

- Onboarding templates.
- New-hire packets.
- Task assignments.
- Required documents.
- Progress tracking.
- Notifications and reminders.

### Milestone 5: Lightweight ATS

- Job openings.
- Candidate records.
- Candidate pipeline.
- Email templates.
- Offer templates.
- Candidate-to-employee conversion.
- Hiring report.

### Milestone 6: Polish And Pilot Readiness

- Spanish/English UI.
- Bolivia defaults.
- CSV/XLSX exports.
- Dashboard improvements.
- Support/admin tools.
- Backup and restore process.
- Security review.
- Pilot migration scripts.

---

## What Success Looks Like In The First Pilot

The first pilot should prove that a company can replace its basic BambooHR usage or spreadsheet-based HR operations.

Success criteria:

- HR can import all active employees.
- Employees can access their own profiles.
- Managers can see their teams.
- PTO requests and approvals work end to end.
- HR can see leave balances and time-off calendar.
- HR can upload and track documents.
- HR can onboard a new employee using templates.
- HR can export employee, leave, and document reports.
- Permissions prevent unauthorized access to sensitive information.
- The system is usable in Spanish and English.

---

## Risks And Mitigations

| Risk | Mitigation |
|------|------------|
| Competing directly with BambooHR is hard | Focus on Bolivia/LatAm outsourcing companies and local workflows. |
| HR data is sensitive | Build RBAC, audit logs, tenant isolation, and secure file handling from day one. |
| Payroll complexity can slow the product | Start with payroll-ready exports and integrations, not full payroll. |
| Local labor law details may be wrong | Make policies configurable and validate templates with local HR/legal experts. |
| Product becomes too broad | Keep first release limited to Core HR, leave, documents, onboarding, reports, and lightweight ATS. |
| Migration is painful | Build CSV import/export and migration support early. |
| Customers expect integrations | Start with exports, then add calendar and Slack/Teams, then API/webhooks. |

---

## Open Questions

- Which features does the current 300-person company actually use in BambooHR every week?
- Is ATS required in the first release, or can it be released after core HR and leave?
- Should the first buyer be outsourcing companies only, or broader Bolivia SMBs?
- Which local document types and employee fields are mandatory for Bolivia?
- Should payroll export target a specific payroll/accounting process first?
- Is the first version expected to support contractors, employees, or both?
- Should compensation be visible only to HR/finance, or also to managers?
- Which language should be default: Spanish, English, or tenant-configurable?

---

## Final Recommendation

Build a modular HR operations SaaS that starts with BambooHR Core-like functionality, but localizes the product for Bolivia and Latin American outsourcing companies.

The first release should include employee records, directory, documents, leave management, approvals, onboarding, lightweight ATS, reports, permissions, notifications, and audit logs. It should exclude full payroll, US-specific compliance, benefits administration, compensation benchmarking, and AI assistant functionality until the core product is stable.

The architecture should start as a modular monolith with strict domain boundaries, tenant isolation, RBAC, audit logging, secure document storage, and internal domain events. This gives the team enough speed for an MVP while preserving a clean path to future modules and integrations.
