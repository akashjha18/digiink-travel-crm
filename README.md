# Digiink Solutions — Travel CRM SaaS (Phase 2: Super Admin)

Multi-tenant Travel CRM running on a **single shared MySQL database**
(XAMPP/MariaDB-friendly), with every tenant-scoped table carrying a
`clientId` column. Isolation is enforced in application code — every
query is scoped by `clientId` — rather than by separate databases per
client.

> **Architecture note:** the original SRS called for one fully isolated
> MySQL database per client. This build intentionally simplifies to one
> shared database for local development on XAMPP. See `ARCHITECTURE.md`
> for what that trade-off means and how to harden it later if you deploy
> to production.

Stack: React + TypeScript + Vite + MUI (frontend) · Node.js + Express +
TypeScript + Prisma (backend) · MySQL/MariaDB · Redis + BullMQ (optional
locally, needed for the subscription lifecycle cron).

## What's in Phase 2

- Full Super Admin console (frontend + backend):
  - Dashboard (client counts by status, pending payments)
  - Clients list + Create Client dialog (provisions a client, its default
    "Client Admin" role, and initial admin user — all in one DB transaction)
  - Client Detail page: activate / deactivate / extend grace / delete,
    manual payment confirmation, usage stats, staff list with
    force-password-reset
  - Plan Manager: toggle entitlements and edit user/enquiry limits per
    plan, live — no redeploy
  - Payment Notices inbox ("I have made the payment" queue)
  - Audit Log viewer
- `POST /api/payment-renewal/notify` now actually creates a PaymentNotice
  row (Phase 1 had this as a UI-only stub)
- `GET/POST /api/super-admin/clients/:id/users*` — staff visibility and
  force password reset for Super Admin support use cases

## Carried over from Phase 1 (rewritten for the single-DB model)

- JWT auth (access + refresh), Argon2 hashing, forced first-login
  password change
- Guard chain: `authenticate` → `scopeTenant` (subscription check,
  attaches `clientId`) → `requireEntitlement` → `requirePermission` (RBAC)
- Subscription lifecycle state machine + hourly BullMQ sweep
- Audit logging (Super Admin actions + per-client audit_log)

## What's NOT done yet

- Onboarding wizard, Quotation builder, Trip board, Payments/Invoicing UI,
  Reports, Workflow automation, Multi-branch/WhatsApp, S3 file uploads
- A real hard-delete flow for a client's rows (currently "Delete Client"
  only flips status to DELETED and retains data — see the note in
  `super-admin.controller.ts`)
- Automated tests (tenant-scoping and entitlement tests are the next
  priority given the architecture shift)

## Local setup (XAMPP)

1. Start Apache/MySQL in XAMPP.
2. Import `database/digiink_crm.sql` via phpMyAdmin (creates the database,
   all tables, and seeds the 4 plans).
3. `cp .env.example .env` — defaults already point at
   `mysql://root:@localhost:3306/digiink_crm`, adjust if your XAMPP MySQL
   has a password.
4. `cd backend && npm install`
5. `npx prisma generate --schema=prisma/schema.prisma`
6. `SEED_SUPER_ADMIN_PASSWORD='ChangeMe123!' npm run seed` — creates your
   Super Admin login and one demo client (Prisma will not re-create the
   plans since the SQL import already seeded them — the seed script uses
   `upsert` so this is safe to run either way)
7. `npm run dev` — http://localhost:4000
8. `cd ../frontend && npm install && npm run dev` — http://localhost:5173
9. (Optional, for the subscription lifecycle cron) `docker compose up -d`
   to start Redis, or run Redis however you prefer locally.

Log in as Super Admin at `/login` with the email/password from step 6.

## Phase 3: Client Onboarding (new)

- Two-step login for client users: password → email OTP (6-digit code,
  10-minute expiry, hashed at rest in `login_otps`) → real tokens.
  Super Admin logins are unaffected (skip OTP).
- Forced first-login password change now has a real page
  (`/change-password`) instead of just a flag — routes to `/onboarding`
  next.
- Onboarding wizard (`/onboarding`): Company Profile → Business
  Information → Branch Setup (only shown if the plan includes
  `multi_branch`) → Finish. Backed by `company_profiles` and `branches`
  tables, both scoped by `clientId`.
- Subscription banners now render on the client dashboard for
  `EXPIRING_SOON` / `GRACE` states (locked clients still get redirected to
  the dedicated payment-renewal page instead of a banner).

New backend files: `auth/otp.service.ts`, `onboarding/onboarding.controller.ts`.
New tables: `company_profiles`, `branches`, `login_otps` (added to both
`schema.prisma` and `database/digiink_crm.sql`).

If you already imported `digiink_crm.sql` for Phase 2, re-import it (or run
`ALTER TABLE`/`prisma db push` to add the three new tables + the
`onboardingCompleted` column on `clients`) before starting the backend.

## Phase 4: CRM (new)

Backend (`enquiry_crm` entitlement — Starter and up):
- `GET/POST /api/customers`, `GET/PATCH/DELETE /api/customers/:id`, `POST /api/customers/import` (bulk CSV, expects pre-parsed rows)
- `GET /api/enquiries` (filterable by status/assignedToId/source), `GET /api/enquiries/pipeline` (grouped by stage), `GET/POST /api/enquiries/:id`, `PATCH /api/enquiries/:id/status`, `PATCH /api/enquiries/:id/assign`, `POST /api/enquiries/:id/follow-ups`
  - Enquiry creation supports manual or round-robin assignment (fewest currently-open enquiries wins) and enforces the plan's `max_enquiries_per_month` limit
- `GET /api/users` (lightweight roster for assignment dropdowns) and `GET/POST/PATCH/DELETE /api/users/staff` (full Staff Management — Client Admin can never be deactivated/deleted through this route, and self-deletion is hard-blocked per SRS FR-10.3)
- `GET/POST/PATCH /api/roles` — no-code Role Builder, module × action permission grid stored as JSON; the built-in "Client Admin" system role can't be edited
- `GET /api/client/dashboard` — Starter-tier metrics (total/new enquiries, recent activity feed); Professional+/Business+ metrics arrive once Bookings/Payments exist (Phases 5/7)

Frontend:
- New `ClientLayout` (sidebar nav, hides modules the plan doesn't entitle to — backend still enforces regardless) wraps Dashboard, Customers, Enquiries, Pipeline, Staff, Roles
- Customers list + detail (shows linked enquiries/bookings)
- Enquiries list (with stage filter) + detail page (stage dropdown, reassignment, activity timeline/follow-ups)
- Pipeline: Kanban-style board grouped by stage, move stage via per-card dropdown
- Staff Management page + Role Builder (checkbox grid per module/action)

No schema changes — Phase 1's Customer/Enquiry/FollowUp/Role/User models already covered this.

## Phases remaining after this: 6 (Quotations & Bookings, Operations, Finance, Reporting, Automation, Enterprise)

## Phase 5: Quotations & Bookings (new)

Backend (`quotation` entitlement — Professional and up):
- `GET/POST /api/quotations`, `GET/PATCH /api/quotations/:id` (edit only while DRAFT), `POST /api/quotations/:id/new-version` (SRS FR-4.3 multiple versions per enquiry), `PATCH /api/quotations/:id/status` (DRAFT→SENT→ACCEPTED/REJECTED/EXPIRED, invalid transitions rejected), `POST /api/quotations/:id/convert-to-booking` (only from ACCEPTED, one booking per quotation, auto-creates the linked Trip record, moves the enquiry to WON)
- `GET/PATCH /api/bookings`, `GET/PATCH /api/bookings/:id`, `PATCH /api/bookings/:id/status` (`bookings` entitlement)

Frontend:
- Quotation Builder (itinerary line items, markup/discount/tax, live total) — reused for both new quotations and new versions
- Quotations list (status filter) + detail page (status action buttons, Convert to Booking, Print)
- Bookings list (status filter) + detail/voucher page (status dropdown, Print)
- Enquiry detail page now shows its quotations and links to create one

**Note on PDFs:** the SRS calls for branded PDF quotations/vouchers stored in S3. Neither S3 nor a PDF-generation library is wired up yet (that's tied to the Documents/file-storage work), so "Print" currently uses the browser's native print-to-PDF against a print-styled page instead of a real generated file. Revisit this once object storage is in scope — likely Phase 6 or a dedicated documents pass.

No schema changes — Quotation/Booking/Trip models already existed from Phase 1.

## Phase 6: Operations (new)

Backend (`drivers`/`vehicles` entitlements — Professional and up; Trips gated on `bookings` since a Trip only exists once a Booking created it):
- `GET/POST/PATCH/DELETE /api/drivers` — a "Driver" role user sees only their own record (SRS FR-6.3); delete is blocked while the driver has an active/upcoming trip
- `GET /api/drivers/:id/schedule` — a driver's own restricted trip list
- `GET/POST/PATCH/DELETE /api/vehicles`, `GET /api/vehicles/:id/schedule` (upcoming trips = availability calendar), `POST /api/vehicles/:id/documents`, `GET /api/vehicles/alerts/expiring` (RC/insurance/permit expiring within 30 days or already expired)
- `GET/PATCH /api/trips`, `PATCH /api/trips/:id/status` (keeps the parent Booking's status in sync), `PATCH /api/trips/:id/assign` — **double-booking prevention**: rejects (409, `DOUBLE_BOOKING_CONFLICT`) assigning a driver or vehicle already on another SCHEDULED/IN_PROGRESS trip with overlapping dates; also keeps the Booking's driver/vehicle fields (shown on the voucher) in sync with the Trip's

Frontend:
- Drivers page (add, availability toggle, assigned vehicles)
- Vehicles page (add with RC/insurance/permit expiry dates, expiry alert banner, color-coded expiry chips: red = expired, amber = within 30 days)
- Trips list (status filter) + detail page (status control, driver/vehicle assignment dropdowns that surface the double-booking conflict error inline, pickup/drop/itinerary notes)
- Booking detail page now links through to "Manage Trip"

No schema changes — Driver/Vehicle/Trip/Document models already existed from Phase 1.

**Still deferred:** actual document file upload (documents take a pasted URL, same S3 limitation noted in Phase 5); a real calendar UI for vehicle/driver availability (currently a simple upcoming-trips list, which is enough to spot conflicts manually, but not a visual calendar).

## Phase 6: Operations (Drivers, Vehicles, Trips)

Backend (`drivers`/`vehicles` entitlement — Professional and up; Trips gated on `bookings` since a Trip only exists because a Booking created one):
- `GET/POST/PATCH/DELETE /api/drivers`, `POST /api/drivers/:id/documents`, `GET /api/drivers/:id/schedule` — a user in the "Driver" role only ever sees their own record and trips (SRS FR-6.3), enforced server-side
- `GET/POST/PATCH/DELETE /api/vehicles`, `GET /api/vehicles/alerts/expiring` (RC/insurance/permit expiring within 30 days or already expired), `POST /api/vehicles/:id/documents`, `GET /api/vehicles/:id/schedule`
- `GET/PATCH /api/trips`, `PATCH /api/trips/:id/status` (keeps the parent Booking's status in step), `PATCH /api/trips/:id/assign` — **real double-booking prevention**: assigning a driver or vehicle that's already on another SCHEDULED/IN_PROGRESS trip in an overlapping date range is rejected with a 409, not just warned about
- Deleting a driver/vehicle with an active or upcoming trip is blocked

Frontend:
- Drivers page (availability toggle, assigned vehicles shown)
- Vehicles page (expiry-alert banner, per-document expiry chips: expired/expiring-soon/ok)
- Trips list (status filter) + detail page (status dropdown, driver/vehicle assignment dropdowns that surface the 409 conflict as an inline error instead of failing silently)
- Booking detail page now links through to its Trip for assignment

No schema changes — Driver/Vehicle/Trip/Document models already existed from Phase 1.

## Phases remaining after this: 4 (Finance, Reporting, Automation, Enterprise)

## Phase 7: Finance (Payments, Receivables, Invoicing)

Schema addition: `Booking.paymentDueDate` (nullable) — needed for the receivables Due Today/Overdue/Due This Week buckets, which have no other date to key off. Added to both `schema.prisma` and `database/digiink_crm.sql`. **Re-run `prisma db push` or re-import the SQL** before starting the backend.

Backend (`payments` entitlement — Professional and up):
- `GET/POST/DELETE /api/payments`, `GET /api/payments/booking/:bookingId/summary` (total/paid/pending/status) — manual entry only (cash/UPI/bank transfer), same no-gateway philosophy as SaaS billing itself (SRS USP #5). Installments are just multiple payments against one booking; a payment that would push the paid total past the booking's agreed amount is rejected (`OVERPAYMENT`)
- `GET/POST /api/invoices`, `GET /api/invoices/:id` — GST invoice generation from a booking (one invoice per booking), computes subtotal/GST split from a given rate assuming the booking amount is tax-inclusive, supports HSN/SAC
- `GET /api/receivables/dashboard` (Total Receivable / Due Today / Overdue / Due This Week / Paid) and `GET /api/receivables` (filterable list by customer/payment status) per SRS section 24
- `/api/client/dashboard` now adds Active Bookings + Total Booking Revenue (when `bookings` is entitled) and Outstanding Payments (when `payments` is entitled) — the Professional+/Business+ tier the Phase 4 README note said would arrive once this data existed

Frontend:
- Booking detail page gained a Payments section (record payment, due-date field, payment history table) and an Invoice section (generate/view)
- Invoices list + print-styled detail page (same browser-print stand-in as quotations/vouchers — still no real PDF/S3, see Phase 5 note)
- Receivables dashboard page with the 5 summary cards + filterable list, links back to each booking

## Phases remaining after this: 3 (Reporting, Automation, Enterprise)

## Phase 8: Reporting

No schema changes. Backend (`basic_reports` entitlement — Professional and up; three routes additionally gate on `advanced_reports` — Business and up):
- `GET /api/reports/sales-by-agent` — won enquiries + attached booking revenue, grouped by assigned staff (Professional+)
- `GET /api/reports/bookings-by-status` — count + total amount grouped by booking status (Professional+)
- `GET /api/reports/revenue-by-destination` (Business+)
- `GET /api/reports/driver-utilization` / `GET /api/reports/vehicle-utilization` — % of days in range with at least one active trip (Business+)
- `GET /api/reports/agent-performance-trends` — monthly won-enquiry count + revenue per agent (Business+)
- All six accept `?from=&to=` date filtering

Frontend: single Reports page with tabs per report, date-range filter, CSV export (client-side, flattens the nested trends data), and Print/PDF via the browser (same stand-in as quotations/invoices — still no real PDF generation). Starter-plan users see a plain "upgrade to unlock" message on the Business+ tabs instead of an error.

## Phases remaining after this: 2 (Automation, Enterprise)

## Phase 9: Workflow Automation

Schema addition: `AutomationRule` and `AutomationLog` tables (`workflow_automation` entitlement — Business+ only), both `clientId`-scoped. Added to `schema.prisma` and `database/digiink_crm.sql` — **re-run `prisma db push` or re-import the SQL** before starting the backend.

Backend:
- `GET/POST/PATCH/DELETE /api/automation/rules`, `GET /api/automation/logs`, `GET /api/automation/options`
- Four trigger types: enquiry not contacted within X hours (the SRS's own example), quotation sent but not followed up within X days, booking payment overdue, vehicle document expiring within X days
- Three action types: email a staff member (Client Admin / whoever the enquiry is assigned to / a specific person), auto-add a follow-up note to the enquiry, reassign the enquiry to someone else
- `jobs/automation-engine.job.ts` — a BullMQ sweep every 15 minutes evaluates all active rules across all clients whose plan actually includes `workflow_automation`, with a per-rule-per-target cooldown (24h for most triggers, 7 days for document-expiry) so the same enquiry/booking/vehicle doesn't get re-flagged every sweep. **This job is commented out in `server.ts` by default** (same as the subscription-lifecycle job) since it needs Redis running — uncomment both once you have Redis up locally.
- Important limitation to be upfront about: there's no real-time event bus, so a rule fires on the next 15-minute sweep after its condition becomes true, not instantly when e.g. an enquiry is created.

Frontend: Automation page with a Rules tab (create/toggle/delete, trigger+action dropdowns with the relevant config fields) and an Execution Log tab.

## Phases remaining after this: 1 (Enterprise)

## Phase 10: Enterprise (Multi-Branch, WhatsApp, Custom Fields)

No new schema — `Branch`, `WhatsAppConfig`, `WhatsAppMessage`, `CustomFieldDefinition`, and `CustomFieldValue` were already fully modeled in `schema.prisma` and synced in `database/digiink_crm.sql` from earlier work; this phase built the missing backend controllers and frontend pages on top of them. If you haven't already, this is still worth a `prisma db push`/re-import to be sure your local database actually has these tables.

**Multi-Branch** (`multi_branch` entitlement — Enterprise only):
- `GET/POST/PATCH /api/branches`, `PATCH /api/branches/assign-user/:userId`, `GET /api/branches/rollup` (SRS FR-12.1's "rolled up for the Client Admin" view — staff/enquiry/booking/revenue counts per branch, plus an explicit "not yet assigned to a branch" bucket so nothing silently disappears from totals)
- New enquiries now inherit the creating user's branch by default; bookings inherit their enquiry's branch on conversion — otherwise the rollup would stay permanently empty
- Frontend: Branches page (create branches, staff assignment dropdown, rollup cards)

**WhatsApp Business API** (`integrations` entitlement — Enterprise only) — **read this before assuming it works**: there is no real connection to Meta's API. Building one requires a Meta Business Account, an approved WhatsApp Business app, a verified phone number, and a permanent access token — all of which only Meta can issue, to you, directly. What's real:
- Config storage (`GET/POST /api/whatsapp/config`, access token encrypted at rest), a message log (`GET /api/whatsapp/messages`), and a send endpoint (`POST /api/whatsapp/send`) that **simulates** delivery and logs it rather than actually contacting Meta
- A public webhook receiver at `/api/whatsapp-webhook/:clientId` (deliberately a separate path prefix from `/api/whatsapp` — see the comment in `routes/index.ts` for why sharing a prefix would silently 401 Meta's callbacks) with real verify-token handling, ready to receive live traffic once credentials exist
- The frontend shows an explicit warning banner rather than pretending this is connected

**Custom Fields** (`custom_modules` entitlement — Enterprise only), scoped to "add fields to Customers/Enquiries/Bookings" rather than an open-ended new-entity builder (see the schema comment on `CustomFieldDefinition` for why — this covers the realistic case of e.g. tracking Passport Number without an open-ended schema generator):
- `GET/POST/PATCH /api/custom-fields/definitions`, `GET /api/custom-fields/values/:module/:recordId`, `POST /api/custom-fields/values`
- Frontend: Custom Fields settings page (define fields per module) + a reusable `CustomFieldsForm` component embedded on the Customer detail page so values can actually be entered, not just defined

## All 10 phases complete.

Known gaps worth addressing before any real production use, gathered from notes across all phases:
- No real PDF generation/S3 storage — quotations, vouchers, invoices, and reports all use browser print-to-PDF as a stand-in (Phase 5 note)
- The subscription-lifecycle and automation-engine BullMQ jobs are commented out in `server.ts` by default (need Redis running locally) — uncomment both once Redis is available
- Email OTP login is feature-flagged off (`OTP_LOGIN_ENABLED` in `auth.controller.ts`) per an earlier request — flip it back on when ready
- The shared-database-with-clientId architecture trades away the SRS's structural per-client isolation guarantee — see `ARCHITECTURE.md`'s explicit note on this trade-off
- WhatsApp is scaffolding only, pending real Meta credentials
- No automated test suite exists yet despite ten phases of business logic (tenant scoping, entitlements, RBAC, subscription lifecycle, automation triggers, and double-booking prevention are the highest-value places to start)
