# AWS Initial Production Cost And Portability Analysis

> AWS-focused deployment analysis for the HR SaaS, while keeping Supabase Postgres and Supabase Auth initially.
>
> Created: May 12, 2026.
>
> Assumption: initial production usage is limited to business hours, **8:00 AM to 4:00 PM Bolivia time**, to reduce early infrastructure cost.

---

## Short Recommendation

Use AWS for hosting, storage, email, DNS, monitoring/logs, and scheduled startup/shutdown. Keep Supabase for the database and auth at the beginning.

Recommended initial AWS setup:

| Layer | Initial AWS Choice |
|-------|--------------------|
| Frontend + backend runtime | One small EC2 instance running Docker containers |
| Schedule | EventBridge Scheduler + Lambda or SSM Automation to start/stop EC2 |
| Database | Supabase Postgres, not AWS initially |
| Auth | Supabase Auth, abstracted behind an auth provider interface |
| File storage | S3 |
| Email | Amazon SES |
| DNS | Route 53 |
| TLS | CloudFront + ACM, or Nginx/Caddy on EC2 for the cheapest setup |
| Logs | CloudWatch Logs, basic retention |
| Secrets | SSM Parameter Store first, Secrets Manager later if needed |
| Cache / queues | None initially; add ElastiCache/Valkey or SQS later |

Best initial architecture:

- **One EC2 instance** runs the Next.js frontend and NestJS API with Docker Compose.
- **Supabase** remains the managed Postgres and Auth provider.
- **S3** stores employee documents.
- **SES** sends transactional email.
- **EventBridge Scheduler** starts EC2 before 8:00 AM and stops it after 4:00 PM Bolivia time.

This is not the most robust architecture, but it is the cheapest reasonable AWS production pilot. Later, move to ECS/Fargate, App Runner, or a more robust multi-AZ setup when there are paying customers.

---

## Why Not Full AWS Robust Setup Immediately

AWS can become expensive early because many production-grade services run 24/7:

- Application Load Balancer.
- NAT Gateway.
- ECS services with always-on tasks.
- RDS.
- ElastiCache.
- OpenSearch.
- WAF.
- Multi-AZ infrastructure.

For an initial HR SaaS pilot, that is unnecessary. The product needs to prove value first.

Because the app will only be used during working hours initially, scheduled EC2 gives the biggest cost reduction.

---

## AWS Cost Summary

These are planning estimates in USD/month. Actual costs depend on region, traffic, storage, logs, data transfer, and AWS pricing changes.

### Option 1: Cheapest AWS Pilot

One small EC2 instance runs the web app and API during office hours.

Assumptions:

- Runs Monday-Friday, 8 hours/day.
- Around 176 running hours/month.
- Uses Supabase Pro for DB/Auth.
- Uses S3 for files.
- Uses SES for email.
- No ALB, no NAT Gateway, no ElastiCache.

| Service | Estimated Monthly Cost |
|---------|------------------------|
| EC2 t4g.small running only business hours | ~$3 |
| EBS volume | ~$1-$5 |
| Public IPv4 / Elastic IP | ~$3-$4 |
| S3 storage and requests | ~$1-$5 early |
| SES email | ~$0-$5 early |
| CloudWatch logs | ~$0-$5 early |
| EventBridge Scheduler + Lambda/SSM | ~$0 |
| Route 53 hosted zone | ~$0.50 |
| Supabase Pro | $25 |

Estimated total: **$35-$55/month**

This is the best cost-conscious pilot setup.

### Option 2: Better AWS Pilot

Still simple, but with more room for the app.

| Service | Estimated Monthly Cost |
|---------|------------------------|
| EC2 t4g.medium running business hours | ~$6 |
| EBS volume | ~$2-$8 |
| Public IPv4 / Elastic IP | ~$3-$4 |
| S3 | ~$1-$10 |
| SES | ~$0-$10 |
| CloudWatch | ~$0-$10 |
| Route 53 | ~$0.50 |
| Supabase Pro | $25 |

Estimated total: **$40-$75/month**

Use this if the t4g.small feels too tight for Next.js + NestJS + Docker.

### Option 3: More Robust AWS Setup Later

This is closer to a standard production setup.

| Service | Estimated Monthly Cost |
|---------|------------------------|
| ECS/Fargate or App Runner | ~$25-$150+ |
| Application Load Balancer | ~$20-$30+ before traffic |
| S3 | ~$5-$50 |
| SES | ~$5-$50 |
| CloudWatch | ~$5-$50 |
| ElastiCache or managed Redis | ~$15-$80+ |
| WAF | ~$5-$30+ |
| Route 53 | ~$0.50+ |
| Supabase Pro or AWS RDS | $25-$100+ |

Estimated total: **$125-$500+/month**

This is the kind of setup to move toward after real customers and steady revenue.

---

## Initial AWS Architecture

### EC2 Runtime

Use one EC2 instance with Docker Compose:

- `web` container: Next.js app.
- `api` container: NestJS app.
- Optional `worker` container later for background jobs.
- Reverse proxy: Nginx or Caddy.

Recommended instance:

- Start with `t4g.small` if the app is light.
- Use `t4g.medium` if memory becomes tight.

Important note:

- `t4g` instances use ARM. Make sure Docker images support `linux/arm64`.
- If ARM creates build complexity, use a small `t3` or `t4i` instance instead, but cost may be higher.

### Scheduled Hours

Use EventBridge Scheduler to start and stop the EC2 instance.

Schedule:

- Start: before 8:00 AM Bolivia time.
- Stop: after 4:00 PM Bolivia time.
- Recommended buffer: start at 7:45 AM and stop at 4:15 PM.

AWS EventBridge Scheduler supports time zones, so the schedule can be configured around Bolivia business hours.

Important product behavior:

- Outside working hours, the app will be unavailable unless a static maintenance page is served elsewhere.
- Supabase DB/Auth remain available, but the app runtime is stopped.
- Scheduled background jobs will not run while the EC2 instance is stopped unless they are moved to AWS Lambda/EventBridge.

### Static Maintenance Page

If the EC2 instance is stopped after hours, use one of these:

Option A:

- Accept that the app is offline after hours.

Option B:

- Use S3 + CloudFront for a simple maintenance page.

Option C:

- Keep only frontend static pages online and stop the API.

For the first pilot, Option A or B is enough.

---

## AWS Service Choices

### Compute

Use EC2 first.

Why:

- Cheapest for scheduled start/stop.
- Easy to run Docker Compose.
- Easy to understand.
- No ALB required at the beginning.

Avoid initially:

- ECS/Fargate with always-on services.
- EKS/Kubernetes.
- NAT Gateway.
- Multi-AZ deployment.

Later migration:

- Move containers to ECS/Fargate.
- Add ALB.
- Add autoscaling.
- Split web/API/worker if needed.

### Database

Keep Supabase Postgres initially.

Why:

- Managed PostgreSQL.
- Lower operations burden.
- Backups and dashboard.
- Already planned for the app.

Design for future migration to AWS:

- Use standard PostgreSQL features.
- Use Prisma migrations as source of truth.
- Avoid depending on Supabase PostgREST.
- Avoid putting business logic in Supabase Edge Functions.
- Avoid relying on Supabase-specific database behavior for core app logic.

Future AWS option:

- Amazon RDS for PostgreSQL.
- Aurora PostgreSQL only when scale or high availability justifies it.

### Auth

Use Supabase Auth initially.

Why:

- Included with Supabase.
- Managed.
- Low cost.
- Good enough for MVP and pilot.

Design for future migration:

- Do not scatter Supabase auth calls throughout the whole app.
- Create an internal `AuthProvider` abstraction.
- Keep app roles and tenant memberships in the application database.
- Treat Supabase user ID as an external identity ID, not the primary business identity.

Future auth options:

- Clerk for SaaS UX and organization features.
- WorkOS for enterprise SSO/SCIM.
- Auth0 for enterprise identity.
- App-owned auth if vendor cost becomes an issue.

### File Storage

Use S3 for HR documents.

Why:

- Native AWS service.
- Durable.
- Mature.
- Works with signed URLs.
- Easy to migrate if the app uses a storage abstraction.

Required:

- Private bucket.
- Signed upload/download URLs.
- Document metadata in PostgreSQL.
- Audit log for downloads.
- Server-side encryption.
- Lifecycle policies later.

### Email

Use Amazon SES.

Why:

- Very low cost.
- Reliable at scale.
- Native AWS.

Tradeoff:

- More setup than Resend or Postmark.
- Requires domain verification.
- May require production sending access request.

Use SES for:

- User invitations.
- Password reset if not fully handled by Supabase.
- PTO notifications.
- Onboarding reminders.
- Candidate emails.
- Document expiration reminders.

### Secrets

Use SSM Parameter Store first.

Store:

- Supabase URL.
- Supabase service role key.
- JWT verification settings.
- S3 bucket name.
- SES settings.
- App secrets.

Use AWS Secrets Manager later if:

- Automatic rotation is needed.
- More formal secret lifecycle management is required.

### Cache And Queues

Skip Redis initially.

For early background jobs:

- Use app-level cron while EC2 is running.
- Use EventBridge + Lambda for critical scheduled jobs that must run after hours.
- Use SQS when async jobs need reliability.

Add Redis or Valkey later only when needed for:

- BullMQ queues.
- Rate limits.
- Dashboard cache.
- Long-running imports/exports.

AWS options later:

- SQS for simple durable queues.
- ElastiCache for Redis/Valkey if using BullMQ.
- EventBridge for scheduled events.

---

## Portability And Replaceable Services

This part is critical. The system should be easy to move from Supabase to AWS RDS, from Supabase Auth to Clerk/Auth0/WorkOS, and from one storage/email provider to another.

The rule is:

> External services should be behind application-owned interfaces. Product modules should depend on internal interfaces, not vendor SDKs.

### 1. Database Portability

Initial database:

- Supabase Postgres.

Future database:

- AWS RDS PostgreSQL.
- Aurora PostgreSQL.
- Any managed PostgreSQL provider.

How to keep it portable:

- Use Prisma for schema and migrations.
- Keep migrations in the repository.
- Use the normal PostgreSQL connection string.
- Avoid Supabase-specific APIs for core backend logic.
- Avoid direct frontend access to tables.
- Avoid building business workflows in Supabase Edge Functions.
- Avoid depending on Supabase Row Level Security as the only authorization mechanism.

Recommended pattern:

```text
Product code -> Domain service -> Repository -> Prisma -> PostgreSQL
```

Do not do this:

```text
Frontend -> Supabase client -> Direct table access
```

Why:

- Direct table access couples the frontend to Supabase.
- Authorization becomes harder to move.
- Business rules leak outside the backend.

Use the NestJS API as the main boundary for all business operations.

### 2. Auth Provider Portability

Initial auth:

- Supabase Auth.

Possible future auth:

- Clerk.
- WorkOS.
- Auth0.
- Firebase Auth.
- App-owned auth.

The app should define its own identity model:

- `User`
- `TenantMembership`
- `Role`
- `Permission`
- `Employee`

The external auth provider should only prove who the user is.

Recommended user fields:

- `id`: internal application user ID.
- `tenant_id`: through membership table, not directly on user.
- `external_auth_provider`: `supabase`, `clerk`, `auth0`, etc.
- `external_auth_user_id`: provider user ID.
- `email`.
- `status`.

Recommended auth flow:

```text
Request -> AuthGuard -> AuthProvider verifies token -> Internal user resolved -> Permissions checked -> Controller
```

Create an interface like:

```text
AuthProvider
- verifyAccessToken(token)
- getExternalUser(providerUserId)
- createInvite(email, tenantId)
- disableUser(providerUserId)
```

Only the auth module should know Supabase-specific details.

Product modules should never call Supabase Auth directly.

### 3. Authorization Must Stay In The App

Do not confuse authentication with authorization.

Authentication answers:

- Who is this user?

Authorization answers:

- What tenant can this user access?
- What role do they have?
- Which employee records can they see?
- Can they see compensation?
- Can they download documents?
- Can they approve leave?

Keep authorization inside the NestJS app.

Why:

- It makes auth providers replaceable.
- It keeps business rules under your control.
- It supports complex HR permissions better.

### 4. Storage Portability

Initial storage:

- AWS S3.

Possible future storage:

- Supabase Storage.
- Cloudflare R2.
- DigitalOcean Spaces.
- MinIO.

Use a storage interface:

```text
ObjectStorageProvider
- createSignedUploadUrl()
- createSignedDownloadUrl()
- deleteObject()
- copyObject()
- getObjectMetadata()
```

Store file metadata in PostgreSQL:

- document ID.
- tenant ID.
- employee ID.
- bucket.
- object key.
- file name.
- MIME type.
- size.
- checksum.
- storage provider.
- uploaded by.
- uploaded at.

Do not store permanent public URLs in the database.

### 5. Email Portability

Initial email:

- Amazon SES.

Possible future email:

- Resend.
- Postmark.
- SendGrid.

Use an email provider interface:

```text
EmailProvider
- sendTransactionalEmail()
- sendTemplateEmail()
```

Keep templates in the app or database, not locked inside a vendor when possible.

### 6. Queue Portability

Initial queue:

- None, app cron, or SQS.

Future queue:

- SQS.
- BullMQ with Redis/Valkey.
- EventBridge.

Use a job interface:

```text
JobQueue
- enqueue()
- schedule()
- process()
```

This allows the system to start simple and later move to a real queue without rewriting product modules.

### 7. Configuration Portability

Use environment variables and typed config.

Recommended:

- `DATABASE_URL`
- `AUTH_PROVIDER`
- `STORAGE_PROVIDER`
- `EMAIL_PROVIDER`
- `QUEUE_PROVIDER`
- `APP_BASE_URL`

Example:

```text
AUTH_PROVIDER=supabase
STORAGE_PROVIDER=s3
EMAIL_PROVIDER=ses
QUEUE_PROVIDER=none
```

This makes provider changes explicit and testable.

---

## Recommended Initial Implementation Boundaries

The backend should have provider modules like this:

```text
apps/api/src/modules/
  identity/
    providers/
      supabase-auth.provider.ts
      auth-provider.interface.ts
  documents/
    storage/
      s3-storage.provider.ts
      object-storage-provider.interface.ts
  notifications/
    email/
      ses-email.provider.ts
      email-provider.interface.ts
  database/
    prisma/
```

Business modules should depend on interfaces:

- Employees module should not know Supabase exists.
- Documents module should not know whether files are in S3 or R2.
- Notifications module should not know whether email is SES or Resend.
- Leave module should not know how the queue is implemented.

This keeps the system modular and replaceable.

---

## Migration Paths

### Supabase Postgres To AWS RDS PostgreSQL

Migration path:

1. Provision RDS PostgreSQL.
2. Apply Prisma migrations.
3. Export Supabase data.
4. Import into RDS.
5. Update `DATABASE_URL`.
6. Run verification tests.
7. Switch production connection.

This is realistic if business logic is in the NestJS API and migrations are in the repo.

### Supabase Auth To Clerk/Auth0/WorkOS

Migration path:

1. Implement new auth provider adapter.
2. Add provider config.
3. Map existing users by email or external ID.
4. Keep internal `User` IDs unchanged.
5. Test tenant membership and permissions.
6. Switch login flow.
7. Retire old provider only after all active users are migrated.

This is realistic if app authorization is internal and product modules do not call Supabase Auth directly.

### S3 To Another Object Store

Migration path:

1. Implement new storage provider adapter.
2. Copy objects to new provider.
3. Update document metadata provider/bucket/key if needed.
4. Keep signed URL generation behind the interface.

This is realistic if documents never store permanent public URLs.

---

## When To Move To A More Robust AWS Setup

Move beyond scheduled EC2 when:

- Customers need 24/7 access.
- There are multiple paying companies.
- Downtime during business hours becomes expensive.
- Background jobs must run outside office hours.
- The app needs zero-downtime deploys.
- You need autoscaling.
- You need stronger network isolation.

Next step architecture:

- ECS/Fargate for web/API/worker containers.
- Application Load Balancer.
- S3 for documents.
- SES for email.
- SQS for background jobs.
- EventBridge Scheduler for reminders.
- Supabase Postgres or RDS PostgreSQL.
- CloudWatch + Sentry.

Later enterprise architecture:

- Multi-AZ RDS or Aurora.
- ElastiCache/Valkey.
- WAF.
- Private subnets.
- NAT Gateway only when justified.
- Blue/green deployments.
- Separate workers.
- OpenSearch only if PostgreSQL search is not enough.

---

## Final Recommendation

For the initial AWS deployment, use a scheduled EC2 instance with Docker Compose, S3, SES, Route 53, CloudWatch, and EventBridge Scheduler. Keep Supabase Postgres and Supabase Auth.

This gives a realistic AWS monthly cost around **$35-$75/month** while the product is used only during Bolivia business hours. It also avoids committing too early to expensive AWS infrastructure.

The most important engineering requirement is provider isolation. Build internal interfaces for database access, auth, storage, email, and queues. Keep business logic inside the NestJS backend. Do not let Supabase, AWS, or any vendor SDK leak through the product modules.

If this rule is followed, moving from Supabase Postgres to AWS RDS, or from Supabase Auth to Clerk/Auth0/WorkOS, will be a controlled migration instead of a rewrite.

---

## Sources

- AWS S3 pricing: https://aws.amazon.com/s3/pricing/
- AWS Elastic Load Balancing pricing: https://aws.amazon.com/elasticloadbalancing/pricing/
- AWS EventBridge Scheduler: https://aws.amazon.com/eventbridge/scheduler/
- AWS EventBridge pricing: https://aws.amazon.com/eventbridge/pricing/
- AWS Lambda pricing: https://aws.amazon.com/lambda/pricing/
- Supabase pricing: https://supabase.com/pricing
- AWS EC2 pricing reference: https://aws.amazon.com/ec2/pricing/on-demand/
- AWS SES pricing: https://aws.amazon.com/ses/pricing/
