import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";

// Pages
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Onboarding from "@/pages/Onboarding";
import Pricing from "@/pages/Pricing";
import SubscriptionSuccess from "@/pages/SubscriptionSuccess";
import Donations from "@/pages/Donations";
import DonationSuccess from "@/pages/DonationSuccess";

const TOKEN_KEY = "restaurateur-pro-access-token";

const normalizeBackendUrl = (value) => {
  const candidate = (value || "http://localhost:8000").trim().replace(/\/$/, "");
  if (/^https?:\/\//i.test(candidate)) return candidate;
  return `https://${candidate}`;
};

const BACKEND_URL = normalizeBackendUrl(process.env.REACT_APP_BACKEND_URL);
const API = `${BACKEND_URL}/api`;

export const getAccessToken = () => {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAccessToken = (token) => {
  try {
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
    else window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage may be unavailable in hardened/private browser contexts.
  }
};

const captureOAuthToken = () => {
  const hash = window.location.hash?.replace(/^#/, "");
  if (!hash) return null;
  const token = new URLSearchParams(hash).get("access_token");
  if (!token) return null;
  setAccessToken(token);
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  return token;
};

axios.defaults.withCredentials = true;
axios.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
axios.interceptors.response.use(
  (response) => {
    const returnedToken = response.data?.access_token;
    if (returnedToken) setAccessToken(returnedToken);
    if (response.config?.url?.includes("/auth/logout")) setAccessToken(null);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) setAccessToken(null);
    return Promise.reject(error);
  }
);

// Auth Context
export const AuthContext = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    captureOAuthToken();
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return children({ user, setUser, checkAuth });
};

// Protected route wrapper
const ProtectedRoute = ({ user, onboardingRequired = true, children }) => {
  if (!user) return <Navigate to="/" replace />;
  if (onboardingRequired && !user.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
};

function AppRouter() {
  useLocation();

  return (
    <AuthContext>
      {({ user, setUser }) => (
        <Routes>
          <Route
            path="/"
            element={
              user
                ? user.onboarding_completed
                  ? <Navigate to="/dashboard" replace />
                  : <Navigate to="/onboarding" replace />
                : <Landing setUser={setUser} />
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user}>
                <Dashboard user={user} setUser={setUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              user
                ? <Onboarding user={user} setUser={setUser} />
                : <Navigate to="/" replace />
            }
          />
          <Route path="/pricing" element={<Pricing user={user} />} />
          <Route path="/subscription/success" element={<SubscriptionSuccess />} />
          <Route path="/donate" element={<Donations user={user} />} />
          <Route path="/donation/success" element={<DonationSuccess />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </AuthContext>
  );
}

function App() {
  return (
    <div className="grain-overlay">
      <BrowserRouter>
        <AppRouter />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </div>
  );
}

export default App;
