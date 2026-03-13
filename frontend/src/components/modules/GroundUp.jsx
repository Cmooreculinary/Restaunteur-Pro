import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Hammer, FileCheck, AlertCircle, CheckCircle, Clock, Package, Settings,
  Plus, MoreHorizontal, Building2, Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GroundUp = ({ project }) => {
  const [permits, setPermits] = useState([]);
  const [equipment, setEquipment] = useState([]);

  useEffect(() => {
    if (project?.project_id) {
      fetchPermits();
      fetchEquipment();
    }
  }, [project?.project_id]);

  const fetchPermits = async () => {
    try {
      const response = await axios.get(`${API}/permits?project_id=${project.project_id}`);
      setPermits(response.data);
    } catch (error) {
      console.error("Error fetching permits:", error);
    }
  };

  const fetchEquipment = async () => {
    try {
      const response = await axios.get(`${API}/equipment?project_id=${project.project_id}`);
      setEquipment(response.data);
    } catch (error) {
      console.error("Error fetching equipment:", error);
    }
  };

  // Sample permits if none exist
  const displayPermits = permits.length > 0 ? permits : [
    { permit_id: "1", name: "Health Department", status: "approved", submitted_date: "Nov 15" },
    { permit_id: "2", name: "Fire Marshal", status: "submitted", submitted_date: "Dec 1" },
    { permit_id: "3", name: "Liquor License", status: "pending", submitted_date: null },
    { permit_id: "4", name: "Building Permit", status: "approved", submitted_date: "Oct 20" },
    { permit_id: "5", name: "Sign Permit", status: "pending", submitted_date: null },
  ];

  // Sample equipment if none exist
  const displayEquipment = equipment.length > 0 ? equipment : [
    { equipment_id: "EQ-001", name: "6-Burner Gas Range", specs: "36\" Commercial Grade", status: "delivered" },
    { equipment_id: "EQ-002", name: "Walk-in Cooler", specs: "8' x 10' - 35°F", status: "ordered" },
    { equipment_id: "EQ-003", name: "Convection Oven", specs: "Double Stack - Electric", status: "installed" },
    { equipment_id: "EQ-004", name: "Dish Machine", specs: "High-Temp Commercial", status: "pending" },
    { equipment_id: "EQ-005", name: "Prep Tables", specs: "72\" Stainless Steel x4", status: "delivered" },
    { equipment_id: "EQ-006", name: "Hood System", specs: "14' Type I w/ Suppression", status: "installed" },
  ];

  const getPermitIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "submitted":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "rejected":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getPermitBadge = (status) => {
    switch (status) {
      case "approved":
        return <Badge className="badge-green">Approved</Badge>;
      case "submitted":
        return <Badge className="badge-blue">Submitted</Badge>;
      case "rejected":
        return <Badge className="badge-fire">Rejected</Badge>;
      default:
        return <Badge className="badge-amber">Pending</Badge>;
    }
  };

  const getEquipmentStatus = (status) => {
    switch (status) {
      case "installed":
        return <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" /> Installed</span>;
      case "delivered":
        return <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500" /> Delivered</span>;
      case "ordered":
        return <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> Ordered</span>;
      default:
        return <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-zinc-500" /> Pending</span>;
    }
  };

  const approvedCount = displayPermits.filter(p => p.status === "approved").length;
  const permitProgress = (approvedCount / displayPermits.length) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="badge-gold">Construction Phase</Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-zinc-100">
            Ground Up
          </h1>
          <p className="text-zinc-400 mt-1">Floor plans, permits, and equipment planning</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Floor Plan Preview */}
        <Card className="bg-[#18181b] border-zinc-800/50 md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading text-zinc-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#d4af37]" />
              3D Floor Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-800 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1673197743194-e92cdeeee85a?w=800&h=450&fit=crop"
                alt="Floor Plan"
                className="w-full h-full object-cover opacity-70"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Button
                  data-testid="view-floor-plan-btn"
                  className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                >
                  <Image className="w-4 h-4 mr-2" />
                  View Full Plan
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="p-3 rounded-lg bg-zinc-900/50 text-center">
                <p className="text-lg font-bold text-zinc-100">2,800</p>
                <p className="text-xs text-zinc-500">Sq. Ft.</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900/50 text-center">
                <p className="text-lg font-bold text-zinc-100">65</p>
                <p className="text-xs text-zinc-500">Seats</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900/50 text-center">
                <p className="text-lg font-bold text-zinc-100">450</p>
                <p className="text-xs text-zinc-500">Kitchen Sq.Ft.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permit Compliance Tracker */}
        <Card className="bg-[#18181b] border-zinc-800/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-heading text-zinc-100 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald" />
                Permit Compliance
              </CardTitle>
              <span className="text-sm text-zinc-400">
                {approvedCount}/{displayPermits.length}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={permitProgress} className="h-2 bg-zinc-800 mb-4" />
            
            <div className="space-y-3">
              {displayPermits.map((permit) => (
                <div
                  key={permit.permit_id}
                  data-testid={`permit-${permit.permit_id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50"
                >
                  <div className="flex items-center gap-3">
                    {getPermitIcon(permit.status)}
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{permit.name}</p>
                      {permit.submitted_date && (
                        <p className="text-xs text-zinc-500">Submitted: {permit.submitted_date}</p>
                      )}
                    </div>
                  </div>
                  {getPermitBadge(permit.status)}
                </div>
              ))}
            </div>

            <Button
              data-testid="add-permit-btn"
              variant="outline"
              className="w-full mt-4 border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Permit
            </Button>
          </CardContent>
        </Card>

        {/* Kitchen Equipment Planner */}
        <Card className="bg-[#18181b] border-zinc-800/50 md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-heading text-zinc-100 flex items-center gap-2">
                <Settings className="w-5 h-5 text-azure" />
                Kitchen Equipment
              </CardTitle>
              <Button
                data-testid="add-equipment-btn"
                size="sm"
                className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-zinc-500">ID</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-zinc-500">Equipment</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-zinc-500">Specs</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-zinc-500">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayEquipment.map((item) => (
                    <TableRow
                      key={item.equipment_id}
                      data-testid={`equipment-${item.equipment_id}`}
                      className="border-zinc-800/50 hover:bg-zinc-900/50"
                    >
                      <TableCell className="text-xs font-mono text-zinc-500">{item.equipment_id}</TableCell>
                      <TableCell className="text-sm font-medium text-zinc-100">{item.name}</TableCell>
                      <TableCell className="text-sm text-zinc-400">{item.specs}</TableCell>
                      <TableCell className="text-sm text-zinc-300">{getEquipmentStatus(item.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GroundUp;
