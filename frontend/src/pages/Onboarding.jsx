import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  ChefHat, ArrowRight, ArrowLeft, CheckCircle, MapPin, DollarSign,
  Clock, UtensilsCrossed, Users, Palette, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CONCEPT_TYPES = ["fine_dining", "casual", "fast_casual", "qsr", "cafe", "bar", "food_truck", "ghost_kitchen"];
const CUISINE_TYPES = ["American", "Italian", "Mexican", "Asian", "Mediterranean", "Japanese", "French", "Indian", "BBQ", "Seafood", "Vegan", "Fusion"];
const SERVICE_TYPES = ["dine_in", "takeout", "delivery", "catering", "drive_through"];
const DIETARY_OPTIONS = ["vegetarian", "vegan", "gluten_free", "halal", "kosher", "dairy_free", "nut_free"];
const BEVERAGE_PROGRAMS = ["full_bar", "beer_wine", "non_alcoholic", "craft_cocktails"];
const BRAND_VOICES = ["professional", "casual", "playful", "sophisticated", "rustic", "modern"];
const FUNDING_SOURCES = ["personal_savings", "bank_loan", "sba_loan", "investors", "crowdfunding", "family_friends"];

const steps = [
  { id: 0, title: "Restaurant Concept", icon: ChefHat, section: "concept" },
  { id: 1, title: "Location Details", icon: MapPin, section: "location" },
  { id: 2, title: "Financial Planning", icon: DollarSign, section: "financial" },
  { id: 3, title: "Operations", icon: Clock, section: "operational" },
  { id: 4, title: "Menu Strategy", icon: UtensilsCrossed, section: "menu" },
  { id: 5, title: "Team & Staffing", icon: Users, section: "team" },
  { id: 6, title: "Brand Identity", icon: Palette, section: "branding" },
];

const Toggle = ({ value, options, onChange, multiple = false }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const active = multiple ? (value || []).includes(opt) : value === opt;
      return (
        <button
          key={opt}
          type="button"
          onClick={() => {
            if (multiple) {
              const arr = value || [];
              onChange(active ? arr.filter((v) => v !== opt) : [...arr, opt]);
            } else {
              onChange(active ? "" : opt);
            }
          }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            active
              ? "bg-[#d4af37] text-zinc-900 border-[#d4af37]"
              : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600 hover:text-zinc-300"
          }`}
        >
          {opt.replace(/_/g, " ")}
        </button>
      );
    })}
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="text-sm text-zinc-400 mb-1.5 block">{label}</label>
    {children}
  </div>
);

const Onboarding = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState(null);

  const [concept, setConcept] = useState({ restaurant_name: "", concept_type: "", cuisine_types: [], tagline: "", description: "", unique_selling_points: [] });
  const [location, setLocation] = useState({ address: "", city: "", state: "", zip_code: "", square_footage: "", seating_capacity: "", has_patio: false, patio_seats: "", parking_spaces: "" });
  const [financial, setFinancial] = useState({ total_budget: "", construction_budget: "", equipment_budget: "", working_capital: "", funding_sources: [], target_revenue_monthly: "", target_food_cost_percent: "30", target_labor_cost_percent: "30" });
  const [operational, setOperational] = useState({ target_open_date: "", service_types: [], pos_system: "", reservation_system: "", delivery_partners: [] });
  const [menu, setMenu] = useState({ price_range: "", dietary_options: [], beverage_program: "" });
  const [team, setTeam] = useState({ owner_name: user?.name || "", owner_experience: "", key_positions_needed: [], total_staff_needed: "", management_structure: "" });
  const [branding, setBranding] = useState({ brand_colors: [], brand_voice: "", target_demographic: "", target_age_range: "", website_url: "" });

  const loadProfile = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/profile`);
      const p = res.data;
      setProfileId(p.profile_id);
      if (p.concept?.restaurant_name) setConcept(p.concept);
      if (p.location?.city) setLocation(p.location);
      if (p.financial?.total_budget) setFinancial(p.financial);
      if (p.operational?.service_types?.length) setOperational(p.operational);
      if (p.menu?.price_range) setMenu(p.menu);
      if (p.team?.owner_name) setTeam(p.team);
      if (p.branding?.brand_voice) setBranding(p.branding);
      if (p.onboarding_step) setCurrentStep(p.onboarding_step);
    } catch { /* new user */ }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const getSectionData = (step) => {
    const toNum = (v) => (v === "" || v === undefined) ? 0 : Number(v);
    const maps = {
      concept,
      location: { ...location, square_footage: toNum(location.square_footage), seating_capacity: toNum(location.seating_capacity), patio_seats: toNum(location.patio_seats), parking_spaces: toNum(location.parking_spaces) },
      financial: { ...financial, total_budget: toNum(financial.total_budget), construction_budget: toNum(financial.construction_budget), equipment_budget: toNum(financial.equipment_budget), working_capital: toNum(financial.working_capital), target_revenue_monthly: toNum(financial.target_revenue_monthly), target_food_cost_percent: toNum(financial.target_food_cost_percent), target_labor_cost_percent: toNum(financial.target_labor_cost_percent) },
      operational,
      menu,
      team: { ...team, total_staff_needed: toNum(team.total_staff_needed) },
      branding,
    };
    return maps[steps[step].section];
  };

  const saveStep = async (step, andContinue = true) => {
    setSaving(true);
    try {
      await axios.put(`${API}/profile`, { section: steps[step].section, data: getSectionData(step) });
      const isLast = step === steps.length - 1;
      await axios.put(`${API}/profile/onboarding-step`, { step: isLast ? step : step + 1, completed: isLast && andContinue });
      if (isLast && andContinue) {
        toast.success("Profile complete! Welcome to Restaurateur Pro.");
        if (setUser) setUser((u) => ({ ...u, onboarding_completed: true }));
        navigate("/dashboard");
      } else if (andContinue) {
        setCurrentStep(step + 1);
      } else {
        toast.success("Progress saved");
      }
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <Field label="Restaurant Name *">
              <Input value={concept.restaurant_name} onChange={(e) => setConcept({ ...concept, restaurant_name: e.target.value })} placeholder="e.g. The Golden Table" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" />
            </Field>
            <Field label="Concept Type">
              <Toggle value={concept.concept_type} options={CONCEPT_TYPES} onChange={(v) => setConcept({ ...concept, concept_type: v })} />
            </Field>
            <Field label="Cuisine Types (select all that apply)">
              <Toggle value={concept.cuisine_types} options={CUISINE_TYPES} onChange={(v) => setConcept({ ...concept, cuisine_types: v })} multiple />
            </Field>
            <Field label="Tagline">
              <Input value={concept.tagline} onChange={(e) => setConcept({ ...concept, tagline: e.target.value })} placeholder="e.g. Farm-to-table, elevated" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" />
            </Field>
            <Field label="Description">
              <Textarea value={concept.description} onChange={(e) => setConcept({ ...concept, description: e.target.value })} placeholder="Describe your restaurant concept..." rows={3} className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" />
            </Field>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <Field label="Address"><Input value={location.address} onChange={(e) => setLocation({ ...location, address: e.target.value })} placeholder="123 Main St" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <Field label="City"><Input value={location.city} onChange={(e) => setLocation({ ...location, city: e.target.value })} placeholder="New York" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
              </div>
              <div>
                <Field label="State"><Input value={location.state} onChange={(e) => setLocation({ ...location, state: e.target.value })} placeholder="NY" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
              </div>
              <div>
                <Field label="ZIP"><Input value={location.zip_code} onChange={(e) => setLocation({ ...location, zip_code: e.target.value })} placeholder="10001" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Sq Ft"><Input type="number" value={location.square_footage} onChange={(e) => setLocation({ ...location, square_footage: e.target.value })} placeholder="2500" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
              <Field label="Seats"><Input type="number" value={location.seating_capacity} onChange={(e) => setLocation({ ...location, seating_capacity: e.target.value })} placeholder="80" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
              <Field label="Parking"><Input type="number" value={location.parking_spaces} onChange={(e) => setLocation({ ...location, parking_spaces: e.target.value })} placeholder="20" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={location.has_patio} onChange={(e) => setLocation({ ...location, has_patio: e.target.checked })} className="w-4 h-4 accent-[#d4af37]" />
              <span className="text-zinc-300 text-sm">Has outdoor patio</span>
            </label>
            {location.has_patio && (
              <Field label="Patio Seats"><Input type="number" value={location.patio_seats} onChange={(e) => setLocation({ ...location, patio_seats: e.target.value })} placeholder="30" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Total Budget ($)"><Input type="number" value={financial.total_budget} onChange={(e) => setFinancial({ ...financial, total_budget: e.target.value })} placeholder="500000" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
              <Field label="Monthly Revenue Target ($)"><Input type="number" value={financial.target_revenue_monthly} onChange={(e) => setFinancial({ ...financial, target_revenue_monthly: e.target.value })} placeholder="75000" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Construction ($)"><Input type="number" value={financial.construction_budget} onChange={(e) => setFinancial({ ...financial, construction_budget: e.target.value })} placeholder="200000" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
              <Field label="Equipment ($)"><Input type="number" value={financial.equipment_budget} onChange={(e) => setFinancial({ ...financial, equipment_budget: e.target.value })} placeholder="100000" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
              <Field label="Working Capital ($)"><Input type="number" value={financial.working_capital} onChange={(e) => setFinancial({ ...financial, working_capital: e.target.value })} placeholder="50000" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Food Cost Target (%)"><Input type="number" value={financial.target_food_cost_percent} onChange={(e) => setFinancial({ ...financial, target_food_cost_percent: e.target.value })} placeholder="30" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
              <Field label="Labor Cost Target (%)"><Input type="number" value={financial.target_labor_cost_percent} onChange={(e) => setFinancial({ ...financial, target_labor_cost_percent: e.target.value })} placeholder="30" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
            </div>
            <Field label="Funding Sources">
              <Toggle value={financial.funding_sources} options={FUNDING_SOURCES} onChange={(v) => setFinancial({ ...financial, funding_sources: v })} multiple />
            </Field>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <Field label="Target Open Date"><Input type="date" value={operational.target_open_date} onChange={(e) => setOperational({ ...operational, target_open_date: e.target.value })} className="bg-zinc-800 border-zinc-700 text-zinc-100" /></Field>
            <Field label="Service Types">
              <Toggle value={operational.service_types} options={SERVICE_TYPES} onChange={(v) => setOperational({ ...operational, service_types: v })} multiple />
            </Field>
            <Field label="POS System"><Input value={operational.pos_system} onChange={(e) => setOperational({ ...operational, pos_system: e.target.value })} placeholder="Toast, Square, Lightspeed..." className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
            <Field label="Reservation System"><Input value={operational.reservation_system} onChange={(e) => setOperational({ ...operational, reservation_system: e.target.value })} placeholder="OpenTable, Resy, Yelp..." className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <Field label="Price Range">
              <Toggle value={menu.price_range} options={["$", "$$", "$$$", "$$$$"]} onChange={(v) => setMenu({ ...menu, price_range: v })} />
            </Field>
            <Field label="Dietary Options">
              <Toggle value={menu.dietary_options} options={DIETARY_OPTIONS} onChange={(v) => setMenu({ ...menu, dietary_options: v })} multiple />
            </Field>
            <Field label="Beverage Program">
              <Toggle value={menu.beverage_program} options={BEVERAGE_PROGRAMS} onChange={(v) => setMenu({ ...menu, beverage_program: v })} />
            </Field>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <Field label="Owner Name"><Input value={team.owner_name} onChange={(e) => setTeam({ ...team, owner_name: e.target.value })} placeholder="Your name" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
            <Field label="Restaurant Experience"><Textarea value={team.owner_experience} onChange={(e) => setTeam({ ...team, owner_experience: e.target.value })} placeholder="Describe your background in the restaurant industry..." rows={3} className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Total Staff Needed"><Input type="number" value={team.total_staff_needed} onChange={(e) => setTeam({ ...team, total_staff_needed: e.target.value })} placeholder="25" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
              <Field label="Management Structure"><Input value={team.management_structure} onChange={(e) => setTeam({ ...team, management_structure: e.target.value })} placeholder="GM, Sous Chef, FOH Manager..." className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <Field label="Brand Voice">
              <Toggle value={branding.brand_voice} options={BRAND_VOICES} onChange={(v) => setBranding({ ...branding, brand_voice: v })} />
            </Field>
            <Field label="Target Demographic"><Input value={branding.target_demographic} onChange={(e) => setBranding({ ...branding, target_demographic: e.target.value })} placeholder="Young professionals, families, foodies..." className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
            <Field label="Target Age Range"><Input value={branding.target_age_range} onChange={(e) => setBranding({ ...branding, target_age_range: e.target.value })} placeholder="25-45" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
            <Field label="Website URL"><Input value={branding.website_url} onChange={(e) => setBranding({ ...branding, website_url: e.target.value })} placeholder="https://yourrestaurant.com" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" /></Field>
          </div>
        );
      default:
        return null;
    }
  };

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="min-h-screen bg-[#0f0f10] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#d4af37] flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-zinc-900" />
          </div>
          <span className="font-bold text-zinc-100">Restaurateur Pro</span>
        </div>
        <button
          onClick={() => saveStep(currentStep, false)}
          className="text-sm text-zinc-500 hover:text-zinc-300"
          disabled={saving}
        >
          Save & Exit
        </button>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-sm text-[#d4af37] font-medium">{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
          <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2 bg-zinc-800" />

          <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => i < currentStep && setCurrentStep(i)}
                  disabled={i > currentStep}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    i === currentStep ? "bg-[#d4af37] text-zinc-900" :
                    i < currentStep ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer" :
                    "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                  }`}
                >
                  {i < currentStep ? <CheckCircle className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                  {s.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#d4af37]/10 flex items-center justify-center">
              <StepIcon className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">{steps[currentStep].title}</h2>
              <p className="text-sm text-zinc-500">Tell us about your {steps[currentStep].title.toLowerCase()}</p>
            </div>
          </div>
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0 || saving}
            className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={() => saveStep(currentStep)}
            disabled={saving}
            className="bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030] font-semibold"
          >
            {saving ? "Saving..." : currentStep === steps.length - 1 ? "Complete Setup" : "Next"}
            {!saving && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
