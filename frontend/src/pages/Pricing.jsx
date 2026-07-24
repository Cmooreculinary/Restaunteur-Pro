import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ChefHat, CheckCircle, Crown, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Pricing = ({ user }) => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const plansRes = await axios.get(`${API}/subscriptions/plans`);
        setPlans(plansRes.data.plans || []);
        if (user) {
          const subRes = await axios.get(`${API}/subscriptions/my-subscription`);
          setSubscription(subRes.data);
        }
      } catch {
        setPlans([
          { id: "single_unit", name: "Single Unit", price: 14, features: ["1 Restaurant Project", "Command Center", "Site Strategist", "Ground Up Module", "Ops Launchpad", "Marketeer Agent", "Email Support"] },
          { id: "multi_unit", name: "Multi-Unit", price: 18, features: ["Unlimited Projects", "All Single Unit Features", "Expansion Toolkit", "Lease Negotiation", "AI Analysis", "Priority Support", "Franchise Tools"] },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleCheckout = async (planId) => {
    if (!user) {
      toast.error("Please sign in to subscribe");
      navigate("/");
      return;
    }
    setCheckoutLoading(planId);
    try {
      const res = await axios.post(`${API}/subscriptions/checkout`, {
        plan_id: planId,
        origin_url: window.location.origin
      });
      window.location.href = res.data.url;
    } catch {
      toast.error("Checkout failed. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="public-page pricing-page min-h-screen bg-background">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-zinc-900" />
          </div>
          <span className="font-bold text-zinc-100">Restaurateur Pro</span>
        </Link>
        {user ? (
          <Link to="/dashboard">
            <Button variant="outline" className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Back to Dashboard
            </Button>
          </Link>
        ) : (
          <Link to="/">
            <Button variant="ghost" className="text-zinc-400 hover:text-zinc-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        )}
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-zinc-100 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Choose the plan that fits your restaurant journey. Upgrade or downgrade at any time.
          </p>
          {subscription?.status === "active" && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm">Active plan: {subscription.plan}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {plans.map((plan, i) => {
              const isPopular = i === 1;
              const isCurrent = subscription?.plan === plan.id && subscription?.status === "active";
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-6 border ${
                    isPopular
                      ? "border-gold bg-gold/5"
                      : "border-zinc-800 bg-zinc-900"
                  } relative`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 bg-gold rounded-full">
                      <Crown className="w-3.5 h-3.5 text-zinc-900" />
                      <span className="text-xs font-bold text-zinc-900">POPULAR</span>
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-zinc-100">{plan.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-zinc-100">${plan.price}</span>
                      <span className="text-zinc-500">/month</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {(plan.features || []).map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
                        <CheckCircle className="w-4 h-4 text-gold flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => !isCurrent && handleCheckout(plan.id)}
                    disabled={isCurrent || checkoutLoading === plan.id}
                    className={`w-full font-semibold ${
                      isCurrent
                        ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                        : isPopular
                        ? "bg-gold text-zinc-900 hover:bg-fire-hover"
                        : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                    }`}
                  >
                    {checkoutLoading === plan.id ? "Redirecting..." : isCurrent ? "Current Plan" : `Get ${plan.name}`}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-zinc-600 text-sm mt-8">
          Powered by Stripe. Cancel anytime. No hidden fees.
        </p>
      </div>
    </div>
  );
};

export default Pricing;
