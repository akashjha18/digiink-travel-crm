# Architecture

## The trade-off, explicitly

The SRS calls for one fully isolated MySQL database per client — no
`client_id` column anywhere, isolation enforced structurally so a bug can
never leak one client's rows into another's query.

This build uses **one shared database** instead, with every tenant table
carrying a `clientId` column, so it runs on XAMPP/MariaDB for local
development without scripting `CREATE DATABASE` per client. This is a
real, deliberate reduction in the isolation guarantee: a missing
`WHERE clientId = ...` in a new query is now a cross-tenant data leak
waiting to happen, where in the original design it would be structurally
impossible.

**If this ever goes to production serving real paying customers, revisit
this.** The path back to isolated databases is: split `prisma/schema.prisma`
back into a control schema and a tenant schema, remove `clientId` from
the tenant models, and reintroduce a per-client Prisma client resolver
(this repo's Phase 1 had exactly that — `tenant-prisma-resolver.ts` — if
you want a reference to restore).

## Guard chain (unchanged in spirit, adapted for one database)

```
authenticate       verify JWT, attach req.auth
    |
scopeTenant         load Client + Plan by req.auth.clientId, recompute
    |               subscription status from dates, attach req.clientId
    v
requireEntitlement  check Client.plan.entitlements JSON for this feature
    |
requirePermission   check the caller's Role.permissionsJson (scoped by
    |               clientId) for this module + action
    v
Controller
```

**The rule that replaces "structural isolation":** every Prisma query
against a tenant-scoped model (User, Customer, Enquiry, Booking, Driver,
Vehicle, Payment, Invoice, Document, Role, AuditLog, ...) MUST include
`clientId: req.clientId` in its `where` clause. There is no other wall.
Code review and tests are the enforcement mechanism now, not the database
layer — see `guards/tenant-scope.guard.ts` and `guards/rbac.guard.ts` for
the pattern to follow in every new controller.

Frontend routing still mirrors these rules for UX (hiding modules,
redirecting locked clients to `/payment-renewal`), but the backend checks
above are the actual enforcement.
