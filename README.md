# Hospital Management System

Full-stack web application for hospital operations: patient onboarding, appointment lifecycle, doctor workflows, medical records, messaging, billing, and admin governance.

## 1) About project

- Roles: guest, patient, doctor, admin.
- Core domains: appointment scheduling, medical records, invoicing/payments, profile management, communications.
- Frontend: role-aware portal with public pages + authenticated workspaces.
- Backend: MSSQL-backed API with clean architecture layering.

## 2) Tech stack

| Frontend | Backend API | Security | Database | Testing | Tooling |
|---|---|---|---|---|---|
| Vue 3, Vite, Pinia, Vue Router, Axios, TailwindCSS | Node.js (ESM), Express 5 | JWT, bcrypt | Microsoft SQL Server (mssql driver) | Vitest, Supertest | Vite, PostCSS, npm scripts |

## 3) Quick setup

- Prerequisites: Node.js 20+ (or modern LTS), SQL Server running, SSMS (or compatible SQL tool).
- Install:

```powershell
npm install
```

- Database reset + seed: run `server/infrastructure/db/schema.sql` in SSMS. It drops/recreates `HospitalManagementSystem`, creates schema (tables + indexes), and seeds baseline data.
- Environment (`.env` or shell vars):

```env
DB_CLIENT=mssql
MSSQL_SERVER=YOUR_SERVER
MSSQL_USER=YOUR_USER
MSSQL_PASSWORD=YOUR_PASSWORD
MSSQL_DATABASE=HospitalManagementSystem
PORT=3000
JWT_SECRET=change-me
```

- Run:

```powershell
<<<<<<< HEAD
# Full stack (API + Frontend)
npm run dev

# Frontend only
npm run dev:web

# API only
npm run dev:api

# Test
npm test

# Production build
npm run build

# Generate backend vs frontend route matrix
npm run report:route-matrix

# Generate use case activation matrix
npm run report:usecase-matrix
=======
npm run dev:api   # API
npm run dev       # Frontend
npm test          # Test
npm run build     # Production build
>>>>>>> 51d84777fc18a196700d0d3d2a290e584df9c5c2
```

## 4) Architecture and patterns

- Clean architecture:
	- Domain: `server/domain` (entities, value objects, domain exceptions)
	- Application: `server/application` (use cases, DTO, ports)
	- Adapters: `server/adapters` (HTTP controllers, view models)
	- Infrastructure: `server/infrastructure` (DB repos, HTTP bootstrap)
- Dependency direction: `infrastructure -> adapters -> application -> domain`.
- Patterns: Use Case/Interactor, Repository via ports, Adapter boundaries, DTO + ViewModel mapping, lightweight DI (context/deps factories), frontend store orchestration (Pinia + role helpers).

## 5) Source inventory (valuation snapshot)

Snapshot date: 2026-04-05

| Area | Files | Lines | Details |
|---|---:|---:|---|
| JS/Vue code volume | 443 | 26,764 | Frontend 88 / 12,796; Backend 273 / 7,941; Test 81 / 6,008 |
| Repository-wide footprint (excluding build/vendor dirs) | 468 | 206,058 | package.json dependencies/devDependencies: 10 / 7; npm scripts: 6 |
| Backend architecture counts | - | - | Domain entities 10; Value objects 2; Domain exceptions 1; Use case files 52; DTO files 104; Port interfaces 20; HTTP controllers 25; ViewModel files 5; SQL repositories 14 |
| Frontend composition | - | - | Total page components (`client/src/pages`) 30; Pinia stores 16; Store helper modules 4 |
| Database schema scale | - | - | CREATE TABLE 17; CREATE INDEX 7; Seed INSERT 30 |

| Context | Use cases | API routes | Frontend pages |
|---|---:|---:|---:|
| Auth | 3 | 3 | 2 |
| Guest/Public | 7 | 7 | 9 |
| Patient | 14 | 14 | 5 |
| Doctor | 13 | 13 | 4 |
| Admin/Backoffice | 15 | 17 | 5 |
| Total | 52 | 54 | 30 |

API HTTP method split: GET / POST / PUT / PATCH / DELETE = 22 / 23 / 6 / 1 / 2.

## 6) Quality gates (latest run)

- Test status: `81/81` test files passed, `138/138` tests passed.
- Build status: production build successful (`npm run build`).
- IDE diagnostics: no compile/syntax errors reported in workspace scan.

## 7) Demo credentials (seed)

- Admin email: `admin@example.com` / `12345678`
- Doctor: `doc2@example.com` / `12345678`
