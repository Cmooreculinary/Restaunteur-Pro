import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  ChefHat, Heart, ArrowLeft, CheckCircle, Sparkles, Coffee, Star, Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PRESET_AMOUNTS = [
  { value: 5, label: "$5", icon: Coffee, desc: "Buy us a coffee" },
  { value: 15, label: "$15", icon: Heart, desc: "Show some love" },
  { value: 25, label: "$25", icon: Star, desc: "Champion supporter" },
  { value: 50, label: "$50", icon: Crown, desc: "Community hero" },
];

const Donations = ({ user }) => {
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState(user?.name || "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const finalAmount = selectedAmount || parseFloat(customAmount);

  const handleDonate = async () => {
    if (!finalAmount || finalAmount < 1) {
      toast.error("Please enter an amount of at least $1");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/donations/checkout`, {
        amount: finalAmount,
        donor_name: name || "Anonymous",
        message: message || "",
        origin_url: window.location.origin,
      });
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f10]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#d4af37] flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-zinc-900" />
          </div>
          <span className="font-bold text-zinc-100">Restaurateur Pro</span>
        </Link>
        <Link to={user ? "/dashboard" : "/"}>
          <Button variant="ghost" className="text-zinc-400 hover:text-zinc-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {user ? "Dashboard" : "Back"}
          </Button>
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-[#d4af37]" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-100 mb-3">Support the Community</h1>
          <p className="text-zinc-400 max-w-md mx-auto leading-relaxed">
            Restaurateur Pro is built for dreamers and doers in the restaurant industry.
            Your support helps keep the platform running and growing for everyone.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-8">

          {/* Preset amounts */}
          <div>
            <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 block">
              Choose an amount
            </label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {PRESET_AMOUNTS.map((preset) => {
                const Icon = preset.icon;
                const active = selectedAmount === preset.value && !customAmount;
                return (
                  <button
                    key={preset.value}
                    onClick={() => { setSelectedAmount(preset.value); setCustomAmount(""); }}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                      active
                        ? "border-[#d4af37] bg-[#d4af37]/5"
                        : "border-zinc-800 hover:border-zinc-700 bg-zinc-800/30"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${active ? "bg-[#d4af37]/20" : "bg-zinc-800"}`}>
                      <Icon className={`w-4 h-4 ${active ? "text-[#d4af37]" : "text-zinc-500"}`} />
                    </div>
                    <div>
                      <span className={`text-lg font-bold block ${active ? "text-[#d4af37]" : "text-zinc-100"}`}>
                        {preset.label}
                      </span>
                      <span className="text-xs text-zinc-500">{preset.desc}</span>
                    </div>
                    {active && <CheckCircle className="w-4 h-4 text-[#d4af37] ml-auto" />}
                  </button>
                );
              })}
            </div>

            {/* Custom amount */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">$</span>
              <Input
                type="number"
                min="1"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                className="pl-7 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* Donor info */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider block">
              Your info (optional)
            </label>
            <Input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
            />
            <textarea
              placeholder="Leave a message for the team... (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm resize-none focus:outline-none focus:border-zinc-600"
            />
          </div>

          {/* Donate button */}
          <Button
            onClick={handleDonate}
            disabled={!finalAmount || finalAmount < 1 || loading}
            className="w-full bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030] font-semibold py-6 text-lg"
          >
            {loading ? (
              "Redirecting to payment..."
            ) : finalAmount && finalAmount >= 1 ? (
              <>
                <Heart className="w-5 h-5 mr-2" />
                Donate ${finalAmount.toFixed ? finalAmount.toFixed(2) : finalAmount}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Select an Amount
              </>
            )}
          </Button>

          <p className="text-center text-xs text-zinc-600">
            Powered by Stripe · Secure payment · One-time charge · No account required
          </p>
        </div>

        {/* Impact section */}
        <div className="mt-10 grid grid-cols-3 gap-4">
          {[
            { icon: Coffee, label: "$5", desc: "Keeps the lights on" },
            { icon: Star, label: "$25", desc: "Funds new features" },
            { icon: Crown, label: "$50", desc: "Sponsors a restaurateur" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="text-center p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <Icon className="w-5 h-5 text-[#d4af37] mx-auto mb-2" />
                <p className="text-sm font-bold text-zinc-100">{item.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Donations;
