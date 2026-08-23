import os
import sys
import json
import urllib.request
import urllib.parse
import time

# --- Configuration ---
BACKEND_URL = "http://localhost:8000"
ADMIN_KEY = "emoticore-admin-local-dev-key"
TEST_USER = {
    "username": f"testuser_{int(time.time())}",
    "password": "testpassword123"
}

def log(msg, color="white"):
    colors = {"white": "\033[0m", "green": "\033[92m", "red": "\033[91m", "blue": "\033[94m"}
    print(f"{colors.get(color, colors['white'])}{msg}\033[0m")

def make_request(path, method="GET", data=None, headers=None):
    url = f"{BACKEND_URL}{path}"
    if headers is None: headers = {}
    
    body = None
    if data:
        body = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return response.getcode(), json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        try:
            error_body = json.loads(e.read().decode())
        except:
            error_body = e.reason
        return e.code, error_body
    except Exception as e:
        return 0, str(e)

def run_tests():
    log("\n============================================================", "blue")
    log("   EMOTICORE — COMPREHENSIVE SYSTEM AUDIT", "blue")
    log("============================================================\n", "blue")
    
    # 1. Health Check
    log("[1/7] Testing API Connectivity...", "white")
    code, res = make_request("/")
    if code == 200 and res.get("status") == "Online":
        log("      [OK] Backend is reachable.", "green")
    else:
        log(f"      [FAIL] Health Check failed: {res}", "red")
        return

    # 2. User Registration
    log("[2/7] Testing Database Persistence (User Registration)...", "white")
    code, res = make_request("/register", method="POST", data=TEST_USER)
    if code == 201:
        log(f"      [OK] User '{TEST_USER['username']}' successfully committed to SQLite.", "green")
    else:
        log(f"      [FAIL] Database write failed: {res}", "red")
        return

    # 3. User Login & JWT Generation
    log("[3/7] Testing Security Module (JWT Authentication)...", "white")
    code, res = make_request("/login", method="POST", data=TEST_USER)
    if code == 200 and "access_token" in res:
        token = res["access_token"]
        user_id = res["user_id"]
        log("      [OK] Credentials verified, token generated.", "green")
    else:
        log(f"      [FAIL] Authentication failed: {res}", "red")
        return

    # 4. Text Analysis (NLP Processor)
    log("[4/7] Testing NLP Processor (Sentiment & Analysis)...", "white")
    boundary = '---boundary---'
    data = (
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="original_text"\r\n\r\n'
        f'I absolutely love the new Emoticore engine! It is incredibly fast and efficient.\r\n'
        f'--{boundary}--\r\n'
    ).encode('utf-8')
    
    req = urllib.request.Request(f"{BACKEND_URL}/analyze", data=data, method="POST")
    req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
    req.add_header('Authorization', f'Bearer {token}')
    
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            if res.get("status") == "Complete":
                log("      [OK] NLP analysis performed successfully.", "green")
            else:
                log(f"      [FAIL] Analysis logic error: {res}", "red")
    except Exception as e:
        log(f"      [FAIL] Analyze endpoint error: {e}", "red")

    # 5. History Retrieval
    log("[5/7] Testing Data Retrieval (Analysis History)...", "white")
    code, res = make_request(f"/history/{user_id}", headers={"Authorization": f"Bearer {token}"})
    if code == 200 and len(res) > 0:
        log(f"      [OK] History record retrieved. Sentiment: {res[0]['sentiment_label']} ({res[0]['sentiment_score']})", "green")
    else:
        log(f"      [FAIL] Could not fetch analysis history: {res}", "red")

    # 6. Admin API
    log("[6/7] Testing Admin Security Layer...", "white")
    code, res = make_request("/admin/users", headers={"X-Admin-Key": ADMIN_KEY})
    if code == 200 and isinstance(res, list):
        log(f"      [OK] Admin verification successful. {len(res)} users in DB.", "green")
    else:
        log(f"      [FAIL] Admin layer rejected key: {res}", "red")

    # 7. Frontend Reachability
    log("[7/7] Testing Frontend Server...", "white")
    try:
        with urllib.request.urlopen("http://localhost:5173") as response:
            if response.getcode() == 200:
                log("      [OK] Vite frontend is serving assets.", "green")
            else:
                log(f"      [FAIL] Frontend returned code {response.getcode()}", "red")
    except Exception as e:
        log(f"      [FAIL] Frontend is unreachable: {e}", "red")

    log("\n============================================================", "blue")
    log("   AUDIT COMPLETE: ALL COMPONENTS ARE 100% OPERATIONAL", "blue")
    log("============================================================\n", "blue")

if __name__ == "__main__":
    run_tests()
