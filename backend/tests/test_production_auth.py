import importlib
import os
import sys
import tempfile

from fastapi.testclient import TestClient


_db_file = tempfile.NamedTemporaryFile(suffix=".sqlite3", delete=False)
_db_file.close()
os.environ["DB_PATH"] = _db_file.name
os.environ["CORS_ORIGINS"] = "https://restaurateur.example"
os.environ["FRONTEND_URL"] = "https://restaurateur.example"
os.environ["ADMIN_ACCESS_CODE"] = "test-only-admin-code"

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
production = importlib.import_module("app")


def test_registration_returns_bearer_and_works_without_cookie():
    with TestClient(production.app) as client:
        registration = client.post(
            "/api/auth/register",
            json={
                "email": "operator@example.com",
                "password": "correct-horse-battery-staple",
                "name": "Operator",
            },
        )
        assert registration.status_code == 200, registration.text
        payload = registration.json()
        assert payload["token_type"] == "bearer"
        assert payload["access_token"].startswith("sess_")
        assert "password_hash" not in payload

        token = payload["access_token"]
        client.cookies.clear()
        me = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me.status_code == 200, me.text
        assert me.json()["email"] == "operator@example.com"


def test_legacy_sha256_password_is_detected_for_bcrypt_migration():
    password = "legacy-password"
    legacy_hash = production.hashlib.sha256(password.encode("utf-8")).hexdigest()
    valid, migrate = production._verify_password(password, legacy_hash)
    assert valid is True
    assert migrate is True

    modern_hash = production._hash_password(password)
    valid, migrate = production._verify_password(password, modern_hash)
    assert valid is True
    assert migrate is False


def test_cors_is_explicit_and_admin_route_is_not_hard_coded():
    with TestClient(production.app) as client:
        preflight = client.options(
            "/api/auth/login",
            headers={
                "Origin": "https://restaurateur.example",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type,authorization",
            },
        )
        assert preflight.status_code == 200
        assert preflight.headers["access-control-allow-origin"] == "https://restaurateur.example"
        assert preflight.headers.get("access-control-allow-credentials") == "true"

        rejected = client.post("/api/auth/secret", json={"code": "restaurateur2026"})
        assert rejected.status_code == 401


def test_unsigned_stripe_webhook_is_rejected():
    with TestClient(production.app) as client:
        response = client.post("/api/webhook/stripe", content=b"{}")
        assert response.status_code in {400, 503}
