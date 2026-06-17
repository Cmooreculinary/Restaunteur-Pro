import { useState, useEffect, useCallback, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// Pages
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Marketeer from "@/pages/Marketeer";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configure axios defaults
axios.defaults.withCredentials = true;

// Auth Context
export const AuthContext = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const checkAuth = useCallback(async () => {
    // CRITICAL: If returning from OAuth callback, skip the /me check
    // AuthCallback will exchange the session_id and establish the session first
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
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
          <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return children({ user, setUser, checkAuth });
};

// Auth Callback Component
const AuthCallback = ({ setUser }) => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use ref to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (!sessionIdMatch) {
        navigate('/');
        return;
      }

      const sessionId = sessionIdMatch[1];

      try {
        const response = await axios.post(`${API}/auth/session`, {
          session_id: sessionId
        });
        
        setUser(response.data);
        toast.success(`Welcome, ${response.data.name}!`);
        
        // Clear hash and navigate to dashboard
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/dashboard', { state: { user: response.data } });
      } catch (error) {
        console.error('Auth error:', error);
        toast.error('Authentication failed. Please try again.');
        navigate('/');
      }
    };

    processAuth();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Authenticating...</p>
      </div>
    </div>
  );
};

// App Router
function AppRouter() {
  const location = useLocation();

  // Check URL fragment for session_id synchronously during render
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
            element={user ? <Dashboard user={user} setUser={setUser} /> : <Landing />} 
          />
          <Route
            path="/dashboard"
            element={user ? <Dashboard user={user} setUser={setUser} /> : <Landing />}
          />
          <Route
            path="/marketeer"
            element={user ? <Marketeer /> : <Landing />}
          />
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
