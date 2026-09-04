# API (Phase 1 + 2 endpoints)

Response envelope:
```json
{ "success": true, "data": {}, "message": "..." }
{ "success": false, "message": "...", "code": "FEATURE_NOT_ENTITLED" }
```

## Auth
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/change-password` (authenticated + tenant-scoped)

## Client
- `GET /api/client/profile`
- `GET /api/drivers` (Professional+ entitlement + RBAC example)
- `GET /api/payment-renewal`
- `POST /api/payment-renewal/notify` — raises a PaymentNotice for Super Admin

## Super Admin (all require a SUPER_ADMIN token)
- `GET /api/super-admin/dashboard`
- `GET /api/super-admin/clients`
- `GET /api/super-admin/clients/:id`
- `POST /api/super-admin/clients`
- `POST /api/super-admin/clients/:id/activate`
- `POST /api/super-admin/clients/:id/deactivate`
- `POST /api/super-admin/clients/:id/extend-grace` `{ days }`
- `POST /api/super-admin/clients/:id/delete`
- `POST /api/super-admin/clients/:id/confirm-payment`
- `GET /api/super-admin/clients/:id/usage`
- `GET /api/super-admin/clients/:id/users`
- `POST /api/super-admin/clients/:id/users/:userId/force-password-reset`
- `GET /api/super-admin/payment-notices?status=PENDING`
- `POST /api/super-admin/payment-notices/:id/dismiss`
- `GET /api/super-admin/plans`
- `POST /api/super-admin/plans`
- `PATCH /api/super-admin/plans/:id`
- `GET /api/super-admin/audit-logs`
