# Wave 3 Fix Script — BrainForge

Priority: HARDEN THEN SHIP — CORS misconfig is the primary blocker.

## Primary blocker
CORS: `allow_origins=["*"]` + `allow_credentials=True` — browsers block this combination.
Any authenticated request from the frontend will fail with a CORS preflight error.

## Fix (apply immediately on access)

### backend/server.py
```python
# Find the add_middleware block and replace:
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Full audit
```bash
grep -rn "emergent\|emergentagent\|EMERGENT_LLM_KEY\|emergentintegrations" \
  --include="*.py" --include="*.js" --include="*.jsx" --include="*.html" .
grep -n "allow_origins\|allow_credentials" backend/server.py
grep -E "httpx|dnspython" backend/requirements.txt
ls vercel.json 2>/dev/null
```

## Emergent LLM → OpenAI (if present)
```python
from openai import AsyncOpenAI
client_ai = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
completion = await client_ai.chat.completions.create(
    model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
    messages=[{"role": "system", "content": system_msg}, {"role": "user", "content": prompt}]
)
```

## render.yaml (add if missing)
```yaml
services:
  - type: web
    name: brainforge-frontend
    env: static
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: frontend/build
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: REACT_APP_BACKEND_URL
        sync: false

  - type: web
    name: brainforge-backend
    env: python
    buildCommand: pip install -r backend/requirements.txt
    startCommand: cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /api/health
    envVars:
      - key: MONGO_URL
        sync: false
      - key: DB_NAME
        sync: false
      - key: ALLOWED_ORIGINS
        sync: false
      - key: OPENAI_API_KEY
        sync: false
```

## Render env vars
```
ALLOWED_ORIGINS=https://brainforge-frontend.onrender.com
OPENAI_API_KEY=sk-...
MONGO_URL=<atlas>
DB_NAME=brainforge
REACT_APP_BACKEND_URL=https://brainforge-backend.onrender.com
```

## DoD
- [ ] Builds clean
- [ ] Deploys to Render
- [ ] CORS clean (explicit origins, no wildcard+credentials)
- [ ] No Emergent refs
- [ ] httpx + dnspython in requirements.txt
