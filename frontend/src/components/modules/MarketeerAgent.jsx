import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Megaphone, Sparkles, Instagram, Mail, Calendar, Mic2, BarChart3,
  Tag, Copy, Trash2, ChevronDown, ChevronUp, Loader2, Plus, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TASK_TYPES = [
  { id: "social_post", label: "Social Post", icon: Instagram, desc: "Instagram, TikTok, Facebook, Twitter content" },
  { id: "email_campaign", label: "Email Campaign", icon: Mail, desc: "Subject lines, body copy, CTAs" },
  { id: "launch_strategy", label: "Launch Strategy", icon: Megaphone, desc: "30-day pre-launch marketing plan" },
  { id: "brand_voice", label: "Brand Voice", icon: Mic2, desc: "Tone guide, messaging framework" },
  { id: "competitor_analysis", label: "Positioning", icon: BarChart3, desc: "Competitive differentiation & messaging" },
  { id: "promo_copy", label: "Promo Copy", icon: Tag, desc: "Headlines, taglines, offer hooks" },
  { id: "marketing_calendar", label: "90-Day Calendar", icon: Calendar, desc: "Content calendar with themes & pillars" },
];

const PLATFORMS = ["instagram", "facebook", "tiktok", "twitter", "email", "all"];

const TONES = ["professional", "casual", "playful", "sophisticated", "rustic", "bold"];

const CampaignCard = ({ campaign, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const copyContent = () => {
    navigator.clipboard.writeText(campaign.content);
    toast.success("Copied to clipboard");
  };

  const taskMeta = TASK_TYPES.find((t) => t.id === campaign.type);
  const Icon = taskMeta?.icon || Megaphone;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-gold" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-200">{campaign.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-500 py-0">
                {campaign.type.replace(/_/g, " ")}
              </Badge>
              {campaign.platform && (
                <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-500 py-0">
                  {campaign.platform}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={copyContent} className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(campaign.campaign_id)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
          <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">{campaign.content}</pre>
        </div>
      )}
      {!expanded && (
        <p className="text-xs text-zinc-600 line-clamp-2">{campaign.content.slice(0, 120)}...</p>
      )}
    </div>
  );
};

const MarketeerAgent = () => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [platform, setPlatform] = useState("");
  const [tone, setTone] = useState("");
  const [context, setContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [activeView, setActiveView] = useState("generate"); // generate | history

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/marketeer/campaigns`);
      setCampaigns(res.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const handleGenerate = async () => {
    if (!selectedTask) {
      toast.error("Select a task type first");
      return;
    }
    setGenerating(true);
    setResult(null);
    try {
      const res = await axios.post(`${API}/marketeer/generate`, {
        task_type: selectedTask,
        platform: platform || null,
        tone: tone || null,
        context: context || null
      });
      setResult(res.data);
      fetchCampaigns();
      toast.success("Marketing content generated!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Generation failed. Make sure ANTHROPIC_API_KEY is configured.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (campaignId) => {
    try {
      await axios.delete(`${API}/marketeer/campaigns/${campaignId}`);
      setCampaigns((prev) => prev.filter((c) => c.campaign_id !== campaignId));
      toast.success("Deleted");
    } catch { toast.error("Delete failed"); }
  };

  const copyResult = () => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content);
      toast.success("Copied to clipboard");
    }
  };

  const taskMeta = TASK_TYPES.find((t) => t.id === selectedTask);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-zinc-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-gold" />
            </div>
            Marketeer Agent
          </h2>
          <p className="text-zinc-500 mt-1 text-sm ml-12">AI-powered marketing content tailored to your restaurant brand</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={activeView === "generate" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveView("generate")}
            className={activeView === "generate" ? "bg-gold text-zinc-900 hover:bg-fire-hover" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"}
          >
            <Plus className="w-4 h-4 mr-1" />
            Generate
          </Button>
          <Button
            variant={activeView === "history" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveView("history")}
            className={activeView === "history" ? "bg-gold text-zinc-900 hover:bg-fire-hover" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"}
          >
            <BookOpen className="w-4 h-4 mr-1" />
            History ({campaigns.length})
          </Button>
        </div>
      </div>

      {activeView === "generate" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Controls */}
          <div className="space-y-5">
            {/* Task Type */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-4 uppercase tracking-wider">Choose Task</h3>
              <div className="grid grid-cols-1 gap-2">
                {TASK_TYPES.map((task) => {
                  const Icon = task.icon;
                  return (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                        selectedTask === task.id
                          ? "border-gold bg-gold/5 text-zinc-100"
                          : "border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-300"
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${selectedTask === task.id ? "text-gold" : ""}`} />
                      <div>
                        <span className="text-sm font-medium block">{task.label}</span>
                        <span className="text-xs text-zinc-600">{task.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Options & Output */}
          <div className="space-y-4">
            {/* Options */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-4 uppercase tracking-wider">Options</h3>

              {selectedTask === "social_post" && (
                <div className="mb-4">
                  <label className="text-xs text-zinc-500 mb-2 block">Platform</label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPlatform(p === platform ? "" : p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                          platform === p ? "bg-gold text-zinc-900 border-gold" : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="text-xs text-zinc-500 mb-2 block">Tone / Brand Voice</label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t === tone ? "" : t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                        tone === t ? "bg-gold text-zinc-900 border-gold" : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-2 block">Additional Context (optional)</label>
                <Textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder={
                    selectedTask === "social_post" ? "e.g. Promote our new brunch menu launching this Saturday..." :
                    selectedTask === "email_campaign" ? "e.g. Re-engagement campaign for inactive customers with 20% off..." :
                    "Describe any specific details, promotions, events, or focus areas..."
                  }
                  rows={4}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!selectedTask || generating}
                className="w-full mt-4 bg-gold text-zinc-900 hover:bg-fire-hover font-semibold"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate {taskMeta?.label || "Content"}
                  </>
                )}
              </Button>
            </div>

            {/* Result */}
            {result && (
              <div className="bg-zinc-900 border border-gold/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold" />
                    <span className="text-sm font-semibold text-zinc-200">Generated Content</span>
                  </div>
                  <button onClick={copyResult} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded hover:bg-zinc-800">
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </button>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                  <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto">
                    {result.content}
                  </pre>
                </div>
              </div>
            )}

            {/* Placeholder */}
            {!result && !generating && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
                  <Megaphone className="w-6 h-6 text-zinc-600" />
                </div>
                <p className="text-zinc-500 text-sm">Select a task type and click Generate to create AI-powered marketing content for your restaurant.</p>
                <p className="text-zinc-600 text-xs mt-2">Content is personalized using your business profile data.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* History View */
        <div>
          {campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                <BookOpen className="w-7 h-7 text-zinc-600" />
              </div>
              <p className="text-zinc-500">No campaigns generated yet</p>
              <p className="text-zinc-600 text-sm mt-1">Generate your first marketing content to see it here</p>
              <Button onClick={() => setActiveView("generate")} className="mt-4 bg-gold text-zinc-900 hover:bg-fire-hover" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Content
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.campaign_id} campaign={campaign} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarketeerAgent;
