# Local XAMPP Staging Environment

This staging setup uses the existing XAMPP/MariaDB service but creates a separate database, account, backend port, frontend port, Redis database number, and uploads directory. It does not connect to or copy data from `digiink_crm`.

## Requirements

- XAMPP MySQL/MariaDB running locally
- Node.js 20+
- Redis running locally on port 6379 if you need workflows that enqueue jobs

## Create the isolated database

1. Start MySQL in the XAMPP Control Panel.
2. Open phpMyAdmin and select the SQL tab, or connect to MariaDB as an administrator.
3. Review `database/create_staging_database.sql`, replace its example password with a unique URL-safe password, then run it.
4. Do not import `database/digiink_crm.sql` into staging; that file drops and recreates tables and includes seed plans.

The SQL creates only `digiink_crm_staging` and the `digiink_staging` account. It does not alter the existing `digiink_crm` database. If you rerun it after changing the password, update the existing staging user with `ALTER USER` as well; `CREATE USER IF NOT EXISTS` does not rotate an existing user’s password.

## Configure staging secrets

Copy the template into the backend directory, replace all placeholders, and use the same database password in the SQL script and `DATABASE_URL`:

```powershell
Copy-Item .env.staging.example backend/.env.staging
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Generate separate values for `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`, the staging database password, and `SEED_SUPER_ADMIN_PASSWORD`. Keep the MySQL password URL-safe, or URL-encode it in `DATABASE_URL`. `.env.staging` is ignored by Git.

The template uses port 4100 for the backend, port 5174 for the frontend, Redis database 1, and `../uploads-staging` for uploaded files. These keep staging separated from the usual local ports, Redis DB 0, and `backend/uploads`.

Configure a dedicated staging SMTP account before testing email workflows. In production mode, the application refuses to write email content to logs if SMTP is unconfigured.

## Initialize and run staging

Open a PowerShell terminal in `backend`:

```powershell
$env:DOTENV_CONFIG_PATH = ".env.staging"
$env:NODE_OPTIONS = "--require dotenv/config"
npm.cmd run prisma:push
if ($LASTEXITCODE -ne 0) { throw "Staging schema setup failed" }
npm.cmd run seed
if ($LASTEXITCODE -ne 0) { throw "Staging seed failed" }
npm.cmd run dev
```

The schema push and seed use the staging `DATABASE_URL` loaded from `.env.staging`. The seed creates a demo tenant and prints a temporary password to the backend terminal. Use disposable staging records only; never reuse these credentials for production.

Open a second PowerShell terminal in `frontend`:

```powershell
$env:VITE_API_PROXY_TARGET = "http://localhost:4100"
npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Open `http://localhost:5174`. Check `http://localhost:4100/health` for the backend health response. The Vite proxy reads `VITE_API_PROXY_TARGET` from the frontend process environment so API and upload requests go to the staging backend. No database credentials are loaded into the frontend process.

## Restore and cleanup

- Use test records only. Do not copy production records into staging without an approved anonymization process.
- Before validating restore procedures, create a backup of `digiink_crm_staging` and restore it to a second disposable database. Never test restores against `digiink_crm`.
- Stop the two staging servers with Ctrl+C when finished.
- To remove staging data, first confirm the selected database is `digiink_crm_staging`, then remove that database and staging upload directory. Do not remove or overwrite `digiink_crm` or `backend/uploads`.

## Phase 0 acceptance checklist

- [ ] Dedicated XAMPP database and least-privilege staging account created.
- [ ] Schema push and seed complete against staging only.
- [ ] Frontend and backend run on separate staging ports.
- [ ] Health endpoint responds successfully.
- [ ] Staging records and uploads stay separate from the normal local development data.
- [ ] A backup restore succeeds into a second disposable database.
- [ ] CI backend/frontend jobs are green; CI currently allows an empty Vitest suite, so Phase 5 must replace that baseline with real tests.
