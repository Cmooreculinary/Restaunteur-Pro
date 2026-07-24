import requests
import json
import os

def test_simple():
    base_url = os.environ.get("RESTAURATEUR_PRO_API_URL", "http://localhost:8000/api")
    
    print("Testing basic endpoints...")
    
    # Test root
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        print(f"Root: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Root error: {e}")
    
    # Test health
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        print(f"Health: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Health error: {e}")
    
    # Test auth session
    try:
        response = requests.post(f"{base_url}/auth/session", 
                               json={"session_id": "fake"}, 
                               timeout=10)
        print(f"Auth session: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Auth session error: {e}")
    
    # Test projects (should be 401)
    try:
        response = requests.get(f"{base_url}/projects", timeout=10)
        print(f"Projects: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Projects error: {e}")
    
    # Test site demographics
    try:
        response = requests.get(f"{base_url}/site/demographics?lat=40.7128&lng=-74.0060", timeout=10)
        print(f"Demographics: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Demographics error: {e}")

if __name__ == "__main__":
    test_simple()
