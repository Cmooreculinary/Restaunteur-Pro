from __future__ import annotations

"""Production entrypoint for Restaurateur Pro.

This module wraps the legacy FastAPI application with launch-safe authentication,
explicit CORS, a working Google OAuth callback, a correct OpenAI integration, and
signature-enforced Stripe webhooks. Render should start ``app:app`` from the
``backend`` root directory.
"""

import hashlib
import hmac
import os
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import quote, urlencode

import bcrypt
import httpx
import stripe
from fastapi import Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from openai import AsyncOpenAI
from starlette.middleware.cors import CORSMiddleware

import server

app = server.app


def _remove_route(path: str) -> None:
    app.router.routes[:] = [
        route for route in app.router.routes if getattr(route, "path", None) != path
    ]


for _path in (
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/google/init",
    "/api/auth/google/callback",
    "/api/auth/secret",
    "/api/auth/logout",
    "/api/ap/ai-insights",
    "/api/webhook/stripe",
):
    _remove_route(_path)


# Replace the legacy wildcard credentialed CORS middleware with an explicit list.
app.user_middleware = [
    middleware
    for middleware in app.user_middleware
    if middleware.cls is not CORSMiddleware
]
app.middleware_stack = None


def _absolute_url(value: str | None, default: str) -> str:
    candidate = (value or "").strip().rstrip("/")
    if not candidate:
        return default.rstrip("/")
    if candidate.startswith(("http://", "https://")):
        return candidate
    return f"https://{candidate}"


def _frontend_url() -> str:
    return _absolute_url(os.environ.get("FRONTEND_URL"), "http://localhost:3000")


def _backend_url() -> str:
    configured = os.environ.get("BACKEND_URL") or os.environ.get("RENDER_EXTERNAL_HOSTNAME")
    return _absolute_url(configured, "http://localhost:8000")


def _cors_origins() -> list[str]:
    raw = os.environ.get("CORS_ORIGINS") or os.environ.get("FRONTEND_URL")
    values = [item.strip() for item in (raw or "").split(",") if item.strip()]
    origins = [_absolute_url(item, "") for item in values]
    if not origins:
        origins = ["http://localhost:3000"]
    return list(dict.fromkeys(origins))


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Stripe-Signature"],
)


@app.middleware("http")
async def production_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    if request.url.path.startswith("/api/auth/"):
        response.headers["Cache-Control"] = "no-store"
        response.headers["Pragma"] = "no-cache"
    return response


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, stored_hash: str | None) -> tuple[bool, bool]:
    """Return (valid, needs_migration_from_legacy_sha256)."""
    if not stored_hash:
        return False, False
    if stored_hash.startswith(("$2a$", "$2b$", "$2y$")):
        try:
            return bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8")), False
        except ValueError:
            return False, False
    legacy = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return hmac.compare_digest(legacy, stored_hash), True


async def _create_session(user_id: str, days: int = 7) -> tuple[str, int]:
    now = datetime.now(timezone.utc)
    token = f"sess_{uuid.uuid4().hex}"
    expires_at = now + timedelta(days=days)
    await server.db_delete("user_sessions", {"user_id": user_id})
    await server.db_insert(
        "user_sessions",
        {
            "user_id": user_id,
            "session_token": token,
            "expires_at": expires_at.isoformat(),
            "created_at": now.isoformat(),
        },
    )
    return token, days * 24 * 60 * 60


async def _auth_payload(user: dict, token: str, expires_in: int) -> dict:
    profile = await server.db_get("business_profiles", {"user_id": user["user_id"]})
    payload = {key: value for key, value in user.items() if key != "password_hash"}
    if profile:
        payload["profile_id"] = profile.get("profile_id")
        payload["onboarding_completed"] = profile.get("onboarding_completed", False)
        payload["onboarding_step"] = profile.get("onboarding_step", 0)
    payload.update(
        {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": expires_in,
        }
    )
    return payload


async def _ensure_profile(user_id: str, completed: bool = False) -> dict:
    existing = await server.db_get("business_profiles", {"user_id": user_id})
    if existing:
        return existing
    profile = server.BusinessProfile(user_id=user_id)
    profile.onboarding_completed = completed
    document = profile.model_dump()
    document["created_at"] = document["created_at"].isoformat()
    document["updated_at"] = document["updated_at"].isoformat()
    await server.db_insert("business_profiles", document)
    return document


@app.post("/api/auth/register")
async def register(data: server.RegisterRequest, response: Response):
    email = data.email.strip().lower()
    if not email or not data.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if await server.db_get("users", {"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    now = datetime.now(timezone.utc).isoformat()
    user = {
        "user_id": f"user_{uuid.uuid4().hex[:12]}",
        "email": email,
        "name": data.name.strip() or email.split("@", 1)[0],
        "password_hash": _hash_password(data.password),
        "picture": None,
        "onboarding_completed": False,
        "created_at": now,
    }
    await server.db_insert("users", user)
    await _ensure_profile(user["user_id"])
    token, expires_in = await _create_session(user["user_id"])
    server._set_session_cookie(response, token)
    return await _auth_payload(user, token, expires_in)


@app.post("/api/auth/login")
async def login(data: server.LoginRequest, response: Response):
    email = data.email.strip().lower()
    user = await server.db_get("users", {"email": email})
    valid, migrate = _verify_password(data.password, user.get("password_hash") if user else None)
    if not user or not valid:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if migrate:
        await server.db_update(
            "users",
            {"user_id": user["user_id"]},
            {"password_hash": _hash_password(data.password)},
        )
        user["password_hash"] = "migrated"

    await _ensure_profile(user["user_id"])
    token, expires_in = await _create_session(user["user_id"])
    server._set_session_cookie(response, token)
    return await _auth_payload(user, token, expires_in)


@app.get("/api/auth/google/init")
async def google_oauth_init():
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=503, detail="Google OAuth is not configured")

    state = f"oauth_{uuid.uuid4().hex}"
    now = datetime.now(timezone.utc)
    await server.db_insert(
        "oauth_states",
        {
            "state_nonce": state,
            "expires_at": (now + timedelta(minutes=10)).isoformat(),
            "created_at": now.isoformat(),
        },
    )
    redirect_uri = f"{_backend_url()}/api/auth/google/callback"
    params = urlencode(
        {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "online",
            "prompt": "select_account",
        }
    )
    return {"auth_url": f"https://accounts.google.com/o/oauth2/v2/auth?{params}"}


@app.get("/api/auth/google/callback")
async def google_oauth_callback(code: str, state: str):
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise HTTPException(status_code=503, detail="Google OAuth is not configured")

    state_record = await server.db_get("oauth_states", {"state_nonce": state})
    if not state_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")
    expires_at = datetime.fromisoformat(state_record["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    await server.db_delete("oauth_states", {"state_nonce": state})
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OAuth state expired")

    redirect_uri = f"{_backend_url()}/api/auth/google/callback"
    async with httpx.AsyncClient(timeout=20) as client:
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        if token_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Google OAuth token exchange failed")
        google_access_token = token_response.json().get("access_token")
        user_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {google_access_token}"},
        )
        if user_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Google profile request failed")
        google_user = user_response.json()

    email = (google_user.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Google did not provide an email address")

    user = await server.db_get("users", {"email": email})
    now = datetime.now(timezone.utc).isoformat()
    if user:
        update = {"picture": google_user.get("picture")}
        if not user.get("name"):
            update["name"] = google_user.get("name") or email.split("@", 1)[0]
        await server.db_update("users", {"user_id": user["user_id"]}, update)
        user.update(update)
    else:
        user = {
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": email,
            "name": google_user.get("name") or email.split("@", 1)[0],
            "picture": google_user.get("picture"),
            "password_hash": None,
            "onboarding_completed": False,
            "created_at": now,
        }
        await server.db_insert("users", user)

    await _ensure_profile(user["user_id"])
    token, _ = await _create_session(user["user_id"])
    destination = f"{_frontend_url()}/#access_token={quote(token, safe='')}"
    response = RedirectResponse(destination, status_code=302)
    server._set_session_cookie(response, token)
    return response


@app.post("/api/auth/secret")
async def secret_login(request: Request, response: Response):
    configured_code = os.environ.get("ADMIN_ACCESS_CODE")
    if not configured_code:
        raise HTTPException(status_code=503, detail="Admin access is disabled")
    body = await request.json()
    supplied = str(body.get("code", ""))
    if not hmac.compare_digest(supplied, configured_code):
        raise HTTPException(status_code=401, detail="Invalid access code")

    email = os.environ.get("ADMIN_EMAIL", "admin@restaurateurpro.local").strip().lower()
    user = await server.db_get("users", {"email": email})
    now = datetime.now(timezone.utc).isoformat()
    if not user:
        user = {
            "user_id": f"admin_{uuid.uuid4().hex[:12]}",
            "email": email,
            "name": "Administrator",
            "picture": None,
            "password_hash": None,
            "onboarding_completed": True,
            "created_at": now,
        }
        await server.db_insert("users", user)
    profile = await _ensure_profile(user["user_id"], completed=True)
    if not profile.get("onboarding_completed"):
        await server.db_update(
            "business_profiles",
            {"profile_id": profile["profile_id"]},
            {"onboarding_completed": True, "onboarding_step": 7, "updated_at": now},
        )
    await server.db_update("users", {"user_id": user["user_id"]}, {"onboarding_completed": True})
    user["onboarding_completed"] = True

    token, expires_in = await _create_session(user["user_id"], days=1)
    server._set_session_cookie(response, token, days=1)
    return await _auth_payload(user, token, expires_in)


@app.post("/api/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    authorization = request.headers.get("Authorization", "")
    if not token and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
    if token:
        await server.db_delete("user_sessions", {"session_token": token})
    response.delete_cookie(
        key="session_token",
        path="/",
        secure=True,
        httponly=True,
        samesite="none",
    )
    return {"message": "Logged out"}


@app.post("/api/ap/ai-insights")
async def ap_ai_insights(
    data: dict,
    user: server.User = Depends(server.get_current_user),
):
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="OpenAI is not configured")

    context = str(data.get("context", ""))
    invoices = await server.db_list("ap_invoices", {"user_id": user.user_id})
    vendors = await server.db_list("ap_vendors", {"user_id": user.user_id})
    unpaid = sum(
        item.get("total", 0)
        for item in invoices
        if item.get("status") in {"pending_approval", "approved", "scheduled_for_payment"}
    )
    prompt = (
        "Analyze the following restaurant accounts-payable summary. Return two or three "
        "concise, actionable insights as valid JSON with an 'insights' array. Each item "
        "must contain 'insight' and 'priority'. Do not invent facts.\n\n"
        f"Operator context: {context}\n"
        f"Unpaid total: {unpaid:.2f}\n"
        f"Invoice count: {len(invoices)}\n"
        f"Vendor count: {len(vendors)}"
    )
    try:
        client = AsyncOpenAI(api_key=api_key)
        completion = await client.chat.completions.create(
            model=os.environ.get("OPENAI_MODEL", "gpt-4o"),
            max_tokens=400,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a precise restaurant AP analyst."},
                {"role": "user", "content": prompt},
            ],
        )
        content = completion.choices[0].message.content or '{"insights": []}'
        return {
            "insights": content,
            "context": context,
            "generated": True,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:
        server.logger.exception("OpenAI AP insight generation failed: %s", exc)
        raise HTTPException(status_code=502, detail="AI insights are temporarily unavailable") from exc


@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    api_key = os.environ.get("STRIPE_API_KEY")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    signature = request.headers.get("Stripe-Signature")
    if not api_key or not webhook_secret:
        raise HTTPException(status_code=503, detail="Stripe webhook is not configured")
    if not signature:
        raise HTTPException(status_code=400, detail="Missing Stripe signature")

    stripe.api_key = api_key
    try:
        event = stripe.Webhook.construct_event(
            await request.body(),
            signature,
            webhook_secret,
        )
    except (ValueError, stripe.error.SignatureVerificationError) as exc:
        raise HTTPException(status_code=400, detail="Invalid Stripe webhook") from exc

    if event.get("type") == "checkout.session.completed":
        session = event["data"]["object"]
        session_id = session.get("id")
        if session_id:
            now = datetime.now(timezone.utc).isoformat()
            transaction = await server.db_get("payment_transactions", {"session_id": session_id})
            if transaction:
                await server.db_update(
                    "payment_transactions",
                    {"session_id": session_id},
                    {"payment_status": "paid", "updated_at": now},
                )
                if transaction.get("user_id"):
                    await server.db_update(
                        "users",
                        {"user_id": transaction["user_id"]},
                        {
                            "subscription_plan": transaction.get("plan_id"),
                            "subscription_status": "active",
                        },
                    )
            donation = await server.db_get("donations", {"session_id": session_id})
            if donation:
                await server.db_update(
                    "donations",
                    {"session_id": session_id},
                    {"status": "paid", "updated_at": now},
                )

    return {"received": True}
