import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  TrendingUp, DollarSign, Building2, CheckSquare, FileText, Target,
  Plus, ArrowUpRight, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ExpansionToolkit = () => {
  const [units, setUnits] = useState([]);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const response = await axios.get(`${API}/units`);
      setUnits(response.data);
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  };

  // Sample units if none exist
  const displayUnits = units.length > 0 ? units : [
    { unit_id: "1", name: "Downtown Flagship", location: "Manhattan, NY", status: "active", monthly_revenue: 185000 },
    { unit_id: "2", name: "Brooklyn Heights", location: "Brooklyn, NY", status: "active", monthly_revenue: 142000 },
    { unit_id: "3", name: "Hoboken", location: "Hoboken, NJ", status: "opening", monthly_revenue: 0 },
  ];

  const totalRevenue = displayUnits.reduce((acc, unit) => acc + unit.monthly_revenue, 0);
  const activeUnits = displayUnits.filter(u => u.status === "active").length;

  // Franchise Readiness Score breakdown
  const readinessScore = 78;
  const readinessMetrics = [
    { label: "Operations Standardization", value: 85, color: "bg-emerald" },
    { label: "Brand Guidelines", value: 90, color: "bg-azure" },
    { label: "Training Programs", value: 72, color: "bg-amber" },
    { label: "Legal Documentation", value: 65, color: "bg-fire" },
  ];

  // Replication checklist
  const [checklist, setChecklist] = useState([
    { id: "1", title: "Secure Lease Agreement", complete: true },
    { id: "2", title: "Finalize SOP Documentation", complete: true },
    { id: "3", title: "Complete Staff Recruitment", complete: false },
    { id: "4", title: "Equipment Procurement", complete: false },
    { id: "5", title: "Vendor Contracts Setup", complete: false },
    { id: "6", title: "Marketing Launch Plan", complete: false },
  ]);

  const toggleChecklistItem = (id) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === id ? { ...item, complete: !item.complete } : item
      )
    );
  };

  const completedItems = checklist.filter(item => item.complete).length;
  const checklistProgress = (completedItems / checklist.length) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-zinc-100">
            Expansion Toolkit
          </h1>
          <p className="text-zinc-400 mt-1">Multi-unit growth and franchise readiness</p>
        </div>
        <Button
          data-testid="add-unit-btn"
          className="bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Plan New Unit
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#18181b] border-zinc-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-[#d4af37]" />
              <Badge className="badge-green">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                12.5%
              </Badge>
            </div>
            <p className="text-2xl font-heading font-bold text-zinc-100">
              ${(totalRevenue / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-zinc-500">Monthly Revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-[#18181b] border-zinc-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-5 h-5 text-azure" />
            </div>
            <p className="text-2xl font-heading font-bold text-zinc-100">{activeUnits}</p>
            <p className="text-xs text-zinc-500">Active Units</p>
          </CardContent>
        </Card>

        <Card className="bg-[#18181b] border-zinc-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-emerald" />
            </div>
            <p className="text-2xl font-heading font-bold text-zinc-100">{readinessScore}%</p>
            <p className="text-xs text-zinc-500">Franchise Ready</p>
          </CardContent>
        </Card>

        <Card className="bg-[#18181b] border-zinc-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-violet" />
            </div>
            <p className="text-2xl font-heading font-bold text-zinc-100">2</p>
            <p className="text-xs text-zinc-500">Planned Openings</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Multi-Unit Dashboard */}
        <Card className="bg-[#18181b] border-zinc-800/50 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading text-zinc-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-azure" />
              Unit Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayUnits.map((unit) => (
                <div
                  key={unit.unit_id}
                  data-testid={`unit-${unit.unit_id}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">{unit.name}</h3>
                      <p className="text-xs text-zinc-500">{unit.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-lg font-bold text-zinc-100">
                        {unit.monthly_revenue > 0 ? `$${(unit.monthly_revenue / 1000).toFixed(0)}K` : "-"}
                      </p>
                      <p className="text-xs text-zinc-500">Monthly</p>
                    </div>
                    <Badge className={unit.status === "active" ? "badge-green" : "badge-amber"}>
                      {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
                    </Badge>
                    <ChevronRight className="w-5 h-5 text-zinc-500" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Franchise Readiness Score */}
        <Card className="bg-[#18181b] border-zinc-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading text-zinc-100 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald" />
              Franchise Readiness
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Score Circle */}
            <div className="flex justify-center mb-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#27272a"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#d4af37"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${readinessScore * 2.83} 283`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-heading font-bold text-zinc-100">{readinessScore}</span>
                  <span className="text-xs text-zinc-500">/ 100</span>
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
              {readinessMetrics.map((metric) => (
                <div key={metric.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-400">{metric.label}</span>
                    <span className="text-zinc-100">{metric.value}%</span>
                  </div>
                  <Progress value={metric.value} className="h-1.5 bg-zinc-800" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Unit Replication Checklist */}
        <Card className="bg-[#18181b] border-zinc-800/50 lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-heading text-zinc-100 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[#d4af37]" />
                Unit Replication Checklist
              </CardTitle>
              <span className="text-sm text-zinc-400">
                {completedItems}/{checklist.length} Complete
              </span>
            </div>
            <Progress value={checklistProgress} className="h-2 bg-zinc-800 mt-3" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  data-testid={`checklist-${item.id}`}
                  onClick={() => toggleChecklistItem(item.id)}
                  className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors ${
                    item.complete
                      ? "bg-emerald/10 border border-emerald/20"
                      : "bg-zinc-900/50 hover:bg-zinc-900"
                  }`}
                >
                  <Checkbox
                    checked={item.complete}
                    className={item.complete ? "border-emerald data-[state=checked]:bg-emerald" : ""}
                  />
                  <span className={`text-sm ${item.complete ? "text-emerald" : "text-zinc-300"}`}>
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExpansionToolkit;
