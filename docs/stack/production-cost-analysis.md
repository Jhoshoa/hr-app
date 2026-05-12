# Production Cost Analysis

> Cost analysis for deploying the stack recommended in `docs/stack/recommended-technology-stack.md`.
>
> Reviewed: May 12, 2026.
>
> Notes:
>
> - Prices change often. Treat this as a planning estimate, not a contract.
> - Costs are listed in USD/month.
> - The numbers below assume an early HR SaaS serving Bolivia/LatAm companies, starting with a few pilot customers.

---

## Short Recommendation

For the MVP and first production pilot, use this low-ops managed stack as the **default deployment recommendation**:

| Area | Recommended First Choice |
|------|--------------------------|
| Frontend | Vercel Pro |
| Backend API | Render or Fly.io |
| Database | Supabase Pro Postgres |
| Auth | Supabase Auth |
| File storage | Supabase Storage first |
| Redis / queues | Skip initially, then add Upstash Redis |
| Email | Resend Free/Pro |
| Monitoring | Sentry Free first, paid later |
| Search | PostgreSQL first |

This should be preferred over the initial AWS scheduled-EC2 approach for the first MVP/pilot. The AWS option can be slightly cheaper in a limited 8-hour/day schedule, but it adds deployment and operations work: server setup, Docker runtime management, TLS, start/stop schedules, maintenance page decisions, logs, patching, and recovery.

Estimated starting monthly cost:

- Lean MVP: **$45-$90/month**
- Serious pilot: **$100-$250/month**
- More production-ready setup: **$250-$600/month**

This is much cheaper than one 300-employee BambooHR Core customer paying around **$3,000/month**, but the product still needs good security, support, backups, and reliability.

---

## Suggested Production Architecture

For the first real deployment:

- Next.js frontend deployed to Vercel.
- NestJS API deployed to Render or Fly.io.
- Supabase Pro for managed PostgreSQL.
- Supabase Auth for authentication.
- Supabase Storage for employee documents.
- Resend for transactional email.
- Sentry for error tracking.
- Redis only when background jobs, reminders, imports, exports, and rate limits need it.

Do not start with Kubernetes, microservices, Kafka, OpenSearch, or a data warehouse.

Do not start with scheduled AWS EC2 unless the team explicitly wants AWS control and accepts the extra operations burden. The recommended path is to validate the HR SaaS with managed services first, then migrate infrastructure only when there is customer traction or a clear operational reason.

---

## Cost Scenario 1: Lean MVP

This is enough for internal testing, demos, and one small pilot.

| Service | Option | Estimated Cost |
|---------|--------|----------------|
| Frontend | Vercel Pro | $20 |
| Backend API | Render Starter or Fly small VM | $7-$15 |
| Database | Supabase Pro | $25 |
| Auth | Supabase Auth included, Firebase Auth free, or Clerk Hobby | $0 |
| File storage | Supabase included storage or Cloudflare R2 free tier | $0 |
| Redis / queues | None initially | $0 |
| Email | Resend Free | $0 |
| Monitoring | Sentry Free | $0 |
| Domain | Domain registrar | ~$1-$2/month equivalent |

Estimated total: **$53-$62/month**

This setup is cost-efficient and good enough to validate the product. The main tradeoff is that some services are on free tiers or small instances, so there is less operational margin.

---

## Cost Scenario 2: Serious Pilot

This is better for a real customer pilot with HR data, documents, and regular usage.

| Service | Option | Estimated Cost |
|---------|--------|----------------|
| Frontend | Vercel Pro | $20 |
| Backend API | Render Standard or Fly 2GB+ VM | $25-$50 |
| Database | Supabase Pro | $25 |
| Auth | Supabase Auth, Clerk Pro, or Firebase Auth | $0-$25 |
| File storage | Supabase included storage or Cloudflare R2 | $0-$10 |
| Redis / queues | Upstash Free or pay-as-you-go | $0-$10 |
| Email | Resend Pro | $20 |
| Monitoring | Sentry Free or Team | $0-$26 |
| Domain | Domain registrar | ~$1-$2/month equivalent |

Estimated total: **$91-$188/month**

This is the best target for the first paid pilot. It keeps costs controlled while using production-capable managed services.

---

## Cost Scenario 3: Production-Ready Small SaaS

This is for multiple customers, more traffic, regular email volume, more documents, and a higher reliability expectation.

| Service | Option | Estimated Cost |
|---------|--------|----------------|
| Frontend | Vercel Pro, 1-2 seats | $20-$40 |
| Backend API | Render/Fly larger instance or multiple instances | $50-$150 |
| Database | Supabase Pro plus extra compute/storage if needed | $25-$100+ |
| Auth | Clerk Pro, WorkOS AuthKit, Firebase Auth, or Supabase Auth | $0-$25+ |
| File storage | Cloudflare R2 or Supabase Storage overage | $5-$50 |
| Redis / queues | Upstash fixed or usage-based | $10-$50 |
| Email | Resend Pro/Scale or Amazon SES | $20-$90 |
| Monitoring | Sentry Team/Business | $26-$80 |
| Backups / PITR | Supabase PITR if needed | $100+ |
| Domain / DNS | Registrar + Cloudflare DNS | ~$1-$5/month equivalent |

Estimated total: **$257-$690+/month**

This is still reasonable if the SaaS has even a small number of paying companies.

---

## Service-By-Service Notes

### Frontend: Vercel

Vercel Pro is currently around **$20/month** with usage included and overage billing.

Use Vercel if:

- The frontend is Next.js.
- You want simple deploy previews.
- You want low frontend operations work.

Alternative:

- Deploy frontend and API together on Render/Fly to reduce vendor count.

Recommendation:

- Use Vercel for MVP if the team wants speed.
- Move only if costs or architecture pressure justify it.

Source: https://vercel.com/pricing

---

### Backend API: Render Or Fly.io

Render and Fly.io are practical managed options for a NestJS API.

Render:

- Simple deployment model.
- Paid web services commonly start around low monthly prices for small instances.
- Easy for small teams.

Fly.io:

- Very cost-efficient small VMs.
- More infrastructure control.
- Slightly more operational complexity.

Recommendation:

- Use Render if the team wants the simplest experience.
- Use Fly.io if the team is comfortable with infrastructure and wants lower cost/control.

Sources:

- https://render.com/pricing
- https://fly.io/docs/about/pricing/

---

### Database: Supabase

Supabase Pro is a strong choice for production PostgreSQL.

Current useful plan facts:

- Pro starts around **$25/month**.
- First project is included.
- Additional projects start from around **$10/month**.
- Includes managed Postgres, Auth, Storage, APIs, daily backups, and dashboard tooling.

Recommended setup:

- Local development: PostgreSQL in Docker.
- Staging: Supabase project.
- Production: Supabase project.

Cost implication:

- One production project: around **$25/month**.
- Staging + production on Supabase: around **$35/month+** before overages.

Recommendation:

- Use Supabase as managed PostgreSQL first.
- Consider Supabase Auth and Storage because they are included and reduce vendor count.
- Keep Prisma migrations as the source of truth.

Source: https://supabase.com/pricing

---

### File Storage: Supabase Storage Or Cloudflare R2

For HR documents, object storage is required.

Option A: Supabase Storage

- Convenient if using Supabase already.
- Included quota on Pro is useful for early product.
- Fewer vendors.

Option B: Cloudflare R2

- S3-compatible.
- Free tier includes storage and operations.
- No egress fees.
- Very cost-effective for document downloads.

Recommendation:

- Start with Supabase Storage if speed and simplicity matter most.
- Use Cloudflare R2 if document storage/egress grows or if you want storage separated from the database vendor.

Source: https://developers.cloudflare.com/r2/pricing/

---

### Redis And Queues: Upstash Redis

Redis is not required on day one.

Add Redis when you need:

- Background jobs.
- Email queues.
- Import/export processing.
- Document expiration reminders.
- Rate limiting.
- Short-lived dashboard cache.

Upstash Redis is useful because it has:

- Free tier for small workloads.
- Pay-as-you-go pricing.
- Fixed monthly plans when usage is predictable.

Recommendation:

- Skip Redis for the first prototype.
- Add Upstash Redis when background jobs appear.
- Use BullMQ if running workers in the backend infrastructure.

Source: https://upstash.com/pricing/redis

---

### Email: Resend, Postmark, Or Amazon SES

The HR SaaS will need transactional email:

- Invites.
- Password reset.
- PTO approvals.
- Onboarding reminders.
- Candidate emails.
- Document expiration reminders.

Option A: Resend

- Very developer-friendly.
- Free tier useful for testing.
- Pro around **$20/month** for higher sending limits.

Option B: Postmark

- Strong deliverability reputation.
- Often costs more than SES.
- Good for transactional reliability.

Option C: Amazon SES

- Cheapest at scale.
- More setup and deliverability management.
- Better when email volume grows.

Recommendation:

- Start with Resend for developer speed.
- Consider SES later if volume grows and email cost matters.

Source: https://resend.com/pricing

---

### Monitoring: Sentry

Use Sentry for frontend and backend error monitoring.

Recommendation:

- Start with Sentry Free for development and early pilot.
- Move to Team or Business once multiple people need access or volume grows.

Estimated:

- Free: $0.
- Team: around **$26/month**.
- Business: around **$80/month**.

Source: https://sentry.io/pricing/

---

## Authentication Cost Analysis

Authentication is the most important cost/architecture decision because this is a B2B multi-tenant HR app.

The product needs:

- Email/password.
- Password reset.
- Email verification.
- User invitations.
- Tenant/company membership.
- Roles per tenant.
- Session management.
- Later: MFA, SSO, SCIM, enterprise policies.

### Option 1: Supabase Auth

Estimated cost:

- Included with Supabase.
- Supabase Pro includes a generous MAU allowance.

Pros:

- Already included if using Supabase.
- Supports email/password and social login.
- Good developer experience.
- Reduces vendors.
- Works well with PostgreSQL.
- Good for MVP and pilot.

Cons:

- You must design your own tenant membership and RBAC model.
- Enterprise SSO and advanced B2B auth may need more work.
- Tighter coupling to Supabase.

Best for:

- MVP.
- Early production.
- Cost-sensitive SaaS.

Recommendation:

- Very good first choice if using Supabase for production DB.

Source: https://supabase.com/pricing

---

### Option 2: Firebase Authentication

Estimated cost:

- Standard auth has a large free tier.
- Firebase pricing currently lists no-cost usage up to **50,000 monthly active users** for standard authentication.
- SAML/OIDC has a much smaller no-cost allowance.

Pros:

- Very reliable.
- Generous free tier.
- Good hosted auth.
- Easy social login.
- Backed by Google infrastructure.

Cons:

- Separate from PostgreSQL/Supabase.
- You still build tenant membership, roles, and permissions in your app DB.
- B2B organization modeling is not as natural as Clerk/WorkOS.
- SAML/OIDC enterprise auth changes the cost profile.

Best for:

- Low-cost managed auth.
- Apps that do not need enterprise SSO at first.

Recommendation:

- Good low-cost option, but Supabase Auth is simpler if Supabase is already the database provider.

Source: https://firebase.google.com/pricing

---

### Option 3: Clerk

Estimated cost:

- Clerk currently lists a generous free Hobby tier.
- Pro starts around **$20/month** when billed annually.
- Enterprise connections and advanced features can add cost.

Pros:

- Excellent developer experience.
- Strong prebuilt UI components.
- Organization support.
- Good fit for SaaS.
- Faster to ship than app-owned auth.
- Can grow into enterprise features.

Cons:

- More expensive than Supabase Auth/Firebase Auth once paid features are needed.
- Vendor lock-in around user management.
- Some branding/feature limitations on free tier.

Best for:

- Fast SaaS development.
- Teams that want polished auth quickly.
- B2B app with organizations.

Recommendation:

- Best managed-auth option if speed and SaaS UX matter more than minimizing cost.

Source: https://clerk.com/pricing

---

### Option 4: WorkOS

Estimated cost:

- AuthKit currently advertises a very generous free user allowance.
- SSO and directory sync are priced per enterprise connection.
- SSO connections can become costly when selling to many enterprise customers.

Pros:

- Excellent for B2B enterprise readiness.
- Strong SSO, directory sync, admin portal, audit log products.
- Good when customers require enterprise IT features.

Cons:

- More than needed for the first Bolivia SMB/mid-market MVP.
- SSO/directory sync costs can grow per customer.
- Adds complexity before there is enterprise demand.

Best for:

- Later stage.
- Enterprise customers requesting SAML/OIDC SSO or SCIM.

Recommendation:

- Do not start here unless the first customers require enterprise SSO.
- Add later for enterprise deals.

Source: https://workos.com/pricing

---

### Option 5: Auth0

Estimated cost:

- Auth0 has free and paid plans, but B2B and enterprise features can become expensive.
- Paid plans commonly start around tens of dollars per month and grow with MAU/features.

Pros:

- Mature and reliable.
- Strong enterprise auth capabilities.
- Broad identity provider support.
- Good for complex auth requirements.

Cons:

- Pricing can be harder to predict.
- B2B organization and enterprise features can become expensive.
- More complex than needed for the first release.

Best for:

- Enterprise identity requirements.
- Teams already experienced with Auth0.

Recommendation:

- Reliable, but probably not the most cost-effective first choice for this product.

Source: https://auth0.com/pricing

---

### Option 6: App-Owned Auth

Examples:

- Auth.js.
- Better Auth.
- NestJS auth with Passport.js.

Estimated cost:

- Software cost: **$0**.
- Engineering and security cost: meaningful.

Pros:

- Lowest direct vendor cost.
- Full control.
- No MAU-based auth bill.
- No external auth vendor lock-in.
- Can be deeply integrated with tenant and RBAC model.

Cons:

- You own security mistakes.
- More engineering time.
- Password reset, email verification, sessions, MFA, and account recovery must be implemented correctly.
- Enterprise SSO later requires additional work.

Best for:

- Teams with strong backend/security experience.
- Products that need full control and low recurring vendor cost.

Recommendation:

- Reasonable only if the team is disciplined about security.
- For this HR SaaS, Supabase Auth or Clerk is safer for the first version.

---

## Auth Recommendation For This HR SaaS

Best practical auth path:

### Phase 1: MVP And Pilot

Use **Supabase Auth** if using Supabase for production Postgres.

Why:

- Lowest added cost.
- Managed auth.
- Good enough for email/password and social login.
- Reduces vendor count.
- Works well with the chosen DB provider.

Build inside your app:

- Tenant/company membership.
- Roles.
- Permissions.
- Field-level access.
- Audit logs.

### Phase 2: Better SaaS UX

If Supabase Auth becomes limiting, evaluate **Clerk**.

Use Clerk when:

- You want better prebuilt auth UI.
- You want organization management.
- You want faster enterprise auth features.
- You accept a monthly auth bill.

### Phase 3: Enterprise Customers

Add **WorkOS** for enterprise SSO/SCIM if customers require it.

Use WorkOS when:

- A customer asks for SAML/OIDC SSO.
- A customer asks for directory sync.
- The deal size justifies the per-connection cost.

---

## Recommended Low-Cost Production Stack

This is the best cost-conscious first production stack:

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Vercel Pro | Best Next.js deployment experience. |
| Backend | Render Starter/Standard or Fly.io | Simple managed API hosting. |
| Database | Supabase Pro | Managed PostgreSQL with backups and dashboard. |
| Auth | Supabase Auth | Included, reliable enough for MVP. |
| Storage | Supabase Storage | Included and simple to start. |
| Email | Resend Free/Pro | Fast setup and good developer experience. |
| Redis | None initially, then Upstash | Avoid cost until queues are needed. |
| Monitoring | Sentry Free | Enough at first. |
| Search | PostgreSQL | No extra service needed. |

Estimated initial cost: **$50-$120/month**.

This is the stack that should drive the first implementation planning:

1. Build locally with Docker Postgres.
2. Deploy frontend to Vercel.
3. Deploy backend API to Render or Fly.io.
4. Use Supabase Pro for production Postgres.
5. Use Supabase Auth, but keep app roles and permissions in the application database.
6. Use Supabase Storage first for documents.
7. Use Resend for transactional email.
8. Add Upstash Redis only when background jobs or rate limits are needed.

---

## When To Upgrade Each Service

| Service | Start With | Upgrade When |
|---------|------------|--------------|
| Supabase | Pro | DB size, compute, backups, or support needs increase. |
| Auth | Supabase Auth | Customers require better org auth, SSO, or MFA policies. |
| Storage | Supabase Storage | Document storage/egress grows or separation is needed. |
| Redis | None | You add reminders, queues, imports, exports, and rate limits. |
| Email | Resend Free | You exceed daily/monthly limits or need better deliverability controls. |
| Monitoring | Sentry Free | More team members or more event volume is needed. |
| Backend hosting | Small instance | API latency, memory, or background work increases. |
| Frontend hosting | Vercel Pro | Usage exceeds included bandwidth/compute. |

---

## Final Recommendation

Use the managed MVP stack in this document as the starting point. Use Supabase as the production database and start with Supabase Auth unless there is a strong reason not to. It gives the lowest operational and vendor cost while keeping authentication managed.

For the first pilot, a realistic monthly bill should be around **$100/month** if you choose practical paid tiers. That is low enough to validate the business while still using serious infrastructure.

Avoid expensive identity providers at the beginning unless a customer explicitly requires enterprise SSO. When that happens, WorkOS is a strong add-on because the enterprise customer should justify the extra auth cost.

The AWS scheduled-EC2 approach remains a valid alternative, but it should be treated as a cost-control or AWS-learning path, not the default implementation path. The default goal is to minimize operational complexity so the team can focus on product-market validation.

---

## Sources

- Supabase pricing: https://supabase.com/pricing
- Vercel pricing: https://vercel.com/pricing
- Fly.io pricing: https://fly.io/docs/about/pricing/
- Render pricing: https://render.com/pricing
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Upstash Redis pricing: https://upstash.com/pricing/redis
- Resend pricing: https://resend.com/pricing
- Firebase pricing: https://firebase.google.com/pricing
- Clerk pricing: https://clerk.com/pricing
- WorkOS pricing: https://workos.com/pricing
- Auth0 pricing: https://auth0.com/pricing
- Sentry pricing: https://sentry.io/pricing/
