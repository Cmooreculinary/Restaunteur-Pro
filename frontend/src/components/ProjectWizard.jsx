import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ChefHat, MapPin, DollarSign, ArrowRight, ArrowLeft, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STEPS = [
  { id: 1, title: "Name Your Restaurant", icon: ChefHat },
  { id: 2, title: "Location", icon: MapPin },
  { id: 3, title: "Budget", icon: DollarSign },
];

export default function ProjectWizard({ open, onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "",
    budget_total: "",
  });

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const canNext = () => {
    if (step === 1) return form.name.trim().length >= 2;
    if (step === 2) return form.location.trim().length >= 2;
    if (step === 3) return true;
    return false;
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error("Restaurant name required");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        location: form.location.trim() || "TBD",
        budget_total: parseFloat(form.budget_total) || 0,
      };
      const res = await axios.post(`${API}/projects`, payload);
      toast.success(`${payload.name} created`);
      onCreated?.(res.data);
      setForm({ name: "", location: "", budget_total: "" });
      setStep(1);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900/95 backdrop-blur-xl border-zinc-800/80 text-zinc-100 sm:max-w-md p-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent pointer-events-none" />
        <DialogHeader className="px-6 pt-6 pb-2 relative">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-heading font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" />
              New Project
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-500 hover:text-zinc-200"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {/* Step indicators */}
          <div className="flex items-center gap-2 mt-4">
            {STEPS.map((s) => (
              <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full h-1 rounded-full transition-colors ${
                    step >= s.id ? "bg-gold" : "bg-zinc-800"
                  }`}
                />
                <span
                  className={`text-[10px] uppercase tracking-wider ${
                    step >= s.id ? "text-gold" : "text-zinc-600"
                  }`}
                >
                  {s.title.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="px-6 py-6 relative min-h-[200px]">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-2">
                <ChefHat className="w-6 h-6 text-gold" />
              </div>
              <Label className="text-zinc-400 text-sm">Restaurant Name</Label>
              <Input
                autoFocus
                placeholder="e.g. Ember & Oak"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="bg-zinc-900/80 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 h-12 text-lg"
                onKeyDown={(e) => e.key === "Enter" && canNext() && setStep(2)}
              />
              <p className="text-xs text-zinc-500">This will be your primary project name across all modules.</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-2">
                <MapPin className="w-6 h-6 text-gold" />
              </div>
              <Label className="text-zinc-400 text-sm">Location / City</Label>
              <Input
                autoFocus
                placeholder="e.g. Nashville, TN"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                className="bg-zinc-900/80 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 h-12 text-lg"
                onKeyDown={(e) => e.key === "Enter" && canNext() && setStep(3)}
              />
              <p className="text-xs text-zinc-500">Used for site analysis and demographics.</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-2">
                <DollarSign className="w-6 h-6 text-gold" />
              </div>
              <Label className="text-zinc-400 text-sm">Total Budget (optional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                <Input
                  autoFocus
                  type="number"
                  placeholder="500000"
                  value={form.budget_total}
                  onChange={(e) => update("budget_total", e.target.value)}
                  className="bg-zinc-900/80 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 h-12 text-lg pl-7"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <p className="text-xs text-zinc-500">You can refine this later in Command Center.</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex items-center justify-between relative">
          <Button
            variant="ghost"
            onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
            className="text-zinc-400 hover:text-zinc-100"
            disabled={loading}
          >
            {step === 1 ? "Cancel" : (
              <>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </>
            )}
          </Button>

          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="bg-gold text-zinc-900 hover:bg-fire-hover font-semibold"
            >
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={loading || !form.name.trim()}
              className="bg-gold text-zinc-900 hover:bg-fire-hover font-semibold min-w-[140px]"
            >
              {loading ? "Creating..." : "Create Project"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
