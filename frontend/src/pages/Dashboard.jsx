import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  ChefHat, LayoutDashboard, Map, Hammer, Rocket, TrendingUp, FileText,
  Megaphone, Bell, Search, LogOut, Settings, User, Plus, ChevronRight, ChevronDown,
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user, setUser }) => {
  const [activeTab, setActiveTab] = useState("command");
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
      if (response.data.length > 0 && !activeProject) {
        setActiveProject(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  }, [activeProject]);

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

  const unreadCount = notifications.filter(n => !n.read).length;

  const modules = [
    { id: "command", icon: LayoutDashboard, label: "Command Center" },
    { id: "site", icon: Map, label: "Site Strategist" },
    { id: "ground", icon: Hammer, label: "Ground Up" },
    { id: "ops", icon: Rocket, label: "Ops Launchpad" },
    { id: "expansion", icon: TrendingUp, label: "Expansion Toolkit" },
    { id: "lease", icon: FileText, label: "Lease Negotiation" },
    { id: "marketeer", icon: Megaphone, label: "Marketeer Agent" },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f10]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-[#0f0f10]/95 backdrop-blur-md border-b border-zinc-800/50">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#d4af37] flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-zinc-900" />
              </div>
              <span className="text-lg font-heading font-bold text-zinc-100 hidden md:block">
                Restaurateur Pro
              </span>
            </div>

            {/* Module Tabs */}
            <nav className="hidden lg:flex items-center gap-1 bg-zinc-900/50 p-1 rounded-lg">
              {modules.map((module) => (
                <button
                  key={module.id}
                  data-testid={`tab-${module.id}`}
                  onClick={() => setActiveTab(module.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === module.id
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  }`}
                >
                  <module.icon className="w-4 h-4" />
                  <span className="hidden xl:inline">{module.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden md:flex relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                data-testid="global-search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700"
              />
            </div>

            {/* Notifications */}
            <div className="relative">
              <Button
                data-testid="notifications-btn"
                variant="ghost"
                size="icon"
                className="relative text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications && unreadCount > 0) {
                    markNotificationsRead();
                  }
                }}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-medium">
                    {unreadCount}
                  </span>
                )}
              </Button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                    <span className="font-medium text-zinc-100">Notifications</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 text-zinc-400 hover:text-zinc-100"
                      onClick={() => setShowNotifications(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <ScrollArea className="h-64">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-zinc-500 text-sm">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.notification_id}
                          className={`px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/50 ${
                            !notif.read ? "bg-zinc-800/30" : ""
                          }`}
                        >
                          <p className="text-sm text-zinc-200">{notif.title}</p>
                          <p className="text-xs text-zinc-500 mt-1">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  data-testid="user-menu-btn"
                  variant="ghost"
                  className="flex items-center gap-2 hover:bg-zinc-800 px-2"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.picture} alt={user?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-800 text-white text-sm">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm text-zinc-200">{user?.name}</span>
                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
                <div className="px-3 py-2 border-b border-zinc-800">
                  <p className="text-sm font-medium text-zinc-100">{user?.name}</p>
                  <p className="text-xs text-zinc-500">{user?.email}</p>
                </div>
                <DropdownMenuItem className="text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem
                  data-testid="logout-btn"
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 hover:bg-zinc-800 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Tab Nav */}
        <div className="lg:hidden px-4 pb-3 overflow-x-auto">
          <div className="flex items-center gap-2">
            {modules.map((module) => (
              <button
                key={module.id}
                data-testid={`mobile-tab-${module.id}`}
                onClick={() => setActiveTab(module.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === module.id
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <module.icon className="w-4 h-4" />
                {module.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Marketeer Agent works without a project */}
        {activeTab === "marketeer" && <MarketeerAgent />}

        {activeTab !== "marketeer" && activeProject ? (
          <>
            {activeTab === "command" && (
              <CommandCenter project={activeProject} onProjectUpdate={fetchProjects} />
            )}
            {activeTab === "site" && (
              <SiteStrategist project={activeProject} />
            )}
            {activeTab === "ground" && (
              <GroundUp project={activeProject} />
            )}
            {activeTab === "ops" && (
              <OpsLaunchpad project={activeProject} />
            )}
            {activeTab === "expansion" && (
              <ExpansionToolkit />
            )}
            {activeTab === "lease" && (
              <LeaseNegotiation project={activeProject} />
            )}
          </>
        ) : activeTab !== "marketeer" ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
              <ChefHat className="w-8 h-8 text-zinc-500" />
            </div>
            <h2 className="text-xl font-heading font-semibold text-zinc-100 mb-2">
              No Projects Yet
            </h2>
            <p className="text-zinc-500 mb-6">Create your first restaurant project to get started</p>
            <Button
              data-testid="create-first-project-btn"
              className="bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
