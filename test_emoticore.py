import urllib.request
import time
import sys

def check_url(url, retries=15, delay=2):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                if response.status == 200:
                    return True
        except Exception as e:
            time.sleep(delay)
    return False

if __name__ == "__main__":
    print("Testing Backend (http://localhost:8000/)...")
    if check_url("http://localhost:8000/"):
        print("Backend is RUNNING.")
    else:
        print("Backend failed to start or is not responding.")
        sys.exit(1)

    print("Testing Frontend (http://localhost:5173/)...")
    if check_url("http://localhost:5173/"):
        print("Frontend is RUNNING.")
    else:
        print("Frontend failed to start or is not responding. (Note: Vite might run on a different port like 5174 if 5173 is taken, but assuming 5173)")
        sys.exit(1)

    print("\n--- TEST PASSED: All components are functioning properly! ---")
    sys.exit(0)
