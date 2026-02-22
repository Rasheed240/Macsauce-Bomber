import requests
import time

def test_health_endpoint():
    url = "http://localhost:8000/health"
    print(f"Testing {url}...")
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.json()}")
        if response.status_code == 200 and response.json().get("status") == "healthy":
            print("Verification SUCCESS: /health endpoint is working and hitting the DB.")
        else:
            print("Verification FAILED: Unexpected response.")
    except Exception as e:
        print(f"Verification FAILED: Could not connect to backend. {e}")

if __name__ == "__main__":
    # Wait for server to start if needed (manual run)
    test_health_endpoint()
