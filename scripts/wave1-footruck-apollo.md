# Wave 1 Fix Script — Footruck-Apollo (FTA)

Priority: MONETIZE — verify live, confirm payment path end-to-end.

## Audit checklist (run on access)

```bash
# 1. Find all Emergent refs
grep -rn "emergent\|emergentagent\|EMERGENT" --include="*.py" --include="*.js" --include="*.jsx" --include="*.html" .

# 2. CORS check
grep -n "allow_origins\|allow_credentials\|CORSMiddleware" backend/server.py

# 3. Stripe / payment endpoint
grep -rn "stripe\|LAUNCHPAD30\|checkout\|payment" --include="*.py" .

# 4. httpx + dnspython in requirements
grep -E "httpx|dnspython" backend/requirements.txt

# 5. Vercel config (to remove)
ls vercel.json 2>/dev/null && echo "VERCEL FOUND — REMOVE"
```

## Fixes to apply (template — adjust line numbers after read)

### CORS (backend/server.py)
```python
# REPLACE:
#   allow_origins=["*"]
# WITH:
ALLOWED_ORIGINS = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=ALLOWED_ORIGINS, allow_methods=["*"], allow_headers=["*"])
```

### Emergent LLM → OpenAI
```python
# REPLACE emergentintegrations imports + LlmChat usage with:
from openai import AsyncOpenAI
client_ai = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
completion = await client_ai.chat.completions.create(
    model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
    messages=[{"role": "system", "content": system_msg}, {"role": "user", "content": user_input}]
)
response = completion.choices[0].message.content
```

### Auth session URL (backend/server.py)
```python
oauth_url = os.environ.get("OAUTH_SESSION_URL", "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data")
```

### Frontend auth (src/pages/Landing.jsx or equivalent)
```js
const authBase = process.env.REACT_APP_OAUTH_URL || 'https://auth.emergentagent.com';
window.location.href = `${authBase}/?redirect=${encodeURIComponent(redirectUrl)}`;
```

### Strip emergentintegrations from requirements.txt
```bash
sed -i '/emergentintegrations/d' backend/requirements.txt
```

### Remove vercel.json (if present)
```bash
git rm vercel.json
```

### Add render.yaml (if missing)
See `render.yaml` in restaunteur-pro root for template.

## Stripe / LAUNCHPAD30 DoD check
```bash
# Confirm endpoint exists and accepts promo code
curl -X POST https://<backend-url>/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"promo_code":"LAUNCHPAD30","tier":"foundry","amount":9900}'
# Expect: 200 + checkout_url or session_id
```

## Render env vars needed
```
ALLOWED_ORIGINS=https://<frontend>.onrender.com
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OAUTH_SESSION_URL=<oauth provider>
REACT_APP_OAUTH_URL=<oauth provider base>
REACT_APP_BACKEND_URL=https://<backend>.onrender.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## DoD
- [ ] Builds clean on Render
- [ ] No Emergent refs anywhere
- [ ] CORS: explicit origins, no wildcard+credentials
- [ ] User can visit site → log in → select Foundry $99 tier → apply LAUNCHPAD30 → pay → see confirmation
