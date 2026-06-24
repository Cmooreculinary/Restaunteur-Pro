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
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f5d060" />
        <stop offset="100%" stopColor="#c9922a" />
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

  const handleOAuthLogin = () => {
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  if (view === "login" || view === "register") {
    return (
      <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center px-4">
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
                className="w-full bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030] font-semibold"
              >
                {loading ? "Please wait..." : view === "login" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-zinc-500 text-sm">
                {view === "login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => { setView(view === "login" ? "register" : "login"); setErrors({}); }}
                  className="text-[#d4af37] hover:underline"
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
      <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <KeyRound className="w-8 h-8 text-[#d4af37] mx-auto mb-2" />
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
              <Button type="submit" disabled={loading} className="w-full bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030] font-semibold">
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
    <div className="min-h-screen bg-[#0f0f10] overflow-hidden">
      <div className="relative">
        <div className="absolute inset-0 hero-gradient" />
        <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#d4af37] flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-zinc-900" />
            </div>
            <span className="text-xl font-heading font-bold text-zinc-100">Restaurateur Pro</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setView("login")}
              className="text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800"
            >
              Sign In
            </Button>
            <Button
              onClick={() => setView("register")}
              className="bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030] font-medium"
              data-testid="nav-login-btn"
            >
              Get Started
            </Button>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
              <span className="text-sm text-[#d4af37] font-medium">AI-Powered Restaurant Management</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-zinc-100 leading-tight mb-6">
              Build or Scale Your
              <span className="block text-[#d4af37]">Business</span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-xl mb-10 leading-relaxed">
              From concept to multi-unit expansion. The complete platform for restaurateurs
              to plan, build, launch, and grow successful restaurant ventures.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                data-testid="hero-get-started-btn"
                onClick={() => setView("register")}
                className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-medium px-8 py-6 text-lg group"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                data-testid="hero-demo-btn"
                variant="outline"
                onClick={() => setView("secret")}
                className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 font-medium px-8 py-6 text-lg"
              >
                Demo Access
              </Button>
            </div>
          </div>
        </div>
      </div>

      <section className="relative py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-zinc-100 mb-4">
              Seven Powerful Modules
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Everything you need to take your restaurant from idea to thriving business
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <div
                key={module.name}
                data-testid={`module-card-${index}`}
                className="group p-6 rounded-xl bg-[#18181b] border border-zinc-800/50 hover:border-zinc-700/50 cursor-pointer transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center mb-4 group-hover:bg-[#d4af37]/10 transition-colors">
                  <module.icon className="w-6 h-6 text-zinc-400 group-hover:text-[#d4af37] transition-colors" />
                </div>
                <h3 className="text-lg font-heading font-semibold text-zinc-100 mb-2">{module.name}</h3>
                <p className="text-sm text-zinc-500">{module.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-8 border-t border-zinc-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "500+", label: "Restaurants Launched" },
              { value: "$2.4B", label: "Revenue Generated" },
              { value: "98%", label: "Success Rate" },
              { value: "24/7", label: "AI Support" },
            ].map((stat, index) => (
              <div key={index} className="text-center" data-testid={`stat-${index}`}>
                <div className="text-4xl md:text-5xl font-heading font-bold text-zinc-100 mb-2">{stat.value}</div>
                <div className="text-sm text-zinc-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-zinc-100 mb-6">
            Ready to Build Your Restaurant?
          </h2>
          <p className="text-zinc-400 mb-10 max-w-xl mx-auto">
            Join thousands of restaurateurs who trust Restaurateur Pro to bring their culinary visions to life.
          </p>
          <Button
            data-testid="cta-get-started-btn"
            onClick={() => setView("register")}
            className="bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030] font-semibold px-10 py-6 text-lg"
          >
            Start Your Journey
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      <footer className="py-8 px-8 border-t border-zinc-800/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-[#d4af37]" />
            <span className="text-sm text-zinc-500">Restaurateur Pro</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/pricing" className="text-xs text-zinc-600 hover:text-zinc-400">Pricing</a>
            <a href="/donate" className="text-xs text-zinc-600 hover:text-[#d4af37]">Support Us ♥</a>
            <p className="text-xs text-zinc-600">© 2026 Restaurateur Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
