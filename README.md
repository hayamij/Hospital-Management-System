# Hospital-Management-System
A full-stack web application for managing hospital operations including patient registration, appointment scheduling, doctor management, medical records, and billing.

## Database

The backend now uses SQL Server (MSSQL) only.

### SQL Server (SSMS) one-shot reset + seed

Run this file in SSMS:

- `src/infrastructure/db/schema.sql`

What it does automatically:

- Drops `HospitalManagementSystem` if it exists
- Recreates `HospitalManagementSystem`
- Creates all tables and indexes
- Inserts ready-to-use seed data for all core tables

After running `schema.sql`, start API in MSSQL mode:

```powershell
$env:DB_CLIENT="mssql"
$env:MSSQL_SERVER="PHUONGTUAN"
$env:MSSQL_USER="fuongtuan"
$env:MSSQL_PASSWORD="toilabanhmochi"
$env:MSSQL_DATABASE="HospitalManagementSystem"
npm run dev:api
```

## Seed Data

Seed data is applied by running `src/infrastructure/db/schema.sql` in SSMS.

Core tables include:

- `users`, `doctors`, `patients`
- `appointments`, `billings`, `payments`
- `medical_records`, `prescriptions`, `messages`, `lab_results`
- `services`, `insurance_plans`, `booking_constraints`, `settings`
- `contact_leads`, `audit_logs`, `refresh_tokens`

Sample login accounts:

- Admin shortcut: `admin` / `123`
- Admin email: `admin@example.com` / `password`
- Doctor: `doc@example.com` / `password`
- Patient: `patient@example.com` / `password`

Use API runtime:

`npm run dev:api`
