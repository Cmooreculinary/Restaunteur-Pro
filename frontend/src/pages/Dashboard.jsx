import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  ChefHat, LayoutDashboard, Map, Hammer, Rocket, TrendingUp, FileText,
  Megaphone, Brain, Bell, Search, LogOut, Settings, User, Plus, ChevronRight, ChevronDown,
  AlertTriangle, CheckCircle, Clock, ArrowUpRight, ArrowDownRight, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

// Module Components
import CommandCenter from "@/components/modules/CommandCenter";
import SiteStrategist from "@/components/modules/SiteStrategist";
import GroundUp from "@/components/modules/GroundUp";
import OpsLaunchpad from "@/components/modules/OpsLaunchpad";
import ExpansionToolkit from "@/components/modules/ExpansionToolkit";
import LeaseNegotiation from "@/components/modules/LeaseNegotiation";
import MarketeerAgent from "@/components/modules/MarketeerAgent";
import APIntelligence from "@/components/modules/APIntelligence";
import ProjectWizard from "@/components/ProjectWizard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user, setUser }) => {
  const [activeTab, setActiveTab] = useState("command");
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showWizard, setShowWizard] = useState(false);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
      if (response.data.length > 0) {
        setActiveProject((prev) => {
          if (prev) {
            const stillExists = response.data.find((p) => p.project_id === prev.project_id);
            return stillExists || response.data[0];
          }
          return response.data[0];
        });
      } else {
        setActiveProject(null);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/notifications`);
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchNotifications();
  }, [fetchProjects, fetchNotifications]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
      setUser(null);
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Mark notifications as read
  const markNotificationsRead = async () => {
    try {
      await axios.post(`${API}/notifications/read`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error("Error marking notifications read:", error);
    }
  };

  const handleProjectCreated = (project) => {
    setProjects((prev) => [project, ...prev]);
    setActiveProject(project);
    setActiveTab("command");
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const modules = [
    { id: "command", icon: LayoutDashboard, label: "Command Center" },
    { id: "site", icon: Map, label: "Site Strategist" },
    { id: "ground", icon: Hammer, label: "Ground Up" },
    { id: "ops", icon: Rocket, label: "Ops Launchpad" },
    { id: "expansion", icon: TrendingUp, label: "Expansion Toolkit" },
    { id: "lease", icon: FileText, label: "Lease Negotiation" },
    { id: "marketeer", icon: Megaphone, label: "Marketeer Agent" },
    { id: "ap", icon: Brain, label: "AP Intelligence" },
  ];
  const activeModule = modules.find((module) => module.id === activeTab);

  return (
    <div className="app-shell min-h-screen bg-background">
      <aside className="app-rail hidden lg:flex">
        <div className="app-wordmark">
          <span className="app-wordmark-mark"><ChefHat aria-hidden="true" /></span>
          <span>Restaurateur<br />Pro</span>
        </div>
        <nav className="app-rail-nav" aria-label="Operations modules">
          {modules.map((module) => (
            <button
              key={module.id}
              data-testid={`tab-${module.id}`}
              onClick={() => setActiveTab(module.id)}
              className={activeTab === module.id ? "is-active" : ""}
              aria-current={activeTab === module.id ? "page" : undefined}
            >
              <module.icon aria-hidden="true" />
              <span>{module.label}</span>
            </button>
          ))}
        </nav>
        <div className="app-rail-foot">
          <span>Operator workspace</span>
          <strong>{activeProject?.name || "No active project"}</strong>
        </div>
      </aside>

      <div className="app-stage">
        <header className="app-topbar">
          <div className="app-context">
            <span className="app-context-label">Current workspace</span>
            <strong>{activeModule?.label}</strong>
          </div>
          <div className="app-actions">
            <div className="hidden md:flex items-center gap-2">
              {projects.length > 0 && (
                <select
                  aria-label="Active restaurant project"
                  value={activeProject?.project_id || ""}
                  onChange={(e) => {
                    const project = projects.find((item) => item.project_id === e.target.value);
                    if (project) setActiveProject(project);
                  }}
                  className="app-project-select"
                >
                  {projects.map((project) => (
                    <option key={project.project_id} value={project.project_id}>{project.name}</option>
                  ))}
                </select>
              )}
              <Button size="sm" onClick={() => setShowWizard(true)} className="app-new-project">
                <Plus className="w-4 h-4" /> New project
              </Button>
            </div>
            <div className="app-search hidden xl:flex">
              <Search aria-hidden="true" />
              <Input
                data-testid="global-search"
                aria-label="Search workspace"
                placeholder="Search workspace"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd>⌘K</kbd>
            </div>
            <div className="relative">
              <Button
                data-testid="notifications-btn"
                variant="ghost"
                size="icon"
                className="app-icon-button relative"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications && unreadCount > 0) markNotificationsRead();
                }}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="app-unread-count">{unreadCount}</span>
                )}
              </Button>
              {showNotifications && (
                <div className="app-notifications">
                  <div className="app-notifications-head">
                    <strong>Notifications</strong>
                    <Button variant="ghost" size="icon" aria-label="Close notifications" onClick={() => setShowNotifications(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <ScrollArea className="h-64">
                    {notifications.length === 0 ? (
                      <div className="app-empty-note">No notifications</div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.notification_id} className={`app-notification ${!notif.read ? "is-unread" : ""}`}>
                          <p>{notif.title}</p>
                          <span>{notif.message}</span>
                        </div>
                      ))
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button data-testid="user-menu-btn" variant="ghost" className="app-user-button">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.picture} alt={user?.name} />
                    <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block">{user?.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="app-menu w-56">
                <div className="app-menu-identity">
                  <p>{user?.name}</p>
                  <span>{user?.email}</span>
                </div>
                <DropdownMenuItem><User className="w-4 h-4 mr-2" /> Profile</DropdownMenuItem>
                <DropdownMenuItem><Settings className="w-4 h-4 mr-2" /> Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="logout-btn" onClick={handleLogout} className="app-menu-danger">
                  <LogOut className="w-4 h-4 mr-2" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <nav className="app-mobile-nav lg:hidden" aria-label="Operations modules">
          <div>
            {modules.map((module) => (
              <button
                key={module.id}
                data-testid={`mobile-tab-${module.id}`}
                onClick={() => setActiveTab(module.id)}
                className={activeTab === module.id ? "is-active" : ""}
              >
                <module.icon className="w-4 h-4" />
                <span>{module.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <main className="app-workbench">
          {activeTab === "marketeer" && <MarketeerAgent />}
          {activeTab === "ap" && <APIntelligence />}
          {activeTab !== "marketeer" && activeTab !== "ap" && activeProject ? (
            <>
              {activeTab === "command" && <CommandCenter project={activeProject} onProjectUpdate={fetchProjects} />}
              {activeTab === "site" && <SiteStrategist project={activeProject} />}
              {activeTab === "ground" && <GroundUp project={activeProject} />}
              {activeTab === "ops" && <OpsLaunchpad project={activeProject} />}
              {activeTab === "expansion" && <ExpansionToolkit />}
              {activeTab === "lease" && <LeaseNegotiation project={activeProject} />}
            </>
          ) : activeTab !== "marketeer" && activeTab !== "ap" ? (
            <section className="app-zero-state">
              <span><ChefHat aria-hidden="true" /></span>
              <p className="app-context-label">Begin the work</p>
              <h2>No projects yet</h2>
              <p>Create your first restaurant project to unlock the complete operations workbench.</p>
              <Button data-testid="create-first-project-btn" onClick={() => setShowWizard(true)}>
                <Plus className="w-5 h-5" /> Create project
              </Button>
            </section>
          ) : null}
        </main>
      </div>

      <ProjectWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onCreated={handleProjectCreated}
      />
    </div>
  );
};

export default Dashboard;
