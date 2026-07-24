import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  FileText, CheckCircle, Clock, AlertTriangle, MessageSquare, Plus,
  ChevronRight, Timer, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeaseNegotiation = ({ project }) => {
  const [clauses, setClauses] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (project?.project_id) {
      fetchClauses();
    }
  }, [project?.project_id]);

  const fetchClauses = async () => {
    try {
      const response = await axios.get(`${API}/lease-clauses?project_id=${project.project_id}`);
      setClauses(response.data);
    } catch (error) {
      console.error("Error fetching clauses:", error);
    }
  };

  const analyzeWithAI = async () => {
    if (!aiInput.trim()) {
      toast.error("Please enter clause text to analyze");
      return;
    }

    setAnalyzing(true);
    try {
      const response = await axios.post(`${API}/ai/analyze`, {
        project_id: project.project_id,
        analysis_type: "lease",
        content: aiInput
      });
      setAiAnalysis(response.data.analysis);
      toast.success("Analysis complete!");
    } catch (error) {
      console.error("AI analysis error:", error);
      toast.error("Failed to analyze clause");
    } finally {
      setAnalyzing(false);
    }
  };

  // Sample clauses if none exist
  const displayClauses = clauses.length > 0 ? clauses : [
    { clause_id: "1", title: "Base Rent", status: "accepted", notes: "$8,500/month with 3% annual escalation" },
    { clause_id: "2", title: "CAM Charges", status: "reviewing", notes: "$2.50/sqft, no cap specified" },
    { clause_id: "3", title: "Lease Term", status: "accepted", notes: "10 years with one 5-year renewal option" },
    { clause_id: "4", title: "Exclusive Use", status: "counter_offered", notes: "Negotiating broader category definition" },
    { clause_id: "5", title: "Build-out Period", status: "accepted", notes: "6-month rent abatement" },
    { clause_id: "6", title: "Personal Guarantee", status: "attention", notes: "Requesting cap and time limit" },
    { clause_id: "7", title: "HVAC Maintenance", status: "reviewing", notes: "Tenant responsible - requesting inspection" },
    { clause_id: "8", title: "Signage Rights", status: "accepted", notes: "Approved for exterior and directory" },
    { clause_id: "9", title: "Assignment Rights", status: "counter_offered", notes: "Requesting transfer flexibility" },
    { clause_id: "10", title: "Insurance Requirements", status: "reviewing", notes: "Verifying coverage levels" },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "accepted":
        return <Badge className="badge-green">Accepted</Badge>;
      case "reviewing":
        return <Badge className="badge-blue">Reviewing</Badge>;
      case "counter_offered":
        return <Badge className="badge-amber">Counter-Offered</Badge>;
      case "attention":
        return <Badge className="badge-fire">Attention Required</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "reviewing":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "counter_offered":
        return <MessageSquare className="w-5 h-5 text-amber-500" />;
      case "attention":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-zinc-500" />;
    }
  };

  // Calculate progress
  const acceptedCount = displayClauses.filter(c => c.status === "accepted").length;
  const negotiationProgress = (acceptedCount / displayClauses.length) * 100;

  // Negotiation phase
  const phases = ["Initial Review", "Counter-Offer", "Final Terms", "Execution"];
  const currentPhase = 1; // Counter-Offer phase

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-zinc-100">
            Lease Negotiation
          </h1>
          <p className="text-zinc-400 mt-1">Track and manage lease terms and negotiations</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800/50">
          <Timer className="w-5 h-5 text-gold" />
          <div>
            <p className="text-sm font-medium text-zinc-100">Est. Completion</p>
            <p className="text-xs text-zinc-500">~2 weeks remaining</p>
          </div>
        </div>
      </div>

      {/* Negotiation Phase Progress */}
      <Card className="bg-zinc-900 border-zinc-800/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-400">Negotiation Phase</h3>
            <span className="text-sm text-zinc-500">{acceptedCount}/{displayClauses.length} clauses resolved</span>
          </div>
          
          <div className="relative">
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-zinc-800" />
            <div 
              className="absolute top-5 left-0 h-0.5 bg-gold"
              style={{ width: `${(currentPhase / (phases.length - 1)) * 100}%` }}
            />
            
            <div className="flex items-center justify-between relative z-10">
              {phases.map((phase, index) => (
                <div key={phase} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      index <= currentPhase
                        ? "bg-gold text-zinc-900"
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {index < currentPhase ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </div>
                  <span className={`mt-2 text-xs font-medium text-center ${
                    index <= currentPhase ? "text-zinc-100" : "text-zinc-500"
                  }`}>
                    {phase}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lease Checklist */}
        <Card className="bg-zinc-900 border-zinc-800/50 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-heading text-zinc-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold" />
                Restaurant Lease Checklist
              </CardTitle>
              <Button
                data-testid="add-clause-btn"
                size="sm"
                className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Clause
              </Button>
            </div>
            <Progress value={negotiationProgress} className="h-2 bg-zinc-800 mt-3" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {displayClauses.map((clause) => (
                <div
                  key={clause.clause_id}
                  data-testid={`clause-${clause.clause_id}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(clause.status)}
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{clause.title}</p>
                      <p className="text-xs text-zinc-500">{clause.notes}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(clause.status)}
                    <ChevronRight className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Clause Analyzer */}
        <Card className="bg-zinc-900 border-zinc-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" />
              AI Clause Analyzer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
                Paste lease clause for AI analysis
              </label>
              <Textarea
                data-testid="ai-clause-input"
                placeholder="Enter or paste lease clause text here..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 min-h-[120px]"
              />
            </div>

            <Button
              data-testid="analyze-clause-btn"
              onClick={analyzeWithAI}
              disabled={analyzing}
              className="w-full bg-gold text-zinc-900 hover:bg-fire-hover"
            >
              <Sparkles className={`w-4 h-4 mr-2 ${analyzing ? "animate-pulse" : ""}`} />
              {analyzing ? "Analyzing..." : "Analyze Clause"}
            </Button>

            {aiAnalysis && (
              <div className="p-4 rounded-lg bg-zinc-900 border border-gold/20 max-h-64 overflow-y-auto">
                <p className="text-xs text-gold font-medium mb-2">AI Analysis</p>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{aiAnalysis}</p>
              </div>
            )}

            {/* Quick Tips */}
            <div className="pt-4 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Negotiation Tips</p>
              <div className="space-y-2">
                <div className="p-2 rounded bg-zinc-900/50 text-xs text-zinc-400">
                  Always request a CAM cap to control operating costs
                </div>
                <div className="p-2 rounded bg-zinc-900/50 text-xs text-zinc-400">
                  Negotiate for assignment rights for exit flexibility
                </div>
                <div className="p-2 rounded bg-zinc-900/50 text-xs text-zinc-400">
                  Request exclusive use clause to limit competition
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeaseNegotiation;
