# BCA Auth Standard — Google OAuth

Decision: 2026-06-19. All apps use Google OAuth via the same pattern.

## Stack
- Provider: Google OAuth 2.0
- Library: `google-auth` + `google-auth-oauthlib` (Python backend)
- Frontend: redirect to Google → callback → exchange code for session

## Backend pattern (FastAPI)

### requirements.txt additions
```
google-auth==2.49.0
google-auth-oauthlib==1.2.0
google-auth-httplib2==0.3.0
httpx==0.28.1
python-jose[cryptography]==3.5.0
```

### Environment variables
```
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_REDIRECT_URI=https://<backend>.onrender.com/api/auth/callback
SECRET_KEY=<random 32-byte hex>
```

### Auth endpoints (drop into any server.py)
```python
import os, httpx, uuid
from datetime import datetime, timezone, timedelta
from jose import jwt
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse

auth_router = APIRouter(prefix="/api/auth")

GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]
GOOGLE_CLIENT_SECRET = os.environ["GOOGLE_CLIENT_SECRET"]
GOOGLE_REDIRECT_URI = os.environ["GOOGLE_REDIRECT_URI"]
SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM = "HS256"
SESSION_DAYS = 30

@auth_router.get("/login")
async def login():
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
    }
    from urllib.parse import urlencode
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return RedirectResponse(url)

@auth_router.get("/callback")
async def callback(code: str, response: Response):
    async with httpx.AsyncClient() as client:
        token_resp = await client.post("https://oauth2.googleapis.com/token", data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        })
        if token_resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Token exchange failed")
        tokens = token_resp.json()

        userinfo_resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        userinfo = userinfo_resp.json()

    email = userinfo["email"]
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": userinfo.get("name", ""),
            "picture": userinfo.get("picture", ""),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    token = jwt.encode(
        {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)},
        SECRET_KEY, algorithm=ALGORITHM
    )
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    resp = RedirectResponse(f"{frontend_url}/dashboard")
    resp.set_cookie("session", token, httponly=True, secure=True, samesite="lax", max_age=SESSION_DAYS * 86400)
    return resp

@auth_router.get("/me")
async def me(request: Request):
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid session")
    user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@auth_router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("session")
    return {"message": "Logged out"}
```

### Wire into server.py
```python
# After api_router definition:
api_router.include_router(auth_router)
# Remove old /auth/session and /auth/me endpoints
```

## Frontend pattern (React)

### Login trigger (replaces emergentagent.com redirect)
```jsx
const handleLogin = () => {
  window.location.href = `${process.env.REACT_APP_BACKEND_URL}/api/auth/login`;
};
```

### Auth check (App.js — already works via /api/auth/me cookie)
No change needed — the `/api/auth/me` endpoint pattern stays the same.

### Logout
```jsx
const handleLogout = async () => {
  await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/logout`);
  setUser(null);
};
```

## Google Cloud Console setup (one-time per app)
1. console.cloud.google.com → New Project (or reuse BCA project)
2. APIs & Services → Credentials → Create OAuth 2.0 Client ID
3. Application type: Web application
4. Authorized redirect URIs: `https://<backend>.onrender.com/api/auth/callback`
5. Copy Client ID + Secret → Render env vars

## Shared BCA Google Cloud Project (recommended)
Use ONE Google Cloud project for all BCA apps. Add each app's redirect URI to the same OAuth client.
Env vars per app: same `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`, different `GOOGLE_REDIRECT_URI`.
