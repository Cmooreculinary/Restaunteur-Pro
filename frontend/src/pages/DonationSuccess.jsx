import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { Heart, ChefHat, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DonationSuccess = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [amount, setAmount] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) { setStatus("error"); return; }
    const verify = async () => {
      try {
        const res = await axios.get(`${API}/donations/status/${sessionId}`);
        setStatus(res.data.payment_status === "paid" ? "success" : "pending");
        if (res.data.amount) setAmount((res.data.amount / 100).toFixed(2));
      } catch { setStatus("error"); }
    };
    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center">
            {status === "loading" ? (
              <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
            ) : status === "success" ? (
              <Heart className="w-10 h-10 text-[#d4af37]" />
            ) : (
              <CheckCircle className="w-10 h-10 text-[#d4af37]" />
            )}
          </div>
        </div>

        {status === "loading" && <p className="text-zinc-400">Confirming your donation...</p>}

        {status === "success" && (
          <>
            <h1 className="text-3xl font-bold text-zinc-100 mb-2">Thank You!</h1>
            {amount && (
              <p className="text-[#d4af37] text-xl font-semibold mb-3">${amount} donated</p>
            )}
            <p className="text-zinc-400 mb-8 leading-relaxed">
              Your generosity helps us keep Restaurateur Pro running and building tools
              that empower the next generation of restaurant owners. You're a legend.
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/dashboard">
                <Button className="w-full bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030] font-semibold">
                  Back to Dashboard
                </Button>
              </Link>
              <Link to="/donate">
                <Button variant="ghost" className="w-full text-zinc-500 hover:text-zinc-300">
                  Donate again
                </Button>
              </Link>
            </div>
          </>
        )}

        {status === "pending" && (
          <>
            <h1 className="text-2xl font-bold text-zinc-100 mb-2">Almost there!</h1>
            <p className="text-zinc-400 mb-6">Your payment is processing — thank you so much.</p>
            <Link to="/"><Button className="bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030]">Go Home</Button></Link>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-bold text-zinc-100 mb-2">Something went wrong</h1>
            <p className="text-zinc-400 mb-6">We couldn't confirm your donation. Contact support if you were charged.</p>
            <Link to="/donate"><Button variant="outline" className="border-zinc-700 text-zinc-300">Try Again</Button></Link>
          </>
        )}

        <div className="mt-8 flex items-center justify-center gap-2">
          <ChefHat className="w-4 h-4 text-[#d4af37]" />
          <span className="text-sm text-zinc-600">Restaurateur Pro</span>
        </div>
      </div>
    </div>
  );
};

export default DonationSuccess;
