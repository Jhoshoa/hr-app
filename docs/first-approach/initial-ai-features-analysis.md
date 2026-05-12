# Initial AI Features Analysis

> First analysis of practical AI features for the Bolivia/LatAm HR SaaS first approach.
>
> Created: May 12, 2026.

---

## Recommendation

AI should be included in the product early, but only in low-risk assistant workflows. The first version should not use AI to make hiring, firing, compensation, promotion, or disciplinary decisions.

The best initial AI direction is:

- Help HR find information faster.
- Generate drafts that humans review.
- Summarize employee, document, onboarding, and leave data.
- Improve reporting and search.
- Reduce repetitive HR writing.

This gives the product a modern advantage without creating unnecessary compliance, bias, or trust risks.

---

## AI Principles

- AI should assist, not decide.
- Every AI-generated output should be editable.
- Sensitive employee data must follow tenant permissions.
- AI must only use data the current user is allowed to access.
- AI actions should be logged when they touch sensitive HR workflows.
- AI should cite or link the internal records it used when possible.
- Avoid black-box scoring of candidates or employees in the first release.
- Do not send unnecessary sensitive data to AI providers.

---

## Best Initial AI Features

### 1. HR Knowledge Assistant

Purpose: let HR, managers, and employees ask questions about company policies, documents, holidays, leave rules, and onboarding processes.

Examples:

- "How many vacation days do I have?"
- "What is the policy for sick leave?"
- "Which documents are missing from Juan's profile?"
- "What holidays apply to the Bolivia office this month?"
- "What tasks are pending for this new hire?"

Why this is valuable:

- Reduces repeated HR questions.
- Makes policies easier to understand.
- Helps employees self-serve.
- Creates a clear AI feature that is useful from day one.

Initial scope:

- Answer from company policy documents.
- Answer from employee leave balances.
- Answer from onboarding tasks.
- Answer from holiday calendars.
- Respect role-based permissions.

Avoid initially:

- Giving legal advice.
- Interpreting labor law without verified templates.
- Answering from data the user cannot access.

Priority: P0 / P1.

---

### 2. AI Document Summaries

Purpose: summarize HR documents, policies, contracts, and employee files.

Examples:

- Summarize a policy in plain Spanish.
- Extract key dates from a contract.
- Identify whether a document appears to be a contract, ID, certificate, or policy.
- Summarize missing or expiring documents for an employee.

Why this is valuable:

- HR teams handle many documents.
- It saves time during onboarding and audits.
- It supports the document module directly.

Initial scope:

- Summary of uploaded policy documents.
- Document type suggestion.
- Expiration date suggestion.
- Missing document checklist summary.

Avoid initially:

- Treating AI extraction as final truth.
- Automatically approving documents without HR review.

Priority: P1.

---

### 3. AI Drafting For HR Communication

Purpose: help HR write clear messages faster.

Examples:

- Draft onboarding welcome emails.
- Draft interview invitation emails.
- Draft offer letter text from a template.
- Draft policy announcement messages.
- Rewrite HR messages in a more formal, friendly, or concise tone.
- Translate HR messages between Spanish and English.

Why this is valuable:

- Low implementation risk.
- High daily usefulness.
- Fits Bolivia/outsourcing companies that work in Spanish and English.

Initial scope:

- Onboarding emails.
- Candidate emails.
- Time-off approval/rejection messages.
- Policy announcements.
- Spanish/English translation.

Avoid initially:

- Sending AI-generated messages automatically.
- Generating legal contract language without reviewed templates.

Priority: P0 / P1.

---

### 4. AI Employee Profile Summary

Purpose: give HR and managers a quick summary of relevant employee information.

Examples:

- Current role, department, manager, location, and start date.
- Active documents and missing documents.
- Upcoming time off.
- Current onboarding/offboarding status.
- Recent profile changes.

Why this is valuable:

- Managers and HR can understand context quickly.
- Useful for 300+ employee companies.
- Works well with the core HR system.

Initial scope:

- HR-only summary.
- Manager summary for direct reports.
- Employee self-summary.
- Permission-aware content.

Avoid initially:

- Sentiment inference.
- Performance prediction.
- Attrition risk scoring.

Priority: P1.

---

### 5. Natural Language Reports

Purpose: allow HR users to ask for reports in plain language.

Examples:

- "Show headcount by department."
- "Who has missing documents?"
- "Which employees have PTO scheduled next week?"
- "Show new hires from the last 30 days."
- "Export employees in Cochabamba with active status."

Why this is valuable:

- Makes reporting easier for non-technical HR users.
- Differentiates the product from basic HR tools.
- Can start simple with predefined report intents.

Initial scope:

- Convert simple questions into existing report filters.
- Show preview before export.
- Support saved reports.

Avoid initially:

- Free-form database queries.
- Reports over unauthorized fields.
- Complex analytics that cannot be explained.

Priority: P1 / P2.

---

### 6. Onboarding Task Generator

Purpose: generate onboarding checklist drafts based on role, department, location, and work mode.

Examples:

- Generate onboarding tasks for a remote software developer.
- Generate HR, manager, IT/admin, and employee tasks.
- Suggest required documents based on employment type.
- Suggest first-week agenda tasks.

Why this is valuable:

- Onboarding is a core module.
- Companies often do not have standardized checklists.
- AI can help create templates faster.

Initial scope:

- Generate draft checklist.
- HR reviews and saves it as a template.
- Support Spanish and English.

Avoid initially:

- Automatically assigning tasks without review.
- Claiming legal completeness.

Priority: P1.

---

### 7. Candidate Profile Summary

Purpose: summarize candidate information for recruiters and hiring managers.

Examples:

- Summarize resume.
- Extract skills, experience, location, language level, and availability.
- Summarize interview notes.
- Draft candidate follow-up email.

Why this is valuable:

- Supports lightweight ATS.
- Saves recruiting time.
- Useful for outsourcing companies that hire frequently.

Initial scope:

- Resume summary.
- Interview notes summary.
- Email drafting.

Avoid initially:

- Automated candidate scoring.
- Rejection recommendations.
- Ranking candidates without human review.
- Using protected characteristics.

Priority: P2.

---

## AI Features To Avoid Initially

These features can create legal, ethical, or trust problems if introduced too early:

- Candidate ranking or automatic rejection.
- Employee attrition risk scoring.
- Performance prediction.
- Compensation recommendations.
- Promotion recommendations.
- Disciplinary action suggestions.
- Mental health or wellbeing inference.
- Automated legal compliance decisions.
- Automated contract generation without reviewed templates.

These may become possible later, but only with strong governance, explainability, human review, and legal validation.

---

## Suggested AI Roadmap

### Phase 1: Safe Productivity AI

Add AI where it helps users write, summarize, and find information.

- HR message drafting.
- Spanish/English translation.
- Policy/document summaries.
- Onboarding checklist drafts.
- Employee profile summaries.

### Phase 2: Permission-Aware HR Assistant

Add a chat-style assistant connected to approved internal data.

- Ask questions about policies.
- Ask about leave balances.
- Ask about missing documents.
- Ask about onboarding status.
- Ask about upcoming holidays and PTO.

### Phase 3: Natural Language Reporting

Make reporting easier through plain-language queries.

- Headcount questions.
- Leave questions.
- Missing document questions.
- Hiring pipeline questions.
- Export generation.

### Phase 4: Advanced AI With Controls

Only after the platform has strong data quality, audit logs, permissions, and customer trust.

- Workforce insights.
- Turnover trend summaries.
- Hiring funnel analysis.
- Policy gap detection.
- Suggested workflow improvements.

---

## Architecture Considerations

### AI Module

Create a separate AI module from the beginning.

Responsibilities:

- Prompt templates.
- AI provider integration.
- Permission-aware context building.
- AI request logging.
- AI response storage when needed.
- Usage limits.
- Tenant-level AI settings.
- Redaction rules.

The AI module should not own HR business data. It should request approved context from other modules.

### Data Access

AI features must use the same permission rules as the normal app.

Required rules:

- Employee users only see their own allowed data.
- Managers only see allowed data for their direct or delegated reports.
- HR users see data according to their role.
- Finance users only see compensation or payroll-related data if permitted.
- Recruiters only see candidate and hiring data unless also granted HR permissions.

### Audit And Logging

Log:

- User who requested the AI action.
- Tenant.
- Feature used.
- Records referenced.
- Timestamp.
- Whether output was copied, saved, or sent.

Avoid storing full prompts and responses if they contain unnecessary sensitive information. If storage is needed, apply retention rules.

### Provider Strategy

The system should be provider-agnostic.

Recommended abstraction:

- `AIProvider`
- `PromptTemplate`
- `ContextBuilder`
- `AIUsageLog`
- `AISettings`

This makes it easier to switch providers, add self-hosted models later, or use different models for different tasks.

---

## Initial AI MVP

The first AI release should include only a small set of high-value features:

| Feature | Initial Scope | Priority |
|---------|---------------|----------|
| HR message drafting | Draft onboarding, candidate, PTO, and policy messages | P0 |
| Spanish/English translation | Translate HR communications and policy summaries | P0 |
| Policy/document summary | Summarize company policies and uploaded documents | P1 |
| Employee profile summary | Summarize employee status, documents, PTO, and onboarding | P1 |
| Onboarding checklist generator | Generate draft onboarding templates for HR review | P1 |
| HR knowledge assistant | Answer from approved policies, leave balances, holidays, and onboarding tasks | P1 |
| Natural language reports | Convert simple questions into existing report filters | P2 |

Recommended order:

1. HR message drafting and translation.
2. Document and policy summaries.
3. Employee profile summaries.
4. Onboarding checklist generator.
5. Permission-aware HR knowledge assistant.
6. Natural language reports.

---

## Product Differentiation

AI can help differentiate the product from BambooHR for Bolivia and Latin America if it is localized and practical.

Strong differentiators:

- Spanish-first HR assistant.
- English translation for nearshore teams serving US clients.
- Bolivia-aware policy templates and summaries.
- AI-generated onboarding templates for outsourcing roles.
- HR reporting assistant for non-technical users.
- Clear privacy controls for sensitive employee data.

Avoid positioning the product as "AI decides HR." Position it as "AI helps HR work faster and communicate better."

---

## Final Recommendation

Add AI early, but keep it assistant-focused and modular. The safest and most useful initial AI features are drafting, translation, document summaries, employee profile summaries, onboarding checklist generation, and permission-aware HR Q&A.

Do not launch early AI features that rank candidates, predict employee performance, recommend compensation, or make compliance decisions. Those features carry higher legal and trust risk and should wait until the core HR platform is mature.
