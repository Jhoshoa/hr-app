# HR SaaS Product Findings & Core Feature Direction

> Follow-up notes from reviewing `hr-saas-landscape.md`. This document focuses on what the product should solve, which features matter most, and how to think about scope for an HR SaaS.

---

## Summary Findings

The HR SaaS market is crowded, but most successful products win by being strong in one of these positions:

- Simple core HR for small and mid-sized companies.
- Payroll and compliance-first HR operations.
- Global workforce management for distributed teams.
- Employee experience, engagement, and culture.
- Enterprise talent suite with analytics, workflows, and integrations.

For a new HR SaaS, the best starting point is not to copy every large suite. The product should first solve the daily operational pain of keeping employee data, time off, documents, approvals, onboarding, and reporting reliable in one place.

The initial product should feel like a system of record for HR teams, managers, and employees. Payroll, benefits, recruiting, learning, and advanced analytics can be added later or integrated with specialized providers.

---

## Problems An HR SaaS Should Solve

### 1. Fragmented Employee Information

Many companies keep employee data across spreadsheets, email threads, shared drives, payroll systems, chat tools, and paper forms. This creates outdated records, duplicated work, and poor visibility.

The product should solve this by providing:

- A single employee profile.
- Job, compensation, manager, department, and location history.
- Secure document storage.
- Custom fields for company-specific data.
- Org chart and directory views.

### 2. Manual HR Requests And Approvals

HR teams spend too much time answering repeated questions and manually routing requests for PTO, schedule changes, document updates, onboarding tasks, and policy exceptions.

The product should solve this by providing:

- Employee self-service.
- Manager approval workflows.
- Request tracking.
- Notifications and reminders.
- Clear status history for each request.

### 3. Time Off And Absence Confusion

PTO, sick leave, holidays, accruals, balances, and approvals are common sources of mistakes. Employees need clarity, managers need team visibility, and HR needs policy control.

The product should solve this by providing:

- Leave policies and accrual rules.
- PTO balances.
- Leave request and approval flows.
- Team calendar views.
- Holiday calendars by location.
- Audit history for changes.

### 4. Inconsistent Onboarding And Offboarding

New hires often miss documents, system access, training, equipment, or first-week tasks. Offboarding can also miss access removal, final documents, and exit feedback.

The product should solve this by providing:

- Role-based onboarding checklists.
- Assigned tasks for HR, managers, IT, finance, and new hires.
- Document collection and signing workflow.
- Offboarding checklists.
- Exit interview tracking.

### 5. Compliance And Audit Risk

HR data is sensitive. Companies need controls around who can see or change employee records, documents, compensation, identity information, and employment history.

The product should solve this by providing:

- Role-based permissions.
- Audit logs.
- Data retention settings.
- Secure document access.
- Compliance-ready reporting.
- MFA and SSO support as the product matures.

### 6. Poor Visibility For Managers

Managers need fast access to team information, pending approvals, time-off calendars, performance notes, and employee changes. Without this, HR becomes a bottleneck.

The product should solve this by providing:

- Manager dashboard.
- Team directory and org chart.
- Pending approval queue.
- Team absence calendar.
- Employee milestones and changes.
- Basic team analytics.

### 7. Weak Reporting And Decision Support

HR leaders need headcount, turnover, absences, hiring, compensation, and diversity metrics. Many small companies do not have clean enough data to answer basic workforce questions.

The product should solve this by providing:

- Standard HR reports.
- Filterable employee lists.
- Exportable data.
- Headcount and turnover dashboards.
- Absence and PTO reporting.
- Custom report builder in later phases.

---

## Main Feature Areas The Product Needs

### Must-Have Features For An MVP

These features create the minimum useful HR system of record.

| Feature | Why It Matters |
|---------|----------------|
| Employee database | Core source of truth for all people data. |
| Employee profiles | Central place for personal, job, manager, compensation, and document information. |
| Org chart and directory | Helps everyone understand teams, reporting lines, and contacts. |
| Role-based permissions | Required because HR data is sensitive. |
| Employee self-service | Reduces HR admin work and gives employees direct access to their information. |
| Manager self-service | Lets managers approve requests and manage team information. |
| Leave and absence management | High-frequency HR workflow with clear business value. |
| Approval workflows | Needed for PTO, profile changes, onboarding tasks, and HR requests. |
| Document management | Stores contracts, policies, IDs, certificates, and HR forms. |
| Onboarding checklists | Makes new-hire setup consistent and trackable. |
| Notifications | Keeps approvals, tasks, and changes moving. |
| Basic reports | Gives HR teams visibility into headcount, PTO, and employee data. |
| Audit log | Creates accountability for sensitive data changes. |

### Strong Version 1 Features

These features make the product more complete after the MVP is stable.

| Feature | Why It Matters |
|---------|----------------|
| Offboarding workflows | Reduces access, compliance, and final-document risk. |
| Time and attendance | Important for hourly teams, shift workers, and payroll preparation. |
| Performance reviews | Adds value for managers and growing organizations. |
| Goals and check-ins | Supports ongoing performance conversations. |
| Engagement surveys | Helps HR measure sentiment and retention risk. |
| Custom fields | Makes the system adaptable to different companies. |
| Custom workflows | Lets companies model their internal HR processes. |
| Calendar integrations | Improves PTO visibility in daily tools. |
| SSO | Needed for more mature customers and better security. |
| API and webhooks | Enables integration with payroll, accounting, identity, and communication tools. |

### Later-Stage Or Integration-First Features

These are valuable, but they are complex enough that they should be delayed or handled through integrations at first.

| Feature | Suggested Approach |
|---------|--------------------|
| Payroll | Integrate first unless the product strategy is payroll-first. |
| Benefits administration | Integrate first; regulations and plan logic are complex. |
| Applicant tracking | Add later if recruiting is part of the target market. |
| Learning management | Add later or integrate with LMS tools. |
| Compensation planning | Add after strong employee and manager data exists. |
| Advanced analytics | Build after clean data and reporting foundations are in place. |
| Multi-country compliance | Add only for global or remote-first positioning. |
| AI features | Add after core workflows are reliable and data quality is high. |

---

## Recommended Product Scope

### Phase 1: Core HR System

Build the reliable foundation:

- Employee records.
- Departments, roles, locations, and managers.
- Org chart.
- Documents.
- Permissions.
- Basic employee and manager self-service.
- Audit log.

### Phase 2: Daily HR Operations

Add the workflows that HR teams use every week:

- PTO and absence management.
- Approval workflows.
- Notifications.
- HR request tracking.
- Onboarding checklists.
- Basic reporting.

### Phase 3: Manager And Employee Experience

Make the system useful beyond HR:

- Manager dashboard.
- Team calendar.
- Employee milestones.
- Company announcements.
- Engagement pulse surveys.
- Basic performance reviews.

### Phase 4: Integrations And Scale

Prepare the product for larger customers:

- Payroll integrations.
- Calendar integrations.
- Slack or Teams notifications.
- SSO.
- API and webhooks.
- Custom fields and custom workflows.
- Advanced reporting.

---

## Key Design Principles

- Make HR data easy to trust. Every important record should have an owner, history, and permissions.
- Reduce HR admin work. Common requests should be self-service or workflow-driven.
- Give managers useful tools without exposing unnecessary sensitive data.
- Keep the employee experience simple. Employees should quickly find documents, request leave, update details, and see pending tasks.
- Start with operational reliability before adding AI or advanced analytics.
- Prefer integrations for legally complex areas like payroll, taxes, benefits, and country-specific compliance.

---

## Suggested Differentiation

A practical HR SaaS can stand out by focusing on:

- Fast setup for SMB and mid-market teams.
- Clean UX for HR, managers, and employees.
- Flexible workflows without enterprise complexity.
- Strong permissions and auditability from the beginning.
- Good reporting based on clean core HR data.
- Integration-ready architecture instead of trying to own every HR function immediately.

---

## MVP Feature Checklist

- [ ] Company setup.
- [ ] Departments, job titles, locations, and employment types.
- [ ] Employee profile.
- [ ] Employee directory.
- [ ] Org chart.
- [ ] Document storage.
- [ ] Role-based permissions.
- [ ] Employee self-service profile updates.
- [ ] Manager approval queue.
- [ ] PTO policies.
- [ ] PTO requests and approvals.
- [ ] Leave balances.
- [ ] Team time-off calendar.
- [ ] Onboarding templates.
- [ ] Onboarding task assignments.
- [ ] Notifications and reminders.
- [ ] Basic reports and exports.
- [ ] Audit log.

---

## Main Takeaway

The product should start as a clean, secure HR operations hub. The core promise should be: one reliable place to manage employees, documents, approvals, time off, onboarding, and basic workforce reporting.

Once that foundation works well, the product can expand into performance, engagement, integrations, payroll, benefits, recruiting, and AI-assisted workflows.
