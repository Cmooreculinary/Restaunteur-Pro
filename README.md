# Restaunteur Pro

Restaunteur Pro is a full-stack restaurant opening and operations platform
deployed through a two-service Render Blueprint.

## Repository structure

- `frontend/` — React application deployed as a Render static service.
- `backend/` — FastAPI application deployed as a Render web service.
- `render.yaml` — production service and environment wiring.
- `DESIGN.md` — locked Trench Design modernization target.
- `docs/CURRENT_STATE.md` — verified modernization baseline.
- `docs/CAPABILITY_MATRIX.md` — frontend, API, and data capability map.
- `docs/architecture/` — Archify source specifications and rendered diagrams.

## Local verification

### Backend

```bash
cd backend
python -m venv .venv
. .venv/bin/activate
pip install -r requirements-dev.txt
pytest tests -q
```

### Frontend

Use Node 20, matching `render.yaml`.

```bash
cd frontend
corepack enable
yarn install --frozen-lockfile
yarn test --watchAll=false
yarn build
```

## Production safety

Production deploys from `main`. Modernization work targets
`upgrade/restaunteur-pro-v2` and must pass the quality workflow before merge.
Database changes require a tested backup and rollback procedure.
