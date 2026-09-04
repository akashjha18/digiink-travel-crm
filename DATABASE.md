# Database

One schema, one database: `backend/prisma/schema.prisma` → `digiink_crm`.

Control-level models (no clientId — Super Admin only): `Plan`, `Client`,
`PaymentLog`, `PaymentNotice`, `SuperAdminUser`, `SuperAdminAuditLog`,
`SystemSetting`.

Tenant-scoped models (every one carries `clientId`): `Role`, `User`,
`Customer`, `Enquiry`, `FollowUp`, `Quotation`, `Booking`, `Trip`,
`Driver`, `Vehicle`, `Payment`, `Invoice`, `Document`, `AuditLog`.

`database/digiink_crm.sql` is the canonical raw-SQL version of this same
schema — import it directly via phpMyAdmin/XAMPP, or
`mysql -u root digiink_crm < database/digiink_crm.sql`. It also seeds the
four plans. Keep it in sync with `schema.prisma` by hand if you add
columns — there's no automatic export step wired up.

`provisioning.service.ts` creates a new client with one `$transaction`:
insert `Client`, insert its default "Client Admin" `Role` (full
permissions), insert the initial admin `User`. No `CREATE DATABASE` step
exists anymore.
