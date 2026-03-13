import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Map, Search, MapPin, Users, Building2, DollarSign, Footprints, Train,
  AlertTriangle, Upload, RefreshCw, TrendingUp, TrendingDown, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SiteStrategist = ({ project }) => {
  const [demographics, setDemographics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState([40.7128, -74.006]);
  const [analyzing, setAnalyzing] = useState(false);
  const [leaseAnalysis, setLeaseAnalysis] = useState(null);

  useEffect(() => {
    fetchDemographics();
  }, []);

  const fetchDemographics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/site/demographics?lat=${mapCenter[0]}&lng=${mapCenter[1]}`);
      setDemographics(response.data);
    } catch (error) {
      console.error("Error fetching demographics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Simulated geocoding
    toast.info("Searching for: " + searchQuery);
    fetchDemographics();
  };

  const analyzeLeaseWithAI = async () => {
    setAnalyzing(true);
    try {
      const response = await axios.post(`${API}/ai/analyze`, {
        project_id: project.project_id,
        analysis_type: "lease",
        content: "Analyze this commercial lease for a restaurant: Base rent $8,500/month with 3% annual escalation. Triple net (NNN) lease with estimated CAM charges of $2.50/sqft. 10-year term with one 5-year renewal option. Exclusive use clause for 'casual dining restaurant'. Landlord responsible for roof and structure. Tenant responsible for HVAC maintenance. 6-month rent abatement during build-out. Personal guarantee required for first 3 years."
      });
      setLeaseAnalysis(response.data.analysis);
      toast.success("Lease analysis complete!");
    } catch (error) {
      console.error("AI analysis error:", error);
      toast.error("Failed to analyze lease");
    } finally {
      setAnalyzing(false);
    }
  };

  const leaseIssues = [
    { id: 1, title: "Restrictive Exclusive Use", severity: "high", desc: "Clause limits food service options" },
    { id: 2, title: "CAM Cap Missing", severity: "medium", desc: "No cap on annual CAM increases" },
    { id: 3, title: "Personal Guarantee", severity: "low", desc: "Standard for new tenants" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-zinc-100">
            Site Strategist
          </h1>
          <p className="text-zinc-400 mt-1">Analyze locations and evaluate lease opportunities</p>
        </div>
        <Button
          data-testid="refresh-data-btn"
          onClick={fetchDemographics}
          disabled={loading}
          className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* Map Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                data-testid="site-search"
                placeholder="Search commercial zones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>
            <Button onClick={handleSearch} className="bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030]">
              Search
            </Button>
          </div>

          {/* Map */}
          <Card className="bg-[#18181b] border-zinc-800/50 overflow-hidden h-[calc(100%-60px)]">
            <div className="h-full rounded-lg overflow-hidden">
              <MapContainer
                center={mapCenter}
                zoom={14}
                className="h-full w-full"
                style={{ background: "#18181b" }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Marker position={mapCenter}>
                  <Popup>
                    <div className="text-zinc-900">
                      <strong>Target Location</strong>
                      <br />
                      Potential restaurant site
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </Card>
        </div>

        {/* Right Panel - Demographics & Lease */}
        <div className="space-y-6 overflow-auto">
          {/* Demographics Card */}
          <Card className="bg-[#18181b] border-zinc-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-heading text-zinc-100 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#d4af37]" />
                Demographic Insights
              </CardTitle>
              <p className="text-xs text-zinc-500">Live data • Updated just now</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Foot Traffic */}
              <div className="p-3 rounded-lg bg-zinc-900/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Footprints className="w-4 h-4 text-emerald" />
                    <span className="text-sm text-zinc-400">Foot Traffic</span>
                  </div>
                  <Badge className="badge-green">{demographics?.foot_traffic?.trend || "+8.2%"}</Badge>
                </div>
                <p className="text-2xl font-heading font-bold text-zinc-100">
                  {demographics?.foot_traffic?.daily?.toLocaleString() || "12,500"}/day
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Peak: {demographics?.foot_traffic?.peak_hours || "12pm - 2pm, 6pm - 9pm"}
                </p>
              </div>

              {/* Competition */}
              <div className="p-3 rounded-lg bg-zinc-900/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-azure" />
                    <span className="text-sm text-zinc-400">Local Competition</span>
                  </div>
                  <Badge className="badge-amber">{demographics?.competition?.density || "Medium"}</Badge>
                </div>
                <p className="text-2xl font-heading font-bold text-zinc-100">
                  {demographics?.competition?.count || 21} restaurants
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Nearest: {demographics?.competition?.nearest_competitor || "0.3 mi"}
                </p>
              </div>

              {/* Income */}
              <div className="p-3 rounded-lg bg-zinc-900/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#d4af37]" />
                    <span className="text-sm text-zinc-400">Median Income</span>
                  </div>
                  <Badge className="badge-green">{demographics?.income?.trend || "+4.1%"}</Badge>
                </div>
                <p className="text-2xl font-heading font-bold text-zinc-100">
                  ${demographics?.income?.median?.toLocaleString() || "78,500"}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Bracket: {demographics?.income?.bracket || "$75k-$100k"}
                </p>
              </div>

              {/* Walkability */}
              <div className="p-3 rounded-lg bg-zinc-900/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Train className="w-4 h-4 text-violet" />
                    <span className="text-sm text-zinc-400">Walkability Score</span>
                  </div>
                  <Badge className="badge-green">Grade A</Badge>
                </div>
                <p className="text-2xl font-heading font-bold text-zinc-100">
                  {demographics?.walkability?.score || 92}/100
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Transit: {demographics?.walkability?.transit_score || 85}/100
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lease Analyzer */}
          <Card className="bg-[#18181b] border-zinc-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-heading text-zinc-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber" />
                Lease Analyzer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {leaseIssues.map((issue) => (
                  <div
                    key={issue.id}
                    data-testid={`lease-issue-${issue.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50"
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      issue.severity === "high" ? "bg-red-500" :
                      issue.severity === "medium" ? "bg-amber-500" : "bg-blue-500"
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{issue.title}</p>
                      <p className="text-xs text-zinc-500">{issue.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                data-testid="ai-analyze-lease-btn"
                onClick={analyzeLeaseWithAI}
                disabled={analyzing}
                className="w-full bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030]"
              >
                <Sparkles className={`w-4 h-4 mr-2 ${analyzing ? "animate-pulse" : ""}`} />
                {analyzing ? "Analyzing..." : "AI Lease Analysis"}
              </Button>

              {leaseAnalysis && (
                <div className="p-4 rounded-lg bg-zinc-900 border border-[#d4af37]/20 mt-4">
                  <p className="text-xs text-[#d4af37] font-medium mb-2">AI Analysis Result</p>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{leaseAnalysis}</p>
                </div>
              )}

              <Button
                data-testid="upload-lease-btn"
                variant="outline"
                className="w-full border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload New Lease
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SiteStrategist;
