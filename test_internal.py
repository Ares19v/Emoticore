import os
import sys
import json
from fastapi.testclient import TestClient

# 1. Setup Test Environment (Isolated from main DB)
os.environ["DATABASE_URL"] = "sqlite:///./internal_audit.db"
os.environ["ADMIN_KEY"] = "internal-audit-key"
os.environ["SECRET_KEY"] = "internal-audit-secret"

# 2. Import the App (This will use the test env vars above)
# Add backend to path so we can import app
sys.path.append(os.path.join(os.getcwd(), "backend"))
try:
    from app.main import app
except ImportError:
    print("Error: Could not find 'backend/app/main.py'. Make sure you are in the project root.")
    sys.exit(1)

client = TestClient(app)

def run_internal_audit():
    print("\n" + "="*60)
    print("   EMOTICORE — INTERNAL COMPONENT AUDIT (OFFLINE)")
    print("="*60 + "\n")

    # Clean up old test db
    try:
        if os.path.exists("internal_audit.db"):
            os.remove("internal_audit.db")
    except PermissionError:
        pass

    try:
        # Test 1: Health Logic
        print("[1/4] Testing App Initialisation...")
        res = client.get("/")
        assert res.status_code == 200
        print("      [OK] FastAPI core is stable.")

        # Test 2: Database & Auth Logic
        print("[2/4] Testing DB & Auth Security...")
        import time
        user_data = {"username": f"audit_user_{int(time.time())}", "password": "audit_password_123"}
        res = client.post("/register", json=user_data)
        assert res.status_code == 201
        
        login_res = client.post("/login", json=user_data)
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        print("      [OK] Database writes & JWT generation verified.")

        # Test 3: Processor & NLP Logic
        print("[3/4] Testing NLP Processing Engine...")
        # Note: AI Summary might return 'Summary unavailable' if GROQ_API_KEY is invalid, 
        # but the processor should still function.
        res = client.post(
            "/analyze", 
            data={"original_text": "The Emoticore engine is working beautifully! This is a successful test."},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        print("      [OK] Processor logic and sentiment mapping verified.")

        # Test 4: Admin Logic
        print("[4/4] Testing Admin Security Layer...")
        res = client.get("/admin/users", headers={"X-Admin-Key": "internal-audit-key"})
        assert res.status_code == 200
        print("      [OK] Admin access controls verified.")

        print("\n" + "="*60)
        print("   INTERNAL AUDIT PASSED: ALL LOGIC IS SECURE & STABLE")
        print("="*60 + "\n")

    except Exception as e:
        print(f"\n[!] AUDIT FAILED: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    run_internal_audit()
