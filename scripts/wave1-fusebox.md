# Wave 1 Fix Script — Fusebox

Priority: MONETIZE — health check, purge Emergent, confirm core path.

## Audit checklist

```bash
grep -rn "emergent\|emergentagent\|EMERGENT" --include="*.py" --include="*.js" --include="*.jsx" --include="*.html" .
grep -n "allow_origins\|allow_credentials" backend/server.py
grep -E "httpx|dnspython" backend/requirements.txt
ls vercel.json 2>/dev/null
```

## Standard fixes (same pattern as all BCA repos)

### CORS
```python
ALLOWED_ORIGINS = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=ALLOWED_ORIGINS, allow_methods=["*"], allow_headers=["*"])
```

### Emergent LLM → OpenAI SDK
```python
from openai import AsyncOpenAI
client_ai = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
```

### Auth URL → env var
```python
oauth_url = os.environ.get("OAUTH_SESSION_URL", "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data")
```

### requirements.txt
```bash
sed -i '/emergentintegrations/d' backend/requirements.txt
# Confirm httpx + dnspython present; add if missing:
echo "httpx==0.28.1" >> backend/requirements.txt
echo "dnspython==2.8.0" >> backend/requirements.txt
```

## Core path DoD check
- [ ] App loads at Render URL — no 502/503
- [ ] Login → auth → lands on dashboard
- [ ] Core Fusebox function executes (identify what that is on first read)
- [ ] No Emergent refs in any file
- [ ] CORS clean

## Render env vars
```
ALLOWED_ORIGINS=https://<frontend>.onrender.com
OPENAI_API_KEY=sk-...
OAUTH_SESSION_URL=<oauth provider>
REACT_APP_OAUTH_URL=<oauth provider base>
REACT_APP_BACKEND_URL=https://<backend>.onrender.com
MONGO_URL=<atlas connection string>
DB_NAME=fusebox
```
