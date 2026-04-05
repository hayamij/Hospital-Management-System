# Hospital Management System

Full-stack web application for hospital operations: patient onboarding, appointment lifecycle, doctor workflows, medical records, messaging, billing, and admin governance.

## 1) De tai va pham vi

- Roles: guest, patient, doctor, admin.
- Core domains: appointment scheduling, medical records, invoicing/payments, profile management, communications.
- Frontend: role-aware portal with public pages + authenticated workspaces.
- Backend: MSSQL-backed API with clean architecture layering.

## 2) Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3, Vite, Pinia, Vue Router, Axios, TailwindCSS |
| Backend API | Node.js (ESM), Express 5 |
| Security | JWT, bcrypt |
| Database | Microsoft SQL Server (mssql driver) |
| Testing | Vitest, Supertest |
| Build tooling | Vite, PostCSS, npm scripts |

## 3) Quick setup

### Prerequisites

- Node.js 20+ (or equivalent modern LTS)
- SQL Server running and accessible
- SSMS (or compatible SQL tool)

### Install

```powershell
npm install
```

### Database reset + seed

Run this file in SSMS:

- `server/infrastructure/db/schema.sql`

What it does:

- Drop + recreate database `HospitalManagementSystem`
- Create schema (tables + indexes)
- Seed baseline data for all core modules

### Environment

Create `.env` (or set env vars in shell):

```env
DB_CLIENT=mssql
MSSQL_SERVER=YOUR_SERVER
MSSQL_USER=YOUR_USER
MSSQL_PASSWORD=YOUR_PASSWORD
MSSQL_DATABASE=HospitalManagementSystem
PORT=3000
JWT_SECRET=change-me
```

## 4) Run commands

```powershell
# API
npm run dev:api

# Frontend
npm run dev

# Test
npm test

# Production build
npm run build
```

## 5) Architecture and patterns

### Clean architecture layout

- Domain: `server/domain` (entities, value objects, domain exceptions)
- Application: `server/application` (use cases, DTO, ports)
- Adapters: `server/adapters` (HTTP controllers, view models)
- Infrastructure: `server/infrastructure` (DB repos, HTTP bootstrap)

Dependency direction is inward only: `infrastructure -> adapters -> application -> domain`.

### Patterns in use

- Use Case / Interactor pattern
- Repository pattern via application ports
- Adapter pattern for HTTP and persistence boundaries
- DTO + ViewModel mapping pattern
- Lightweight dependency injection via context/deps factories
- Store orchestration pattern on frontend (Pinia + role helpers)

## 6) Source inventory (valuation snapshot)

Snapshot date: 2026-04-05

### Code volume (JS/Vue focused)

| Metric | Value |
|---|---:|
| Total code files (JS/Vue) | 443 |
| Total code lines (JS/Vue) | 26,764 |
| Frontend code files / lines | 88 / 12,796 |
| Backend code files / lines | 273 / 7,941 |
| Test code files / lines | 81 / 6,008 |

### Repository-wide footprint (tracked files)

| Metric | Value |
|---|---:|
| Total tracked+workspace files (excluding build/vendor dirs) | 468 |
| Total lines across all tracked files | 206,058 |
| package.json dependencies / devDependencies | 10 / 7 |
| npm scripts | 6 |

### Backend architecture counts

| Component | Count |
|---|---:|
| Domain entities | 10 |
| Value objects | 2 |
| Domain exceptions | 1 |
| Use case files | 52 |
| DTO files | 104 |
| Port interfaces | 20 |
| HTTP controllers | 25 |
| ViewModel files | 5 |
| SQL repositories | 14 |

### Use case distribution by context

| Context | Use cases |
|---|---:|
| Auth | 3 |
| Guest | 7 |
| Patient | 14 |
| Doctor | 13 |
| Admin | 15 |

### API surface (Express routes)

| Metric | Value |
|---|---:|
| Total routes | 54 |
| GET / POST / PUT / PATCH / DELETE | 22 / 23 / 6 / 1 / 2 |

| Area | Routes |
|---|---:|
| Auth | 3 |
| Patient | 14 |
| Guest | 7 |
| Doctor | 13 |
| Admin | 17 |

### Frontend composition

| Module | Count |
|---|---:|
| Total page components (`client/src/pages`) | 30 |
| Pinia stores | 16 |
| Store helper modules | 4 |

| Page group | Count |
|---|---:|
| Auth | 2 |
| Public | 9 |
| Patient | 5 |
| Doctor | 4 |
| Backoffice | 5 |

### Database schema scale

| Metric | Value |
|---|---:|
| CREATE TABLE statements | 17 |
| CREATE INDEX statements | 7 |
| Seed INSERT statements | 30 |

## 7) Quality gates (latest run)

- Test status: `81/81` test files passed, `138/138` tests passed.
- Build status: production build successful (`npm run build`).
- IDE diagnostics: no compile/syntax errors reported in workspace scan.

## 8) Demo credentials (seed)

- Admin shortcut: `admin` / `123`
- Admin email: `admin@example.com` / `password`
- Doctor: `doc@example.com` / `password`
- Patient: `patient@example.com` / `password`

---

If you need an investor-facing version, this README can be converted to a 1-page valuation memo (scope, architecture maturity, QA posture, and delivery risk profile).
