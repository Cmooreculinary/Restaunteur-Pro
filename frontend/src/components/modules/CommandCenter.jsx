import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  MapPin, Calendar, DollarSign, Users, AlertTriangle, CheckCircle, Clock,
  ArrowUpRight, ArrowDownRight, Plus, MoreHorizontal, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CommandCenter = ({ project, onProjectUpdate }) => {
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]);
  const [budget, setBudget] = useState([]);
  const projectId = project?.project_id;

  const fetchTasks = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/tasks?project_id=${projectId}`);
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, [projectId]);

  const fetchTeam = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/team?project_id=${projectId}`);
      setTeam(response.data);
    } catch (error) {
      console.error("Error fetching team:", error);
    }
  }, [projectId]);

  const fetchBudget = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/budget?project_id=${projectId}`);
      setBudget(response.data);
    } catch (error) {
      console.error("Error fetching budget:", error);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchTasks();
      fetchTeam();
      fetchBudget();
    }
  }, [fetchBudget, fetchTasks, fetchTeam, projectId]);

  const phases = [
    { id: "concept", label: "Concept", complete: true },
    { id: "site", label: "Site", complete: project?.phase !== "concept" },
    { id: "construction", label: "Construction", complete: ["construction", "opening", "live"].includes(project?.phase) },
    { id: "opening", label: "Opening", complete: ["opening", "live"].includes(project?.phase) },
    { id: "live", label: "Live", complete: project?.phase === "live" },
  ];

  const currentPhaseIndex = phases.findIndex(p => p.id === project?.phase);

  // Sample tasks if none exist
  const displayTasks = tasks.length > 0 ? tasks : [
    { task_id: "TSK-001", title: "Finalize Kitchen Layout", status: "urgent", due_date: "Dec 15", category: "design" },
    { task_id: "TSK-002", title: "Submit Health Permit Application", status: "active", due_date: "Dec 20", category: "permits" },
    { task_id: "TSK-003", title: "Interview Head Chef Candidates", status: "pending", due_date: "Dec 22", category: "hiring" },
    { task_id: "TSK-004", title: "Review Contractor Bids", status: "active", due_date: "Dec 18", category: "construction" },
  ];

  // Sample team if none exist
  const displayTeam = team.length > 0 ? team : [
    { member_id: "1", name: "Sarah Chen", role: "Project Lead", avatar_color: "purple" },
    { member_id: "2", name: "Marcus Johnson", role: "Architect", avatar_color: "cyan" },
    { member_id: "3", name: "Elena Rodriguez", role: "Interior Designer", avatar_color: "amber" },
    { member_id: "4", name: "David Kim", role: "Kitchen Consultant", avatar_color: "emerald" },
  ];

  // Sample budget if none exist
  const displayBudget = budget.length > 0 ? budget : [
    { budget_id: "1", category: "Construction", planned: 250000, spent: 187500 },
    { budget_id: "2", category: "Equipment", planned: 150000, spent: 82500 },
    { budget_id: "3", category: "Permits & Fees", planned: 35000, spent: 28000 },
  ];

  const totalBudget = displayBudget.reduce((acc, item) => acc + item.planned, 0);
  const totalSpent = displayBudget.reduce((acc, item) => acc + item.spent, 0);
  const variance = totalBudget - totalSpent;

  const getStatusBadge = (status) => {
    switch (status) {
      case "urgent":
        return <Badge className="badge-fire">Urgent</Badge>;
      case "active":
        return <Badge className="badge-blue">Active</Badge>;
      case "pending":
        return <Badge className="badge-amber">Pending</Badge>;
      case "completed":
        return <Badge className="badge-green">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAvatarColor = (color) => {
    const colors = {
      purple: "bg-gradient-to-br from-purple-600 to-purple-800",
      cyan: "bg-gradient-to-br from-cyan-500 to-cyan-700",
      amber: "bg-gradient-to-br from-amber-500 to-amber-700",
      emerald: "bg-gradient-to-br from-emerald-500 to-emerald-700",
    };
    return colors[color] || colors.purple;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Project Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-zinc-100">
            {project?.name || "Restaurant Project"}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {project?.location || "Location TBD"}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Phase: {project?.phase?.charAt(0).toUpperCase() + project?.phase?.slice(1) || "Concept"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-3xl font-heading font-bold text-[#d4af37]">
              {project?.completion || 15}%
            </div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Complete</div>
          </div>
        </div>
      </div>

      {/* Phase Stepper */}
      <Card className="bg-[#18181b] border-zinc-800/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-zinc-800" />
            <div 
              className="absolute top-5 left-0 h-0.5 bg-[#d4af37] transition-all duration-500"
              style={{ width: `${(currentPhaseIndex / (phases.length - 1)) * 100}%` }}
            />
            
            {phases.map((phase, index) => (
              <div key={phase.id} className="relative flex flex-col items-center z-10">
                <div
                  data-testid={`phase-${phase.id}`}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    index <= currentPhaseIndex
                      ? "bg-[#d4af37] text-zinc-900"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {index < currentPhaseIndex ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>
                <span className={`mt-2 text-xs font-medium ${
                  index <= currentPhaseIndex ? "text-zinc-100" : "text-zinc-500"
                }`}>
                  {phase.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Tasks */}
        <div className="lg:col-span-8 space-y-6">
          {/* Critical Path Tasks */}
          <Card className="bg-[#18181b] border-zinc-800/50">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-heading text-zinc-100">
                Critical Path Tasks
              </CardTitle>
              <Button
                data-testid="add-task-btn"
                size="sm"
                className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Task
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {displayTasks.map((task) => (
                  <div
                    key={task.task_id}
                    data-testid={`task-${task.task_id}`}
                    className="flex items-center justify-between p-4 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusBadge(task.status)}
                      <div>
                        <p className="text-sm font-medium text-zinc-100">{task.title}</p>
                        <p className="text-xs text-zinc-500">ID: {task.task_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-zinc-500">Due: {task.due_date}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-100"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Budget & Team */}
        <div className="lg:col-span-4 space-y-6">
          {/* Budget Health */}
          <Card className="bg-[#18181b] border-zinc-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-heading text-zinc-100 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#d4af37]" />
                Budget Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total Invested</p>
                  <p className="text-2xl font-heading font-bold text-zinc-100">
                    ${(totalSpent / 1000).toFixed(0)}K
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Variance</p>
                  <p className={`text-2xl font-heading font-bold flex items-center gap-1 ${
                    variance >= 0 ? "text-green-500" : "text-red-500"
                  }`}>
                    {variance >= 0 ? (
                      <ArrowDownRight className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                    ${Math.abs(variance / 1000).toFixed(0)}K
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {displayBudget.map((item) => (
                  <div key={item.budget_id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-400">{item.category}</span>
                      <span className="text-zinc-100">
                        ${(item.spent / 1000).toFixed(0)}K / ${(item.planned / 1000).toFixed(0)}K
                      </span>
                    </div>
                    <Progress
                      value={(item.spent / item.planned) * 100}
                      className="h-2 bg-zinc-800"
                    />
                  </div>
                ))}
              </div>

              <Button
                data-testid="generate-report-btn"
                className="w-full mt-6 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate Financial Report
              </Button>
            </CardContent>
          </Card>

          {/* On-Site Team */}
          <Card className="bg-[#18181b] border-zinc-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-heading text-zinc-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-azure" />
                On-Site Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {displayTeam.map((member) => (
                  <div
                    key={member.member_id}
                    data-testid={`team-member-${member.member_id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className={`${getAvatarColor(member.avatar_color)} text-white text-sm font-medium`}>
                        {member.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-zinc-100 truncate">{member.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                data-testid="add-expert-btn"
                variant="outline"
                className="w-full mt-4 border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 hover:bg-zinc-800/50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Expert
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
