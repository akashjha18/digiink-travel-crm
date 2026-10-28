# Production Launch Plan

This plan sequences the remaining work to make Digiink CRM safe to launch and useful for real businesses. A phase is complete only when its exit criteria are met in a staging environment. “Production ready” is a release decision based on evidence, not a promise that no defects remain.

## Phase 0 — Establish a safe staging baseline

**Status: In progress.** Repository setup now includes an XAMPP staging database recipe, isolated backend/frontend ports and upload storage, a secrets template, and a CI workflow. The staging database, restore procedure, and CI run still need validation on this machine.

**Purpose:** Create an isolated place to validate changes without risking customer data.

**Work:**

- Provision a staging database and deployment environment separate from local and production.
- Add CI checks for backend build, frontend build, Prisma validation, and automated tests.
- Add environment validation for production secrets and required service URLs.
- Ensure staging and production uploads use persistent storage and have backup/restore procedures.
- Record current schema and data; do not use the destructive canonical SQL import on an existing database.

**Exit criteria:** A clean deployment to staging succeeds from a clean checkout; health checks pass; backups can be restored into a separate database; no production data is used for testing.

## Phase 1 — Tenant isolation and access control

**Purpose:** Protect each business’s customer, booking, payment, and document data.

**Work:**

- Perform a route-by-route audit of tenant-owned Prisma reads, writes, nested relations, exports, notifications, reports, public links, and background jobs.
- Add automated cross-tenant tests for every API area: a user from tenant A must not read, modify, delete, or infer tenant B’s records.
- Review document and upload access, share tokens, and public endpoints for tenant boundary bypasses.
- Decide and document whether shared-database isolation is an acceptable launch risk. If not, implement structural per-tenant isolation before onboarding paying customers.
- Confirm production CORS allowlist behavior, HTTPS, and trusted proxy settings.

**Exit criteria:** Cross-tenant tests pass across all tenant-facing routes; an independent security review finds no unresolved critical/high isolation issues; the database isolation decision is signed off.

## Phase 2 — Data integrity and concurrency

**Purpose:** Ensure money and business records stay correct when users act at the same time.

**Work:**

- Prevent concurrent payments from exceeding a booking balance using transaction-safe locking or an atomic balance strategy.
- Enforce one invoice per booking in the database, first checking and resolving any existing duplicate invoices through a reviewed data migration.
- Make quotation version creation concurrency-safe and enforce unique `(enquiryId, version)` values.
- Make booking, quotation, invoice, and payment side effects transactional where partial writes could leave inconsistent records.
- Recheck lifecycle rules: accepted quotation to booking, cancellations, edits after invoicing, payment status, refunds/voids, and audit trail behavior.
- Add money calculation tests for paise rounding, GST breakdowns, discounts, partial payments, overpayments, and zero/edge amounts.

**Exit criteria:** Concurrency tests prove duplicate invoices, duplicate versions, and overpayments cannot occur; migrations pass against a copy of production-like data; reconciliation reports show consistent booking/payment/invoice totals.

## Phase 3 — Authentication and account security

**Purpose:** Protect accounts and make recovery reliable for business users.

**Work:**

- Decide and implement the login policy, including whether client OTP is mandatory. If enabled, require verified SMTP and test delivery end to end.
- Add rate limits and abuse protections to login, OTP verify/resend, password reset, and refresh endpoints.
- Make OTP consumption atomic so a code cannot be used concurrently more than once; test expiry, retry limits, replay, and enumeration resistance.
- Review refresh token lifetime, rotation, revocation, and logout behavior.
- Validate password policy, first-login password change, inactive users, role changes, and account lock behavior.
- Verify production encryption key handling and rotation/recovery procedures.

**Exit criteria:** Authentication and recovery test matrix passes; no OTPs or credentials appear in logs; abuse limits are verified; administrators can revoke compromised sessions.

## Phase 4 — Background jobs and business workflows

**Purpose:** Ensure scheduled and automated CRM behavior actually runs in production.

**Work:**

- Decide which subscription lifecycle and automation workers are required at launch; run them as managed workers rather than silently leaving them disabled.
- Add queue health, retries, dead-letter handling, idempotency, and alerting.
- Verify subscription expiry/grace/lock transitions and recovery after renewal.
- Test lead creation, follow-ups, quotation status changes, booking confirmation, payment received, reminders, and automation actions.
- Clearly label unsupported or simulated integrations (including WhatsApp) in product behavior and admin settings.

**Exit criteria:** Required jobs run in staging on schedule, failures are observable and recoverable, and each launch-critical workflow has passing end-to-end tests.

## Phase 5 — Automated test coverage and business acceptance

**Purpose:** Replace build-only confidence with repeatable evidence that core business workflows work.

**Work:**

- Add backend unit tests for subscription rules, pricing, permissions, validation, and state transitions.
- Add API integration tests using an isolated test database for customers, enquiries, quotations, bookings, payments, invoices, roles, and tenant boundaries.
- Add frontend component or browser tests for high-use flows and error states.
- Add end-to-end journeys: create customer/lead → quotation → accepted booking → payment → invoice; also test edits, cancellations, partial payments, and failed email/job delivery.
- Have representative travel businesses complete user acceptance testing and record issues by severity.
- Establish smoke tests and regression checks for every release.

**Exit criteria:** All critical business journeys pass in staging; no open severity 1 or 2 defects; business users approve workflows and documents; test data is isolated and repeatable.

## Phase 6 — Production operations and deployment

**Purpose:** Deploy and operate the SaaS reliably.

**Work:**

- Build and verify production release artifacts; run the frontend and backend behind a secured service boundary with TLS at the edge.
- Configure production `APP_URL`, `CORS_ORIGINS`, database credentials, JWT secrets, `ENCRYPTION_KEY`, SMTP, and any required Redis/service credentials through a secrets manager.
- Add a deployment topology for the selected host/platform, health/readiness checks, graceful shutdown, and resource limits.
- Set up managed database backups, restore drills, persistent uploads/object storage, retention policy, and disaster recovery targets.
- Add error monitoring, structured logs with sensitive-data redaction, uptime checks, queue/database metrics, and actionable alerts.
- Establish schema migration and rollback procedures; avoid `prisma db push` as an unreviewed production migration strategy.
- Add dependency vulnerability scanning, a patch cadence, and incident response contacts.

**Exit criteria:** A production-like deployment and rollback are rehearsed; backup restore is demonstrated; alerts are tested; secrets are not in artifacts/logs; no critical/high dependency issues remain without explicit sign-off.

## Phase 7 — Controlled launch

**Purpose:** Start with a small number of businesses and expand based on observed stability.

**Work:**

- Onboard a small pilot cohort with support and data-import checks.
- Monitor failed requests, payment reconciliation, email delivery, queue health, database load, and support reports daily.
- Run the launch smoke suite after every deployment and review incidents before expanding access.
- Keep a documented rollback and customer communication plan.

**Exit criteria:** Pilot businesses complete core workflows without unresolved critical defects; data reconciliation is accurate; support and operational load are understood; launch owner approves wider availability.

## Suggested order and release gates

1. Complete Phases 0–3 before storing real customer or payment data.
2. Complete Phase 4 for any automated workflow advertised to customers.
3. Complete Phase 5 before pilot onboarding.
4. Complete Phase 6 before the first production deployment.
5. Use Phase 7 to decide when to expand beyond pilot customers.

Do not treat a passing frontend/backend build as a launch approval. Builds establish compilation; staging tests, tenant isolation evidence, migration safety, operational readiness, and business acceptance establish launch readiness.
