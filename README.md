# Digiink Travel CRM

A multi-tenant CRM for travel businesses, with customer and enquiry
management, quotations, bookings, trip operations, finance, reporting, and
subscription administration.

| Layer | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Material UI |
| Backend | Node.js, Express, TypeScript |
| Data | MySQL/MariaDB, Prisma |
| Background jobs | BullMQ and Redis (optional for local development) |

## Features

- **Super Admin:** tenant and plan management, subscription controls,
  payment notices, staff support, and audit logs.
- **CRM:** customer records, enquiry pipeline, follow-ups, round-robin
  assignment, staff management, and configurable roles and permissions.
- **Sales:** quotation creation and versioning, booking conversion, and
  browser print views for quotations and booking vouchers.
- **Travel operations:** trips, drivers, vehicles, document-expiry alerts,
  and server-side prevention of overlapping driver or vehicle assignments.
- **Finance:** manual booking payments and installments, receivables,
  GST invoices, and payment summaries.
- **Insights and automation:** sales, booking, revenue, and utilization
  reports; configurable workflow rules and execution logs.
- **Enterprise options:** branch management and rollups, custom fields,
  and WhatsApp integration scaffolding.
- **Access controls:** JWT authentication, password hashing, tenant
  scoping, role permissions, and plan entitlements.

Features are gated by subscription plan. Some integrations and background
features require additional configuration; see [Known limitations](#known-limitations).

## Requirements

- Node.js and npm
- XAMPP with MySQL/MariaDB
- Git
- Redis only if you intend to run the background subscription or
  automation jobs

## Local setup (Windows / XAMPP)

### 1. Start and initialize MySQL

Start MySQL in the XAMPP Control Panel. Import
[`database/digiink_crm.sql`](database/digiink_crm.sql) using phpMyAdmin.
The SQL file creates the database schema and plan records.

### 2. Configure the backend

Copy the example environment file to the backend directory:

```powershell
Copy-Item .env.example backend\.env
```

Edit `backend\.env` as needed. The example is configured for a local
MySQL server with database `digiink_crm`, user `root`, and no password.
Update `DATABASE_URL` if your MySQL credentials or port differ. Set
distinct, strong values for `JWT_SECRET` and `JWT_REFRESH_SECRET` before
using the app outside local development.

### 3. Install dependencies and prepare Prisma

```powershell
Set-Location backend
npm install
npm run prisma:generate
```

If you have changed the Prisma schema and need to sync it to your local
database, review the changes first, then run:

```powershell
npm run prisma:push
```

### 4. Seed initial data

Set a Super Admin password and run the seed script:

```powershell
$env:SEED_SUPER_ADMIN_PASSWORD = "ChooseAStrongPassword"
npm run seed
```

The default Super Admin email is `admin@digiinksolutions.com`. Override
it with `SEED_SUPER_ADMIN_EMAIL` if desired. The seed script creates the
plans and, if it does not already exist, a demo tenant
(`owner@demotravels.test`). It prints the demo owner's temporary password
when it creates that account; save it from the terminal output. The
Super Admin password is the value supplied in
`SEED_SUPER_ADMIN_PASSWORD`.

### 5. Run the backend and frontend

In one PowerShell terminal, from the repository root:

```powershell
Set-Location backend
npm run dev
```

In a second terminal:

```powershell
Set-Location frontend
npm install
npm run dev
```

Open the Vite URL shown in the frontend terminal (normally
http://localhost:5173). The backend listens on http://localhost:4000.
The frontend proxies `/api` and `/uploads` requests to the backend.

Check that the backend is responding at
http://localhost:4000/health; a healthy response is
`{"status":"ok"}`.

## Redis and background jobs

Redis is optional for the regular local app. The subscription-lifecycle
and automation BullMQ jobs are not started by default in
`backend/src/server.ts`. To enable them, start Redis and explicitly
enable the corresponding job imports in the server entry point. The
included `docker-compose.yml` starts Redis if Docker Compose is
installed:

```powershell
docker compose up -d redis
```

Set `REDIS_URL` in `backend\.env` to the address reachable by the backend
(for a local Redis service, `redis://localhost:6379`).

## Useful commands

Run these from the appropriate `backend` or `frontend` directory:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build for production (frontend and backend) |
| `npm test` | Run backend Vitest tests |
| `npm run prisma:generate` | Generate the Prisma client (backend) |
| `npm run prisma:push` | Sync the Prisma schema to the configured database (backend) |

## Architecture and security notes

This development setup uses **one shared MySQL database**. Tenant-owned
records are scoped by `clientId` in application queries rather than
being isolated into separate databases. This is a deliberate
simplification for local XAMPP development and has a weaker isolation
guarantee than per-tenant databases. Read
[`ARCHITECTURE.md`](ARCHITECTURE.md) before deploying or changing
tenant-scoped queries.

Never commit `.env` files or use development credentials in production.
Use unique secrets, HTTPS, restricted database credentials, backups,
and a reviewed deployment configuration before exposing the application
to real users.

## Known limitations

- WhatsApp message sending is simulated until real Meta Business API
  credentials and integration are configured.
- Quotations, vouchers, invoices, and reports use browser print-to-PDF;
  server-side PDF generation and S3 file storage are not implemented.
- Email OTP login is currently disabled in the backend.
- The subscription lifecycle and automation workers are disabled by
  default and require Redis.
- [`DEPLOYMENT.md`](DEPLOYMENT.md) documents production infrastructure
  work that is not yet implemented.

## Project documentation

- [Setup guide](SETUP.md)
- [Architecture](ARCHITECTURE.md)
- [API reference](API.md)
- [Database notes](DATABASE.md)
- [Deployment notes](DEPLOYMENT.md)
