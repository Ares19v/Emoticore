"""
test_api.py — EMOTICORE Backend API Test Suite

Tests every route for correct behaviour, auth enforcement, and edge cases.
Run with: pytest tests/ -v  (from the backend/ directory)
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def registered_user():
    """Register a fresh test user and return its credentials."""
    creds = {"username": "pytest_runner", "password": "secure_pass_99"}
    res = client.post("/register", json=creds)
    assert res.status_code == 201, f"Registration failed: {res.json()}"
    return creds


@pytest.fixture(scope="module")
def token(registered_user):
    """Log in and return a valid JWT access token."""
    res = client.post("/login", json=registered_user)
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.fixture(scope="module")
def user_id(registered_user):
    """Return the DB id of the registered test user."""
    res = client.post("/login", json=registered_user)
    return res.json()["user_id"]


@pytest.fixture(scope="module")
def auth(token):
    """Convenience fixture: Authorization header dict."""
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

class TestHealth:
    def test_root_returns_online(self):
        res = client.get("/")
        assert res.status_code == 200
        assert res.json()["status"] == "Online"
        assert "version" in res.json()


# ---------------------------------------------------------------------------
# Auth — Register
# ---------------------------------------------------------------------------

class TestRegister:
    def test_register_success(self):
        res = client.post("/register", json={"username": "unique_user_42", "password": "validpass"})
        assert res.status_code == 201
        assert res.json()["username"] == "unique_user_42"

    def test_register_duplicate_fails(self, registered_user):
        res = client.post("/register", json=registered_user)
        assert res.status_code == 400

    def test_register_username_too_short(self):
        res = client.post("/register", json={"username": "ab", "password": "validpass"})
        assert res.status_code == 422

    def test_register_password_too_short(self):
        res = client.post("/register", json={"username": "validuser99", "password": "123"})
        assert res.status_code == 422


# ---------------------------------------------------------------------------
# Auth — Login
# ---------------------------------------------------------------------------

class TestLogin:
    def test_login_returns_token(self, registered_user):
        res = client.post("/login", json=registered_user)
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user_id" in data
        assert "username" in data

    def test_login_wrong_password(self, registered_user):
        res = client.post("/login", json={
            "username": registered_user["username"],
            "password": "definitely_wrong"
        })
        assert res.status_code == 401

    def test_login_nonexistent_user(self):
        res = client.post("/login", json={"username": "ghost_999", "password": "anything"})
        assert res.status_code == 401


# ---------------------------------------------------------------------------
# Analysis
# ---------------------------------------------------------------------------

class TestAnalyze:
    def test_analyze_public_access(self):
        res = client.post(
            "/analyze",
            data={"original_text": "This is a wonderful sentence for testing public NLP analysis pipelines."},
        )
        assert res.status_code == 200
        assert res.json()["status"] == "Complete"
        assert res.json()["count"] == 1

    def test_analyze_empty_input_rejected(self):
        res = client.post("/analyze", data={})
        assert res.status_code == 400


# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------

class TestHistory:
    def test_history_public_access(self):
        res = client.get("/history")
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_history_pagination(self):
        res = client.get("/history?limit=1&skip=0")
        assert res.status_code == 200
        assert len(res.json()) <= 1

    def test_export_csv(self):
        res = client.get("/history/export")
        assert res.status_code == 200
        assert "text/csv" in res.headers["content-type"]


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------

class TestAdmin:
    def test_admin_no_key_rejected(self):
        res = client.get("/admin/users")
        assert res.status_code == 403

    def test_admin_wrong_key_rejected(self):
        res = client.get("/admin/users", headers={"X-Admin-Key": "bad-key"})
        assert res.status_code == 403

    def test_admin_correct_key_succeeds(self):
        import os
        key = os.environ.get("ADMIN_KEY", "ci-test-admin-key")
        res = client.get("/admin/users", headers={"X-Admin-Key": key})
        assert res.status_code == 200
        assert isinstance(res.json(), list)
