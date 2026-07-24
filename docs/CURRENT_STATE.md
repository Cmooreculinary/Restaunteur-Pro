# Restaunteur Pro — Current State

Status: verified against `main` on 2026-07-23
Target modernization branch: `upgrade/restaunteur-pro-v2`
Production target branch: `main`

## Executive finding

Restaunteur Pro is a deployed two-service Render application. The frontend and
backend separation is sound, but both sides carry concentrated technical debt:
the frontend remains on Create React App/CRACO and the backend combines database
initialization, models, routes, business logic, payments, AI, and document tooling
inside a single legacy module.

Modernization must preserve the deployed behavior while the application is
separated into testable layers. Visual redesign and capability expansion must
follow the regression baseline, not precede it.

## Deployment topology

| Service | Render type | Repository root | Build | Runtime |
|---|---|---|---|---|
| `restaunteur-pro-frontend` | Static web service | `frontend` | Yarn + CRA/CRACO | Render global static delivery |
| `restaunteur-pro-api` | Python web service | `backend` | pip requirements | Uvicorn/FastAPI |

The API uses `/api/health` as its health check and persists SQLite data on the
`restaunteur-data` disk mounted at `/data`.

## Frontend

- React 19 with React Router 7.
- Create React App 5 controlled through CRACO.
- Tailwind CSS 3 and Radix-based UI components.
- Axios is configured globally in `src/App.js`.
- Authentication uses a secure cookie and a bearer token retained in
  `sessionStorage`.
- The production interface is concentrated in seven pages and eight major
  feature modules.
- Current visual language uses Outfit, Inter, JetBrains Mono, gold accents,
  Zinc surfaces, rounded cards, and shadow-heavy elevation.

### Baseline verification

- Frontend unit tests: **1 passed**.
- Production build in the audit environment: **failed** under Node 24 because
  the legacy CRA dependency tree could not resolve `ajv/dist/compile/codegen`.
- Render pins Node 20; production was not changed by this audit.

The build failure is evidence for an isolated Vite migration. It is not evidence
that the currently deployed Render build failed.

## Backend

- FastAPI entrypoint: `backend/app.py`.
- Legacy application module: `backend/server.py`.
- SQLite access uses `aiosqlite`.
- Tables are created through a startup SQL script rather than versioned
  migrations.
- Authentication, Google OAuth, Stripe, AI integrations, and core domain routes
  share the same application process.
- `app.py` removes selected legacy routes at runtime and registers hardened
  replacements.
- FastAPI startup uses deprecated `on_event("startup")` behavior.

### Baseline verification

- Production authentication tests: **4 passed**.
- Warnings: **2**, both caused by deprecated FastAPI startup-event handling.

## Security boundaries

- CORS origins are explicit and derived from the frontend service.
- Credentialed cross-origin requests are enabled.
- OAuth state is stored server-side.
- Stripe webhook signatures are enforced in the production wrapper.
- OAuth completion currently returns a session token through the URL fragment.
- The frontend stores that bearer token in `sessionStorage`.
- A shared admin access-code route exists and requires explicit review before
  production expansion.

## Data boundary

SQLite on a single persistent disk is acceptable for the current single-instance
deployment. It limits horizontal API scaling and requires documented backup,
restore, migration, and corruption-recovery procedures.

Moving to PostgreSQL is an architecture decision and is not authorized by this
foundation branch.

## Modernization constraints

1. Preserve production behavior until contract tests cover it.
2. Never combine the Vite migration with the full visual redesign.
3. Never combine database migration with interface work.
4. Complete one vertical capability slice at a time.
5. Keep Render CORS origins explicit.
6. Keep secrets exclusively in Render environment variables.
7. Rehearse database backup and rollback before schema changes.
8. Route architecture-level decisions through Conrad/EXPO.
