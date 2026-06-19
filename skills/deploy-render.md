# Skill: deploy-render

Deploy or re-deploy Restaunteur-Pro to Render via the render.yaml blueprint.

## Pre-flight checks

1. `render.yaml` exists at repo root ✅ (already created)
2. Render dashboard: https://dashboard.render.com → New → Blueprint → connect repo
3. Required env vars (set in Render dashboard, NOT in code):
   - `MONGO_URL` — MongoDB Atlas connection string
   - `DB_NAME` — e.g. `restaunteur_pro`
   - `REACT_APP_BACKEND_URL` — the backend Render URL, e.g. `https://restaunteur-pro-backend.onrender.com`

## Services created by render.yaml

| Name | Type | URL pattern |
|---|---|---|
| `restaunteur-pro-frontend` | Static site | `https://restaunteur-pro-frontend.onrender.com` |
| `restaunteur-pro-backend` | Python web service | `https://restaunteur-pro-backend.onrender.com` |

## Update flow (after code changes)

Push to `claude/nice-bardeen-gvjsc3` → Render auto-deploys on push if branch is connected.
Or manually trigger: Render dashboard → service → Manual Deploy → Deploy latest commit.

## Health check

```bash
curl https://restaunteur-pro-backend.onrender.com/api/health
```

## CORS note

Backend `server.py` must allow the Render frontend origin. Check the `CORSMiddleware` config:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://restaunteur-pro-frontend.onrender.com", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Troubleshooting

- Build fails: check `frontend/package.json` — `craco build` requires `@craco/craco` in deps
- Backend crashes: check `MONGO_URL` env var is set in Render dashboard
- 404 on refresh: confirm `routes: rewrite /* → /index.html` is in `render.yaml` ✅
