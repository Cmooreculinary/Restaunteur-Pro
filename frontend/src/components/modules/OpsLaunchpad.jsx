import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Rocket, Users, ChefHat, DollarSign, Package, Truck, Plus, Calculator,
  ArrowRight, UserPlus, CheckCircle, Clock, AlertCircle, Sparkles, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OpsLaunchpad = ({ project }) => {
  const [candidates, setCandidates] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [hiringTab, setHiringTab] = useState("application");
  const [costInput, setCostInput] = useState("");
  const [costResult, setCostResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    if (project?.project_id) {
      fetchCandidates();
      fetchVendors();
      fetchMenuItems();
    }
  }, [project?.project_id]);

  const fetchCandidates = async () => {
    try {
      const response = await axios.get(`${API}/candidates?project_id=${project.project_id}`);
      setCandidates(response.data);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await axios.get(`${API}/vendors?project_id=${project.project_id}`);
      setVendors(response.data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get(`${API}/menu-items?project_id=${project.project_id}`);
      setMenuItems(response.data);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  const calculateCost = async () => {
    if (!costInput.trim()) {
      toast.error("Please enter ingredients");
      return;
    }

    setCalculating(true);
    try {
      const response = await axios.post(`${API}/ai/cost-calculator`, {
        ingredients: costInput,
        servings: 4
      });
      setCostResult(response.data.calculation);
      toast.success("Cost calculated!");
    } catch (error) {
      console.error("Cost calculation error:", error);
      toast.error("Failed to calculate cost");
    } finally {
      setCalculating(false);
    }
  };

  // Sample candidates if none exist
  const displayCandidates = candidates.length > 0 ? candidates : [
    { candidate_id: "1", name: "Maria Santos", position: "Head Chef", stage: "interview" },
    { candidate_id: "2", name: "James Wilson", position: "Sous Chef", stage: "application" },
    { candidate_id: "3", name: "Emily Chen", position: "Server", stage: "onboarding" },
    { candidate_id: "4", name: "David Park", position: "Line Cook", stage: "application" },
    { candidate_id: "5", name: "Lisa Thompson", position: "Host", stage: "interview" },
    { candidate_id: "6", name: "Michael Brown", position: "Bartender", stage: "onboarding" },
  ];

  // Sample vendors if none exist
  const displayVendors = vendors.length > 0 ? vendors : [
    { vendor_id: "1", name: "Sysco Foods", category: "Dry Goods", delivery_status: "on_time" },
    { vendor_id: "2", name: "US Foods", category: "Produce", delivery_status: "delayed" },
    { vendor_id: "3", name: "Local Farms Co-op", category: "Fresh Meat", delivery_status: "on_time" },
    { vendor_id: "4", name: "Pacific Seafood", category: "Seafood", delivery_status: "pending" },
  ];

  const hiringStages = [
    { id: "application", label: "Applications", count: displayCandidates.filter(c => c.stage === "application").length },
    { id: "interview", label: "Interviews", count: displayCandidates.filter(c => c.stage === "interview").length },
    { id: "onboarding", label: "Onboarding", count: displayCandidates.filter(c => c.stage === "onboarding").length },
  ];

  const getDeliveryBadge = (status) => {
    switch (status) {
      case "on_time":
        return <Badge className="badge-green">On Time</Badge>;
      case "delayed":
        return <Badge className="badge-fire">Delayed</Badge>;
      default:
        return <Badge className="badge-amber">Pending</Badge>;
    }
  };

  const openRoles = 8;
  const foodCostPercent = 28.5;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-zinc-100">
            Ops Launchpad
          </h1>
          <p className="text-zinc-400 mt-1">Hiring, menu engineering, and supply chain management</p>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4">
          <div className="px-4 py-2 rounded-lg bg-[#18181b] border border-zinc-800/50">
            <p className="text-2xl font-heading font-bold text-azure">{openRoles}</p>
            <p className="text-xs text-zinc-500">Open Roles</p>
          </div>
          <div className="px-4 py-2 rounded-lg bg-[#18181b] border border-zinc-800/50">
            <p className="text-2xl font-heading font-bold text-emerald">{foodCostPercent}%</p>
            <p className="text-xs text-zinc-500">Food Cost</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Hiring Pipeline */}
        <Card className="bg-[#18181b] border-zinc-800/50 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-heading text-zinc-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-azure" />
                Hiring Pipeline
              </CardTitle>
              <Button
                data-testid="add-candidate-btn"
                size="sm"
                className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Stage Tabs */}
            <div className="flex gap-2 mb-4">
              {hiringStages.map((stage) => (
                <button
                  key={stage.id}
                  data-testid={`hiring-tab-${stage.id}`}
                  onClick={() => setHiringTab(stage.id)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    hiringTab === stage.id
                      ? "bg-zinc-800 text-zinc-100"
                      : "bg-zinc-900/50 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {stage.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    hiringTab === stage.id ? "bg-azure text-white" : "bg-zinc-800"
                  }`}>
                    {stage.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Candidates List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {displayCandidates
                .filter((c) => c.stage === hiringTab)
                .map((candidate) => (
                  <div
                    key={candidate.candidate_id}
                    data-testid={`candidate-${candidate.candidate_id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white text-sm font-medium">
                        {candidate.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-100">{candidate.name}</p>
                        <p className="text-xs text-zinc-500">{candidate.position}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Menu Engineering - Cost Calculator */}
        <Card className="bg-[#18181b] border-zinc-800/50 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading text-zinc-100 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-[#d4af37]" />
              AI Cost Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
                Enter ingredients (with quantities and costs)
              </label>
              <Textarea
                data-testid="cost-input"
                placeholder="e.g., 8oz ribeye steak ($12), 4oz butter ($2), fresh herbs ($1.50)..."
                value={costInput}
                onChange={(e) => setCostInput(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 min-h-[100px]"
              />
            </div>

            <Button
              data-testid="calculate-cost-btn"
              onClick={calculateCost}
              disabled={calculating}
              className="w-full bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030]"
            >
              <Sparkles className={`w-4 h-4 mr-2 ${calculating ? "animate-pulse" : ""}`} />
              {calculating ? "Calculating..." : "Calculate Recipe Cost"}
            </Button>

            {costResult && (
              <div className="p-4 rounded-lg bg-zinc-900 border border-[#d4af37]/20">
                <p className="text-xs text-[#d4af37] font-medium mb-2">AI Cost Analysis</p>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{costResult}</p>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800">
              <div className="text-center p-2">
                <p className="text-lg font-bold text-zinc-100">$4.85</p>
                <p className="text-xs text-zinc-500">Avg Cost/Dish</p>
              </div>
              <div className="text-center p-2">
                <p className="text-lg font-bold text-emerald">68%</p>
                <p className="text-xs text-zinc-500">Avg Margin</p>
              </div>
              <div className="text-center p-2">
                <p className="text-lg font-bold text-azure">32</p>
                <p className="text-xs text-zinc-500">Menu Items</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supply Chain */}
        <Card className="bg-[#18181b] border-zinc-800/50 lg:col-span-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-heading text-zinc-100 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald" />
                Supply Chain Management
              </CardTitle>
              <Button
                data-testid="add-vendor-btn"
                size="sm"
                className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Vendor
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {displayVendors.map((vendor) => (
                <div
                  key={vendor.vendor_id}
                  data-testid={`vendor-${vendor.vendor_id}`}
                  className="p-4 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                      <Package className="w-5 h-5 text-zinc-400" />
                    </div>
                    {getDeliveryBadge(vendor.delivery_status)}
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100 mb-1">{vendor.name}</h3>
                  <p className="text-xs text-zinc-500">{vendor.category}</p>
                  <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-between">
                    <Button variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-zinc-100 p-0">
                      View Orders
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs text-azure hover:text-azure/80 p-0">
                      New Order
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OpsLaunchpad;
