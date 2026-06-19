import { ChefHat, LayoutDashboard, Map, Hammer, Rocket, TrendingUp, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Landing = () => {
  const handleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    const authBase = process.env.REACT_APP_OAUTH_URL || 'https://auth.emergentagent.com';
    window.location.href = `${authBase}/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const modules = [
    { icon: LayoutDashboard, name: "Command Center", desc: "Construction dashboard & project tracking" },
    { icon: Map, name: "Site Strategist", desc: "Location analysis & demographics" },
    { icon: Hammer, name: "Ground Up", desc: "Floor plans & permit compliance" },
    { icon: Rocket, name: "Ops Launchpad", desc: "Hiring, menu & supply chain" },
    { icon: TrendingUp, name: "Expansion Toolkit", desc: "Multi-unit growth & franchise" },
    { icon: FileText, name: "Lease Negotiation", desc: "Contract analysis & tracking" },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f10] overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 hero-gradient" />
        
        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#d4af37] flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-zinc-900" />
            </div>
            <span className="text-xl font-heading font-bold text-zinc-100">Restaurateur Pro</span>
          </div>
          <Button 
            data-testid="nav-login-btn"
            onClick={handleLogin}
            className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-medium"
          >
            Sign In with Google
          </Button>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse-glow" />
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
                onClick={handleLogin}
                className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-medium px-8 py-6 text-lg group"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                data-testid="hero-demo-btn"
                variant="outline"
                className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 font-medium px-8 py-6 text-lg"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Section */}
      <section className="relative py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-zinc-100 mb-4">
              Six Powerful Modules
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
                className="group p-6 rounded-xl bg-[#18181b] border border-zinc-800/50 hover:border-zinc-700/50 hover-lift cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
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

      {/* Stats Section */}
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
                <div className="text-4xl md:text-5xl font-heading font-bold text-zinc-100 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-zinc-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-zinc-100 mb-6">
            Ready to Build Your Restaurant?
          </h2>
          <p className="text-zinc-400 mb-10 max-w-xl mx-auto">
            Join thousands of restaurateurs who trust Restaurateur Pro to 
            bring their culinary visions to life.
          </p>
          <Button 
            data-testid="cta-get-started-btn"
            onClick={handleLogin}
            className="bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030] font-semibold px-10 py-6 text-lg"
          >
            Start Your Journey
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-zinc-800/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-[#d4af37]" />
            <span className="text-sm text-zinc-500">Restaurateur Pro</span>
          </div>
          <p className="text-xs text-zinc-600">
            © 2026 Restaurateur Pro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
