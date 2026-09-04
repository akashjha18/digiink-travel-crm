# Setup (XAMPP / local MariaDB)

1. Start MySQL in XAMPP (default: no root password, port 3306).
2. Open phpMyAdmin → Import → choose `database/digiink_crm.sql`. This
   creates the `digiink_crm` database, every table, and seeds the 4 plans.
3. `cp .env.example .env` in the project root — the default
   `DATABASE_URL` already matches XAMPP's defaults. Edit it if your MySQL
   root user has a password.
4. `cd backend && npm install`
5. `npx prisma generate --schema=prisma/schema.prisma`
6. `SEED_SUPER_ADMIN_PASSWORD='ChangeMe123!' npm run seed`
   - Creates/updates the Super Admin login and the demo tenant
     ("Demo Travels", Professional plan). Safe to re-run — plans and the
     Super Admin user are upserted.
7. `npm run dev` — backend on http://localhost:4000
8. `cd ../frontend && npm install && npm run dev` — http://localhost:5173

## Redis (optional locally)

The subscription lifecycle sweep (BullMQ) needs Redis to start without
erroring. If you don't need the hourly cron locally, you can leave it
running and ignore connection retries, or start Redis with
`docker compose up -d`.

## Known local-environment note

`npx prisma generate` needs to reach Prisma's engine binary CDN the first
time. If you're behind a restrictive proxy/firewall, run it from a
network that allows `binaries.prisma.sh`.
