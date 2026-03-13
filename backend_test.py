import requests
import sys
import json
from datetime import datetime

class RestaurateurProAPITester:
    def __init__(self, base_url="https://live-support-hub-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_result(self, test_name, success, details="", status_code=None):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
            if details:
                print(f"   {details}")
        else:
            self.failed_tests.append({
                "test": test_name,
                "details": details,
                "status_code": status_code
            })
            print(f"❌ {test_name} - FAILED")
            if details:
                print(f"   {details}")
        print()

    def make_request(self, method, endpoint, data=None, params=None, timeout=10):
        """Make HTTP request"""
        url = f"{self.base_url}/{endpoint}" if endpoint else self.base_url
        headers = {'Content-Type': 'application/json'}
            
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)
                
            return response
        except Exception as e:
            print(f"Request error for {method} {url}: {str(e)}")
            return None

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        # Test root endpoint
        response = self.make_request('GET', '')
        success = response and response.status_code == 200
        details = f"Status: {response.status_code if response else 'No response'}"
        if success and response.json():
            details += f", Message: {response.json().get('message', 'N/A')}"
        self.log_result("Root endpoint", success, details, response.status_code if response else None)
        
        # Test health endpoint  
        response = self.make_request('GET', 'health')
        success = response and response.status_code == 200
        details = f"Status: {response.status_code if response else 'No response'}"
        if success and response.json():
            details += f", Status: {response.json().get('status', 'N/A')}"
        self.log_result("Health endpoint", success, details, response.status_code if response else None)

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        # Test auth session endpoint
        test_data = {"session_id": "fake_session_id_for_testing"}
        response = self.make_request('POST', 'auth/session', test_data)
        
        if response and response.status_code == 401:
            try:
                error_detail = response.json().get('detail', 'Unknown error')
                success = "Invalid session_id" in error_detail
                details = f"Correctly rejects invalid session_id: {error_detail}"
            except:
                success = True
                details = "Properly rejects invalid session_id"
        else:
            success = False
            details = f"Status: {response.status_code if response else 'No response'}"
            
        self.log_result("Auth session endpoint", success, details, response.status_code if response else None)
        
        # Test auth/me endpoint (should require auth)
        response = self.make_request('GET', 'auth/me')
        success = response and response.status_code == 401
        details = "Properly requires authentication" if success else f"Status: {response.status_code if response else 'No response'}"
        self.log_result("Auth /me endpoint", success, details, response.status_code if response else None)

    def test_protected_endpoints(self):
        """Test that protected endpoints require authentication"""
        endpoints_to_test = [
            ("projects", "GET"),
            ("tasks", "GET", {"project_id": "test_project"}),
            ("team", "GET", {"project_id": "test_project"}),
            ("budget", "GET", {"project_id": "test_project"}),
            ("equipment", "GET", {"project_id": "test_project"}),
            ("permits", "GET", {"project_id": "test_project"}),
            ("candidates", "GET", {"project_id": "test_project"}),
            ("vendors", "GET", {"project_id": "test_project"}),
            ("menu-items", "GET", {"project_id": "test_project"}),
            ("lease-clauses", "GET", {"project_id": "test_project"}),
            ("units", "GET"),
            ("notifications", "GET")
        ]
        
        for endpoint_info in endpoints_to_test:
            endpoint = endpoint_info[0] 
            method = endpoint_info[1]
            params = endpoint_info[2] if len(endpoint_info) > 2 else None
            
            response = self.make_request(method, endpoint, params=params)
            success = response and response.status_code == 401
            details = "Properly protected by authentication" if success else f"Status: {response.status_code if response else 'No response'}"
            self.log_result(f"{endpoint.replace('-', ' ').title()} endpoint protection", success, details, response.status_code if response else None)

    def test_ai_endpoints(self):
        """Test AI endpoints require authentication"""
        # Test AI analysis endpoint
        analysis_data = {
            "project_id": "test_project",
            "analysis_type": "lease", 
            "content": "Test lease content for analysis"
        }
        response = self.make_request('POST', 'ai/analyze', analysis_data)
        success = response and response.status_code == 401
        details = "Properly requires authentication" if success else f"Status: {response.status_code if response else 'No response'}"
        self.log_result("AI Analysis endpoint protection", success, details, response.status_code if response else None)
        
        # Test cost calculator endpoint
        cost_data = {
            "ingredients": "Test ingredients list", 
            "servings": 4
        }
        response = self.make_request('POST', 'ai/cost-calculator', cost_data)
        success = response and response.status_code == 401
        details = "Properly requires authentication" if success else f"Status: {response.status_code if response else 'No response'}"
        self.log_result("AI Cost Calculator endpoint protection", success, details, response.status_code if response else None)

    def test_public_endpoints(self):
        """Test public endpoints that don't require authentication"""
        # Test site demographics endpoint
        response = self.make_request('GET', 'site/demographics', params={"lat": 40.7128, "lng": -74.0060})
        success = response and response.status_code == 200
        details = f"Status: {response.status_code if response else 'No response'}"
        if success:
            try:
                data = response.json()
                if 'foot_traffic' in data and 'income' in data:
                    details += ", Returns live demographic data"
                else:
                    success = False
                    details += ", Missing expected data fields"
            except:
                success = False
                details += ", Invalid JSON response"
        self.log_result("Site Demographics endpoint", success, details, response.status_code if response else None)

    def run_all_tests(self):
        """Run comprehensive API tests"""
        print("🚀 Starting Restaurateur Pro API Tests")
        print("=" * 50)
        
        # Test basic endpoints
        self.test_health_endpoints()
        
        # Test auth system
        self.test_auth_endpoints()
        
        # Test protected endpoints properly require authentication  
        self.test_protected_endpoints()
        
        # Test AI endpoints
        self.test_ai_endpoints()
        
        # Test public endpoints
        self.test_public_endpoints()
        
        # Print summary
        print("=" * 50)
        print(f"📊 Test Summary")
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%" if self.tests_run > 0 else "No tests run")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        else:
            print("\n🎉 All backend API tests passed!")
        
        return len(self.failed_tests) == 0

def main():
    tester = RestaurateurProAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())

def main():
    tester = RestaurateurProAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())