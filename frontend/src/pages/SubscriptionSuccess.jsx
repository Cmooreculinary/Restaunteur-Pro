import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { CheckCircle, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      navigate("/pricing");
      return;
    }
    const verify = async () => {
      try {
        const res = await axios.get(`${API}/subscriptions/status/${sessionId}`);
        setStatus(res.data.payment_status === "paid" ? "success" : "pending");
      } catch {
        setStatus("error");
      }
    };
    verify();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#d4af37]/10 flex items-center justify-center">
            {status === "loading" ? (
              <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-8 h-8 text-[#d4af37]" />
            )}
          </div>
        </div>

        {status === "loading" && <p className="text-zinc-400">Verifying your payment...</p>}
        {status === "success" && (
          <>
            <h1 className="text-2xl font-bold text-zinc-100 mb-2">You're in!</h1>
            <p className="text-zinc-400 mb-6">Your subscription is active. Welcome to the full Restaurateur Pro experience.</p>
            <Button onClick={() => navigate("/dashboard")} className="bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030] font-semibold px-8">
              Go to Dashboard
            </Button>
          </>
        )}
        {status === "pending" && (
          <>
            <h1 className="text-2xl font-bold text-zinc-100 mb-2">Almost there</h1>
            <p className="text-zinc-400 mb-6">Payment is processing. Your account will be upgraded shortly.</p>
            <Button onClick={() => navigate("/dashboard")} className="bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030] font-semibold px-8">
              Continue to Dashboard
            </Button>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-2xl font-bold text-zinc-100 mb-2">Something went wrong</h1>
            <p className="text-zinc-400 mb-6">We couldn't verify your payment. Please contact support.</p>
            <Link to="/pricing"><Button variant="outline" className="border-zinc-700 text-zinc-300">Back to Pricing</Button></Link>
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

export default SubscriptionSuccess;
