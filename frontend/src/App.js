import { useState, useEffect, useCallback, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// Pages
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Onboarding from "@/pages/Onboarding";
import Pricing from "@/pages/Pricing";
import SubscriptionSuccess from "@/pages/SubscriptionSuccess";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;

// Auth Context
export const AuthContext = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

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

// OAuth Callback Component
const AuthCallback = ({ setUser }) => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      if (!sessionIdMatch) { navigate('/'); return; }

      try {
        const response = await axios.post(`${API}/auth/session`, { session_id: sessionIdMatch[1] });
        setUser(response.data);
        toast.success(`Welcome, ${response.data.name}!`);
        window.history.replaceState(null, '', window.location.pathname);
        if (response.data.onboarding_completed) {
          navigate('/dashboard');
        } else {
          navigate('/onboarding');
        }
      } catch {
        toast.error('Authentication failed. Please try again.');
        navigate('/');
      }
    };
    processAuth();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Authenticating...</p>
      </div>
    </div>
  );
};

// Protected route wrapper
const ProtectedRoute = ({ user, onboardingRequired = true, children }) => {
  if (!user) return <Navigate to="/" replace />;
  if (onboardingRequired && !user.onboarding_completed) return <Navigate to="/onboarding" replace />;
  return children;
};

function AppRouter() {
  const location = useLocation();

  if (location.hash?.includes('session_id=')) {
    return (
      <AuthContext>
        {({ setUser }) => <AuthCallback setUser={setUser} />}
      </AuthContext>
    );
  }

  return (
    <AuthContext>
      {({ user, setUser, checkAuth }) => (
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
