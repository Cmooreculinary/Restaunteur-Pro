import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  ChefHat, LayoutDashboard, Map, Hammer, Rocket, TrendingUp, FileText,
  Megaphone, ArrowRight, Mail, Lock, Eye, EyeOff, User, KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GoldenDomeLogo = () => (
  <svg aria-hidden="true" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="var(--color-accent-hover)" />
        <stop offset="100%" stopColor="var(--color-accent)" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="22" fill="url(#goldGrad)" opacity="0.15" />
    <path d="M24 6 C14 6 8 14 8 22 L40 22 C40 14 34 6 24 6Z" fill="url(#goldGrad)" />
    <rect x="6" y="22" width="36" height="4" rx="2" fill="url(#goldGrad)" />
    <rect x="10" y="28" width="28" height="3" rx="1.5" fill="url(#goldGrad)" opacity="0.8" />
    <rect x="14" y="33" width="20" height="3" rx="1.5" fill="url(#goldGrad)" opacity="0.6" />
  </svg>
);

const Landing = ({ setUser }) => {
  const navigate = useNavigate();
  const [view, setView] = useState("home"); // home | login | register | secret
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [secretCode, setSecretCode] = useState("");
  const [errors, setErrors] = useState({});

  const modules = [
    { icon: LayoutDashboard, name: "Command Center", desc: "Construction dashboard & project tracking" },
    { icon: Map, name: "Site Strategist", desc: "Location analysis & demographics" },
    { icon: Hammer, name: "Ground Up", desc: "Floor plans & permit compliance" },
    { icon: Rocket, name: "Ops Launchpad", desc: "Hiring, menu & supply chain" },
    { icon: TrendingUp, name: "Expansion Toolkit", desc: "Multi-unit growth & franchise" },
    { icon: FileText, name: "Lease Negotiation", desc: "Contract analysis & tracking" },
    { icon: Megaphone, name: "Marketeer Agent", desc: "AI-powered marketing content & campaigns" },
  ];

  const validate = () => {
    const errs = {};
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = "Valid email required";
    if (!form.password || form.password.length < 6) errs.password = "Password must be at least 6 characters";
    if (view === "register" && !form.name) errs.name = "Name required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const endpoint = view === "login" ? "/auth/login" : "/auth/register";
      const payload = view === "register"
        ? { email: form.email, password: form.password, name: form.name }
        : { email: form.email, password: form.password };
      const res = await axios.post(`${API}${endpoint}`, payload);
      setUser(res.data);
      toast.success(`Welcome${res.data.name ? `, ${res.data.name}` : ""}!`);
      if (res.data.onboarding_completed) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSecretLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/secret`, { code: secretCode });
      setUser(res.data);
      toast.success("Admin access granted!");
      navigate("/dashboard");
    } catch {
      toast.error("Invalid access code");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/auth/google/init`);
      const { auth_url } = res.data;
      if (auth_url) {
        window.location.href = auth_url;
      } else {
        toast.error("Failed to initialize OAuth");
      }
    } catch (err) {
      toast.error("OAuth initialization failed");
      setLoading(false);
    }
  };

  if (view === "login" || view === "register") {
    return (
      <div className="auth-page min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <GoldenDomeLogo />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100">Restaurateur PRO</h1>
            <p className="text-zinc-500 mt-1 text-sm">
              {view === "login" ? "Sign in to your account" : "Create your account"}
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <form onSubmit={handleAuth} className="space-y-4">
              {view === "register" && (
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      placeholder="Gordon Ramsay"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="pl-9 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                    />
                  </div>
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>
              )}

              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    type="email"
                    placeholder="you@restaurant.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="pl-9 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="pl-9 pr-9 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gold text-zinc-900 hover:bg-fire-hover font-semibold"
              >
                {loading ? "Please wait..." : view === "login" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-zinc-500 text-sm">
                {view === "login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => { setView(view === "login" ? "register" : "login"); setErrors({}); }}
                  className="text-gold hover:underline"
                >
                  {view === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>

            <div className="mt-4 border-t border-zinc-800 pt-4 flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={handleOAuthLogin}
                className="w-full bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm"
              >
                Continue with Google
              </Button>
              <button
                onClick={() => setView("secret")}
                className="text-xs text-zinc-600 hover:text-zinc-500 text-center mt-1"
              >
                Admin access
              </button>
            </div>
          </div>

          <button onClick={() => setView("home")} className="mt-4 text-zinc-600 hover:text-zinc-400 text-sm w-full text-center">
            ← Back to home
          </button>
        </div>
      </div>
    );
  }

  if (view === "secret") {
    return (
      <div className="auth-page min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <KeyRound className="w-8 h-8 text-gold mx-auto mb-2" />
            <h2 className="text-xl font-bold text-zinc-100">Admin Access</h2>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <form onSubmit={handleSecretLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter access code"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
              />
              <Button type="submit" disabled={loading} className="w-full bg-gold text-zinc-900 hover:bg-fire-hover font-semibold">
                {loading ? "Verifying..." : "Access Platform"}
              </Button>
            </form>
          </div>
          <button onClick={() => setView("home")} className="mt-4 text-zinc-600 hover:text-zinc-400 text-sm w-full text-center">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="marketing-shell min-h-screen bg-background">
      <div className="marketing-hero">
        <nav className="marketing-nav">
          <div className="marketing-brand">
            <span><ChefHat aria-hidden="true" /></span>
            <strong>Restaurateur Pro</strong>
          </div>
          <div className="marketing-nav-actions">
            <a href="/pricing">Pricing</a>
            <Button
              variant="ghost"
              onClick={() => setView("login")}
              className="marketing-sign-in"
            >
              Sign In
            </Button>
            <Button
              onClick={() => setView("register")}
              className="marketing-primary"
              data-testid="nav-login-btn"
            >
              Get Started
            </Button>
          </div>
        </nav>

        <div className="marketing-hero-body">
          <div className="marketing-hero-copy">
            <p className="marketing-eyebrow">Restaurant development + operations</p>
            <h1>
              Build the restaurant.
              <span>Run the work.</span>
            </h1>
            <p className="marketing-lede">
              From concept to multi-unit expansion. The complete platform for restaurateurs
              to plan, build, launch, and grow successful restaurant ventures.
            </p>
            <div className="marketing-hero-actions">
              <Button
                data-testid="hero-get-started-btn"
                onClick={() => setView("register")}
                className="marketing-primary"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                data-testid="hero-demo-btn"
                variant="outline"
                onClick={() => setView("secret")}
                className="marketing-secondary"
              >
                Demo Access
              </Button>
            </div>
          </div>
          <div className="marketing-hero-index" aria-label="Platform scope">
            <span>01</span><p>Plan</p>
            <span>02</span><p>Build</p>
            <span>03</span><p>Launch</p>
            <span>04</span><p>Operate</p>
          </div>
        </div>
      </div>

      <section className="marketing-modules">
        <div className="marketing-section-head">
          <div>
            <p className="marketing-eyebrow">The operating system</p>
            <h2>Seven modules. One restaurant journey.</h2>
          </div>
          <p>
              Everything you need to take your restaurant from idea to thriving business
          </p>
        </div>
          <div className="marketing-module-list">
            {modules.map((module, index) => (
              <div
                key={module.name}
                data-testid={`module-card-${index}`}
                className="marketing-module"
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <module.icon aria-hidden="true" />
                <h3>{module.name}</h3>
                <p>{module.desc}</p>
                <ArrowRight aria-hidden="true" />
              </div>
            ))}
          </div>
      </section>

      <section className="marketing-cta">
          <p className="marketing-eyebrow">Your next service starts here</p>
          <h2>Ready to build your restaurant?</h2>
          <p>
            Put the concept, site, build, opening plan, and operating intelligence in one disciplined workspace.
          </p>
          <Button
            data-testid="cta-get-started-btn"
            onClick={() => setView("register")}
            className="marketing-primary"
          >
            Start Your Journey
            <ArrowRight className="w-5 h-5" />
          </Button>
      </section>

      <footer className="marketing-footer">
        <h2>Built for the people who open the doors.</h2>
        <div>
          <p>Restaurateur Pro</p>
          <nav aria-label="Footer">
            <a href="/pricing">Pricing</a>
            <a href="/donate">Support Us</a>
          </nav>
          <p>© 2026 Restaurateur Pro</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
