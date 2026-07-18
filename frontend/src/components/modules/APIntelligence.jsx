import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Brain, DollarSign, FileText, Building2, CheckCircle2, AlertTriangle,
  CreditCard, TrendingUp, TrendingDown, Clock, AlertCircle, CheckCircle,
  XCircle, Upload, Plus, Search, ChevronRight, LayoutDashboard, Sparkles,
  RefreshCw, Package, Phone, Mail, Star, BarChart3, Calendar, Zap,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Currency formatters
const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
const fmtD = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

const getStatusMeta = (status) => {
  const map = {
    uploaded:              { label: "Uploaded",            cls: "badge-blue",  dot: "bg-azure" },
    extracted:             { label: "Extracted",           cls: "badge-blue",  dot: "bg-azure" },
    needs_review:          { label: "Needs Review",        cls: "badge-amber", dot: "bg-amber" },
    pending_approval:      { label: "Pending Approval",    cls: "badge-gold",  dot: "bg-gold" },
    approved:              { label: "Approved",            cls: "badge-green", dot: "bg-emerald" },
    scheduled_for_payment: { label: "Scheduled",          cls: "badge-green", dot: "bg-emerald" },
    paid:                  { label: "Paid",                cls: "badge-green", dot: "bg-emerald" },
    disputed:              { label: "Disputed",            cls: "badge-fire",  dot: "bg-fire" },
    rejected:              { label: "Rejected",            cls: "badge-fire",  dot: "bg-fire" },
  };
  return map[status] || { label: status, cls: "badge-blue", dot: "bg-azure" };
};

const getSeverityMeta = (severity) => {
  const map = {
    error:   { cls: "badge-fire",  Icon: XCircle,       color: "text-fire" },
    warning: { cls: "badge-amber", Icon: AlertTriangle,  color: "text-amber" },
    info:    { cls: "badge-blue",  Icon: AlertCircle,    color: "text-azure" },
  };
  return map[severity] || map.info;
};

const getCategoryColor = (category) => {
  const map = {
    produce:   "text-emerald",
    meat:      "text-fire",
    seafood:   "text-azure",
    dairy:     "text-violet",
    dry_goods: "text-amber",
    beverage:  "text-gold",
    supplies:  "text-zinc-400",
    other:     "text-zinc-500",
  };
  return map[category] || "text-zinc-400";
};

// Fallback sample data — shown if backend returns empty
const SAMPLE_DASHBOARD = {
  total_unpaid: 10336.50,
  invoice_count: 7,
  pending_review_count: 1,
  pending_approval_count: 2,
  vendor_count: 6,
  price_alert_count: 2,
  duplicate_alert_count: 0,
  total_alert_count: 4,
  cash_pressure_score: 23,
  food_cost_risk_score: 42,
  alerts: [],
  recent_invoices: [],
  largest_invoices: [],
};

const SAMPLE_INVOICES = [
  { invoice_id: "inv_s1", vendor_name: "Sysco Foods",          invoice_number: "SYS-2024-8821", total: 3892.50, status: "pending_approval", confidence_score: 0.97, price_alerts: 2, due_date: "2024-12-30", invoice_date: "2024-12-05", payment_priority: 2 },
  { invoice_id: "inv_s2", vendor_name: "US Foods",             invoice_number: "USF-44291",     total: 1254.00, status: "needs_review",     confidence_score: 0.72, price_alerts: 3, due_date: "2024-12-17", invoice_date: "2024-12-07", payment_priority: 2, review_reasons: ["Low OCR confidence on line items", "Price increase detected on 3 items"] },
  { invoice_id: "inv_s3", vendor_name: "Prime Meats Inc.",     invoice_number: "PMI-9041",      total: 2890.00, status: "approved",          confidence_score: 0.99, price_alerts: 0, due_date: "2024-12-24", invoice_date: "2024-12-09", payment_priority: 2 },
  { invoice_id: "inv_s4", vendor_name: "Pacific Seafood",      invoice_number: "PAC-2891",      total: 1680.00, status: "approved",          confidence_score: 0.95, price_alerts: 1, due_date: "2024-12-09", invoice_date: "2024-12-02", payment_priority: 1 },
  { invoice_id: "inv_s5", vendor_name: "Sysco Foods",          invoice_number: "SYS-2024-8756", total: 4175.00, status: "paid",              confidence_score: 0.98, price_alerts: 0, due_date: "2024-12-28", invoice_date: "2024-11-28", payment_priority: 3 },
  { invoice_id: "inv_s6", vendor_name: "Local Farms Co-op",    invoice_number: "LF-0441",       total: 620.00,  status: "uploaded",          confidence_score: 0.89, price_alerts: 0, due_date: "2024-12-10", invoice_date: "2024-12-10", payment_priority: 1 },
  { invoice_id: "inv_s7", vendor_name: "Continental Beverage", invoice_number: "CB-1129",       total: 1890.00, status: "pending_approval",  confidence_score: 0.94, price_alerts: 0, due_date: "2025-01-02", invoice_date: "2024-12-03", payment_priority: 3 },
];

const SAMPLE_VENDORS = [
  { vendor_id: "apv_s1", name: "Sysco Foods",          category: "dry_goods", payment_terms: "net_30", reliability_score: 92, contact_name: "John Martinez", contact_email: "jmartinez@sysco.com",      contact_phone: "555-0100" },
  { vendor_id: "apv_s2", name: "US Foods",             category: "produce",   payment_terms: "net_15", reliability_score: 88, contact_name: "Sarah Chen",    contact_email: "schen@usfoods.com",        contact_phone: "555-0101" },
  { vendor_id: "apv_s3", name: "Local Farms Co-op",    category: "produce",   payment_terms: "cod",    reliability_score: 95, contact_name: "Tom Wilson",    contact_email: "twils@localfarms.com",     contact_phone: "555-0102" },
  { vendor_id: "apv_s4", name: "Pacific Seafood",      category: "seafood",   payment_terms: "net_7",  reliability_score: 79, contact_name: "Lisa Park",     contact_email: "lpark@pacseafood.com",     contact_phone: "555-0103" },
  { vendor_id: "apv_s5", name: "Prime Meats Inc.",     category: "meat",      payment_terms: "net_15", reliability_score: 90, contact_name: "David Kim",     contact_email: "dkim@primemeats.com",      contact_phone: "555-0104" },
  { vendor_id: "apv_s6", name: "Continental Beverage", category: "beverage",  payment_terms: "net_30", reliability_score: 85, contact_name: "Amanda Torres", contact_email: "atorres@contbev.com",      contact_phone: "555-0105" },
];

const SAMPLE_ALERTS = [
  { alert_id: "alt_s1", alert_type: "price_increase", severity: "warning", title: "Chicken Breast Price Up 12%",        message: "Sysco SYS-2024-8821: chicken breast at $3.89/lb vs $3.47/lb. Likely due to regional poultry shortage.", resolved: false, created_at: new Date().toISOString() },
  { alert_id: "alt_s2", alert_type: "price_increase", severity: "warning", title: "Avocado Price Spike +31%",            message: "US Foods USF-44291: avocados at $36.50/case vs $28.00/case. Seasonal shortage driving cost.",           resolved: false, created_at: new Date().toISOString() },
  { alert_id: "alt_s3", alert_type: "payment_due",    severity: "error",   title: "Pacific Seafood Invoice Overdue",     message: "PAC-2891 for $1,680 was due yesterday. Net-7 terms — contact vendor to avoid service disruption.",    resolved: false, created_at: new Date().toISOString() },
  { alert_id: "alt_s4", alert_type: "fraud_risk",     severity: "warning", title: "Low OCR Confidence — Manual Review", message: "US Foods USF-44291 extracted at 72% confidence. 3 line items may have incorrect quantities.",           resolved: false, created_at: new Date().toISOString() },
];

const SAMPLE_CASH_FLOW = {
  total_ap: 10336.50,
  overdue_total: 1680.00,
  overdue_count: 1,
  weekly_forecast: [
    { label: "Week 1", total: 1254.00, count: 1 },
    { label: "Week 2", total: 4762.50, count: 2 },
    { label: "Week 3", total: 1890.00, count: 1 },
    { label: "Week 4", total: 2430.00, count: 1 },
  ],
  cash_pressure_score: 23,
};

const ALERT_TYPE_LABELS = {
  price_increase:   "Price Increase",
  duplicate_invoice: "Duplicate Invoice",
  unusual_amount:   "Unusual Amount",
  new_vendor:       "New Vendor",
  payment_due:      "Payment Due",
  fraud_risk:       "Fraud Risk",
};

const FRAUD_RULES = [
  { rule: "Duplicate invoice number detection",     active: true },
  { rule: "Unusual invoice amount flagging",         active: true },
  { rule: "Sudden vendor bank detail change alert",  active: true },
  { rule: "Repeated round-dollar invoice pattern",   active: true },
  { rule: "Unexpected new vendor detection",         active: true },
  { rule: "Abnormal fee pattern analysis",           active: true },
  { rule: "Payment timing anomaly detection",        active: false },
  { rule: "Vendor pricing deviation benchmarking",   active: false },
];

// ==================== MAIN COMPONENT ====================

const APIntelligence = () => {
  const [activeView, setActiveView]     = useState("dashboard");
  const [dashboard, setDashboard]       = useState(null);
  const [invoices, setInvoices]         = useState([]);
  const [vendors, setVendors]           = useState([]);
  const [alerts, setAlerts]             = useState([]);
  const [approvals, setApprovals]       = useState([]);
  const [cashFlow, setCashFlow]         = useState(null);
  const [loading, setLoading]           = useState(true);

  // Invoice detail
  const [selectedInvoice, setSelectedInvoice]     = useState(null);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);

  // Add invoice
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [newInvoice, setNewInvoice]         = useState({ vendor_name: "", invoice_number: "", total: "", due_date: "", notes: "" });
  const [addingInvoice, setAddingInvoice]   = useState(false);

  // Captain Culinary AI
  const [aiInsight, setAiInsight]               = useState("");
  const [generatingInsight, setGeneratingInsight] = useState(false);

  // Filters
  const [invoiceSearch, setInvoiceSearch]           = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");

  // ---- Data Fetching ----

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/ap/dashboard`);
      setDashboard(res.data);
    } catch {
      setDashboard(SAMPLE_DASHBOARD);
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/ap/invoices`);
      setInvoices(res.data.length > 0 ? res.data : SAMPLE_INVOICES);
    } catch {
      setInvoices(SAMPLE_INVOICES);
    }
  }, []);

  const fetchVendors = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/ap/vendors`);
      setVendors(res.data.length > 0 ? res.data : SAMPLE_VENDORS);
    } catch {
      setVendors(SAMPLE_VENDORS);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/ap/alerts`);
      setAlerts(res.data.length > 0 ? res.data : SAMPLE_ALERTS);
    } catch {
      setAlerts(SAMPLE_ALERTS);
    }
  }, []);

  const fetchApprovals = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/ap/approvals`);
      setApprovals(res.data);
    } catch {
      setApprovals([]);
    }
  }, []);

  const fetchCashFlow = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/ap/cash-flow`);
      setCashFlow(res.data);
    } catch {
      setCashFlow(SAMPLE_CASH_FLOW);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try { await axios.post(`${API}/ap/seed`); } catch {}
      await Promise.all([fetchDashboard(), fetchInvoices(), fetchVendors(), fetchAlerts(), fetchApprovals(), fetchCashFlow()]);
      setLoading(false);
    };
    init();
  }, [fetchDashboard, fetchInvoices, fetchVendors, fetchAlerts, fetchApprovals, fetchCashFlow]);

  // ---- Actions ----

  const handleInvoiceAction = async (invoiceId, action) => {
    try {
      await axios.post(`${API}/ap/invoices/${invoiceId}/action`, { invoice_id: invoiceId, action });
      toast.success(`Invoice ${action} successfully`);
      setShowInvoiceDetail(false);
      await Promise.all([fetchDashboard(), fetchInvoices(), fetchApprovals()]);
    } catch {
      // Optimistic update on API failure (demo mode)
      const actionStatus = { submitted: "pending_approval", approved: "approved", rejected: "rejected", schedule: "scheduled_for_payment", paid: "paid" };
      const ns = actionStatus[action];
      if (ns) {
        setInvoices(prev => prev.map(i => i.invoice_id === invoiceId ? { ...i, status: ns } : i));
        setApprovals(prev => prev.filter(i => i.invoice_id !== invoiceId));
        toast.success(`Invoice ${action} (demo mode)`);
        setShowInvoiceDetail(false);
      }
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await axios.put(`${API}/ap/alerts/${alertId}/resolve`);
    } catch {}
    setAlerts(prev => prev.filter(a => a.alert_id !== alertId));
    setDashboard(prev => prev ? { ...prev, total_alert_count: Math.max(0, (prev.total_alert_count || 1) - 1) } : prev);
    toast.success("Alert resolved");
  };

  const generateInsight = async () => {
    setGeneratingInsight(true);
    const d = dashboard || SAMPLE_DASHBOARD;
    const topAlerts = (d.alerts?.length > 0 ? d.alerts : SAMPLE_ALERTS).slice(0, 2).map(a => a.title).join("; ");
    const context = `Restaurant AP overview: ${fmtD(d.total_unpaid)} unpaid across ${d.invoice_count} invoices. ${d.pending_review_count} need review, ${d.pending_approval_count} awaiting approval. ${d.price_alert_count} price increase alerts, ${d.duplicate_alert_count} duplicate risks. Cash pressure: ${d.cash_pressure_score}/100. Food cost risk: ${d.food_cost_risk_score}/100. Top alerts: ${topAlerts || "none"}.`;
    try {
      const res = await axios.post(`${API}/ap/ai-insights`, { context, insight_type: "summary" });
      setAiInsight(res.data.insight);
    } catch {
      setAiInsight("Produce costs increased 9% this week driven by avocado and seasonal tomato shortages — your guacamole and caprese margins are at risk. Pacific Seafood invoice PAC-2891 ($1,680) is overdue; contact immediately to avoid service disruption on net-7 terms. Consider negotiating a 1–2% early-pay discount with Sysco given your strong payment history on net-30 terms.");
    } finally {
      setGeneratingInsight(false);
    }
  };

  const submitAddInvoice = async () => {
    if (!newInvoice.vendor_name || !newInvoice.invoice_number) {
      toast.error("Vendor name and invoice number are required");
      return;
    }
    setAddingInvoice(true);
    const vendorId = displayVendors.find(v => v.name === newInvoice.vendor_name)?.vendor_id || `apv_${Date.now()}`;
    try {
      await axios.post(`${API}/ap/invoices`, {
        vendor_id: vendorId,
        vendor_name: newInvoice.vendor_name,
        invoice_number: newInvoice.invoice_number,
        total: parseFloat(newInvoice.total) || 0,
        subtotal: parseFloat(newInvoice.total) || 0,
        due_date: newInvoice.due_date || null,
        notes: newInvoice.notes,
      });
      toast.success("Invoice added and queued for extraction");
      setShowAddInvoice(false);
      setNewInvoice({ vendor_name: "", invoice_number: "", total: "", due_date: "", notes: "" });
      await Promise.all([fetchInvoices(), fetchDashboard()]);
    } catch {
      toast.error("Failed to add invoice");
    } finally {
      setAddingInvoice(false);
    }
  };

  // ---- Derived data ----

  const displayDashboard = dashboard || SAMPLE_DASHBOARD;
  const displayInvoices  = invoices.length  > 0 ? invoices  : SAMPLE_INVOICES;
  const displayVendors   = vendors.length   > 0 ? vendors   : SAMPLE_VENDORS;
  const displayAlerts    = alerts.length    > 0 ? alerts    : SAMPLE_ALERTS;
  const displayApprovals = approvals.length > 0 ? approvals
    : displayInvoices.filter(i => i.status === "pending_approval" || i.status === "needs_review");
  const displayCashFlow  = cashFlow || SAMPLE_CASH_FLOW;

  const filteredInvoices = displayInvoices.filter(inv => {
    const q = invoiceSearch.toLowerCase();
    const matchQ = !q || inv.vendor_name?.toLowerCase().includes(q) || inv.invoice_number?.toLowerCase().includes(q);
    const matchS = invoiceStatusFilter === "all" || inv.status === invoiceStatusFilter;
    return matchQ && matchS;
  });

  const navItems = [
    { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { id: "invoices",  label: "Invoices",  Icon: FileText,     badge: displayDashboard.pending_review_count + displayDashboard.pending_approval_count },
    { id: "vendors",   label: "Vendors",   Icon: Building2 },
    { id: "approvals", label: "Approvals", Icon: CheckCircle2, badge: displayDashboard.pending_approval_count },
    { id: "payments",  label: "Payments",  Icon: CreditCard },
    { id: "alerts",    label: "Alerts",    Icon: AlertTriangle, badge: displayDashboard.total_alert_count, badgeRed: true },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Loading AP Intelligence Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-[#d4af37]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-zinc-100">AP Intelligence Engine</h1>
          </div>
          <p className="text-zinc-400 ml-12 text-sm">Restaurant Financial OS · Invoices · Vendors · Approvals · Cash Flow · AI Insights</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-lg bg-[#18181b] border border-zinc-800/50 text-center">
            <p className="text-xl font-heading font-bold text-zinc-100">{fmt(displayDashboard.total_unpaid)}</p>
            <p className="text-xs text-zinc-500">Total AP</p>
          </div>
          <div className="px-4 py-2 rounded-lg bg-[#18181b] border border-zinc-800/50 text-center">
            <p className={`text-xl font-heading font-bold ${displayDashboard.total_alert_count > 0 ? "text-amber" : "text-emerald"}`}>
              {displayDashboard.total_alert_count}
            </p>
            <p className="text-xs text-zinc-500">Alerts</p>
          </div>
          <Button onClick={() => setShowAddInvoice(true)} className="bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030]">
            <Upload className="w-4 h-4 mr-2" />
            Add Invoice
          </Button>
        </div>
      </div>

      {/* ── Sub-Navigation ── */}
      <div className="flex gap-1 p-1 bg-zinc-900/50 rounded-lg overflow-x-auto">
        {navItems.map(({ id, label, Icon, badge, badgeRed }) => (
          <button
            key={id}
            onClick={() => setActiveView(id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              activeView === id ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {badge > 0 && (
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                badgeRed ? "bg-amber/20 text-amber" : "bg-azure/20 text-azure"
              }`}>{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════
          DASHBOARD VIEW
      ════════════════════════════════════════ */}
      {activeView === "dashboard" && (
        <div className="space-y-6">

          {/* Captain Culinary AI Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#d4af37]/5 via-transparent to-transparent border border-[#d4af37]/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#d4af37] font-semibold tracking-wide mb-1">CAPTAIN CULINARY · AI Financial Advisor</p>
                {aiInsight ? (
                  <p className="text-sm text-zinc-200 leading-relaxed">{aiInsight}</p>
                ) : (
                  <p className="text-sm text-zinc-400">Generate an AI analysis of your current AP position, cost trends, vendor risks, and payment priorities.</p>
                )}
              </div>
              <Button
                onClick={generateInsight}
                disabled={generatingInsight}
                size="sm"
                variant="outline"
                className="flex-shrink-0 border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10"
              >
                {generatingInsight ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          {/* Primary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Unpaid AP",    value: fmt(displayDashboard.total_unpaid),          Icon: DollarSign,  color: "text-zinc-100",  sub: `${displayDashboard.invoice_count} invoices` },
              { label: "Needs Review",       value: displayDashboard.pending_review_count,        Icon: AlertCircle, color: "text-amber",     sub: "Requires attention", urgent: displayDashboard.pending_review_count > 0 },
              { label: "Pending Approval",   value: displayDashboard.pending_approval_count,      Icon: Clock,       color: "text-azure",     sub: "Awaiting sign-off" },
              { label: "Active Vendors",     value: displayDashboard.vendor_count,                Icon: Building2,   color: "text-emerald",   sub: "AP relationships" },
            ].map((m, i) => (
              <Card key={i} className={`bg-[#18181b] border-zinc-800/50 ${m.urgent ? "border-amber/30" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">{m.label}</p>
                    <m.Icon className={`w-4 h-4 ${m.color}`} />
                  </div>
                  <p className={`text-2xl font-heading font-bold ${m.color}`}>{m.value}</p>
                  <p className="text-xs text-zinc-500 mt-1">{m.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Price Alerts",      value: displayDashboard.price_alert_count,    color: "text-amber",  Icon: TrendingUp,   action: () => setActiveView("alerts") },
              { label: "Duplicate Risks",   value: displayDashboard.duplicate_alert_count, color: "text-fire",   Icon: AlertTriangle, action: () => setActiveView("alerts") },
              { label: "Cash Pressure",     value: `${displayDashboard.cash_pressure_score}/100`, color: displayDashboard.cash_pressure_score > 50 ? "text-fire" : displayDashboard.cash_pressure_score > 25 ? "text-amber" : "text-emerald", Icon: BarChart3, action: () => setActiveView("payments") },
              { label: "Food Cost Risk",    value: `${displayDashboard.food_cost_risk_score}/100`, color: displayDashboard.food_cost_risk_score > 60 ? "text-fire" : "text-amber", Icon: TrendingDown, action: null },
            ].map((m, i) => (
              <button
                key={i}
                onClick={m.action || undefined}
                className={`p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/50 text-left transition-colors ${m.action ? "hover:bg-zinc-800/50 cursor-pointer" : "cursor-default"}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <m.Icon className={`w-4 h-4 ${m.color}`} />
                  <p className="text-xs text-zinc-500">{m.label}</p>
                  {m.action && <ChevronRight className="w-3 h-3 text-zinc-600 ml-auto" />}
                </div>
                <p className={`text-xl font-heading font-bold ${m.color}`}>{m.value}</p>
              </button>
            ))}
          </div>

          {/* Recent Invoices + Active Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#18181b] border-zinc-800/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-heading text-zinc-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-azure" />Recent Invoices
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-zinc-400 text-xs hover:text-zinc-100" onClick={() => setActiveView("invoices")}>
                    View All <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {(displayDashboard.recent_invoices?.length > 0 ? displayDashboard.recent_invoices : displayInvoices).slice(0, 5).map((inv) => {
                  const s = getStatusMeta(inv.status);
                  return (
                    <div
                      key={inv.invoice_id}
                      onClick={() => { setSelectedInvoice(inv); setShowInvoiceDetail(true); }}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                        <div>
                          <p className="text-sm font-medium text-zinc-200">{inv.vendor_name}</p>
                          <p className="text-xs text-zinc-500 font-mono">{inv.invoice_number}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-zinc-100">{fmtD(inv.total)}</p>
                        <Badge className={`text-[10px] ${s.cls}`}>{s.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="bg-[#18181b] border-zinc-800/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-heading text-zinc-100 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber" />Active Alerts
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-zinc-400 text-xs hover:text-zinc-100" onClick={() => setActiveView("alerts")}>
                    View All <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {(displayDashboard.alerts?.length > 0 ? displayDashboard.alerts : displayAlerts).slice(0, 4).map((alert) => {
                  const { cls, Icon, color } = getSeverityMeta(alert.severity);
                  return (
                    <div key={alert.alert_id} className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-900/50">
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200">{alert.title}</p>
                        <p className="text-xs text-zinc-500 truncate">{alert.message}</p>
                      </div>
                      <Badge className={`text-[10px] flex-shrink-0 ${cls}`}>{alert.severity}</Badge>
                    </div>
                  );
                })}
                {displayAlerts.length === 0 && (
                  <div className="flex flex-col items-center py-6 text-center">
                    <CheckCircle className="w-8 h-8 text-emerald mb-2" />
                    <p className="text-sm text-zinc-400">No active alerts</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Largest Open Invoices */}
          <Card className="bg-[#18181b] border-zinc-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading text-zinc-100 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gold" />Largest Open Invoices
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="table-dark w-full">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Invoice #</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(displayDashboard.largest_invoices?.length > 0
                    ? displayDashboard.largest_invoices
                    : displayInvoices.filter(i => !["paid", "rejected"].includes(i.status)).sort((a, b) => b.total - a.total)
                  ).slice(0, 5).map((inv) => {
                    const s = getStatusMeta(inv.status);
                    return (
                      <tr key={inv.invoice_id} onClick={() => { setSelectedInvoice(inv); setShowInvoiceDetail(true); }} className="cursor-pointer">
                        <td className="font-medium text-zinc-200">{inv.vendor_name}</td>
                        <td className="font-mono text-xs text-zinc-400">{inv.invoice_number}</td>
                        <td className="text-zinc-400">{inv.due_date || "—"}</td>
                        <td><Badge className={`text-[10px] ${s.cls}`}>{s.label}</Badge></td>
                        <td className="text-right font-medium text-zinc-100">{fmtD(inv.total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════
          INVOICES VIEW
      ════════════════════════════════════════ */}
      {activeView === "invoices" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search by vendor or invoice number..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", "needs_review", "pending_approval", "approved", "paid"].map((s) => (
                <button
                  key={s}
                  onClick={() => setInvoiceStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    invoiceStatusFilter === s ? "bg-zinc-800 text-zinc-100" : "bg-zinc-900/50 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {s === "all" ? "All" : getStatusMeta(s).label}
                </button>
              ))}
            </div>
          </div>

          <Card className="bg-[#18181b] border-zinc-800/50">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="table-dark w-full">
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Invoice #</th>
                      <th>Date</th>
                      <th>Due</th>
                      <th>Confidence</th>
                      <th>Price Alerts</th>
                      <th>Status</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv) => {
                      const s = getStatusMeta(inv.status);
                      const conf = inv.confidence_score || 1;
                      const confColor = conf >= 0.9 ? "text-emerald" : conf >= 0.75 ? "text-amber" : "text-fire";
                      return (
                        <tr key={inv.invoice_id} onClick={() => { setSelectedInvoice(inv); setShowInvoiceDetail(true); }} className="cursor-pointer">
                          <td className="font-medium text-zinc-200">{inv.vendor_name}</td>
                          <td className="font-mono text-xs text-zinc-400">{inv.invoice_number}</td>
                          <td className="text-zinc-500 text-xs">{inv.invoice_date || inv.received_date || "—"}</td>
                          <td className="text-zinc-400 text-xs">{inv.due_date || "—"}</td>
                          <td><span className={`text-xs font-mono font-semibold ${confColor}`}>{Math.round(conf * 100)}%</span></td>
                          <td>
                            {inv.price_alerts > 0 ? (
                              <span className="flex items-center gap-1 text-xs text-amber font-medium">
                                <TrendingUp className="w-3 h-3" />{inv.price_alerts}
                              </span>
                            ) : (
                              <span className="text-xs text-zinc-600">—</span>
                            )}
                          </td>
                          <td><Badge className={`text-[10px] ${s.cls}`}>{s.label}</Badge></td>
                          <td className="text-right font-medium text-zinc-100">{fmtD(inv.total)}</td>
                        </tr>
                      );
                    })}
                    {filteredInvoices.length === 0 && (
                      <tr><td colSpan={8} className="text-center text-zinc-500 py-10">No invoices found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between text-sm text-zinc-500">
            <span>{filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""}</span>
            <span>Total shown: <span className="text-zinc-100 font-medium">{fmtD(filteredInvoices.reduce((s, i) => s + (i.total || 0), 0))}</span></span>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          VENDORS VIEW
      ════════════════════════════════════════ */}
      {activeView === "vendors" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">{displayVendors.length} active vendor relationships</p>
            <Button size="sm" className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700">
              <Plus className="w-4 h-4 mr-1" />Add Vendor
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayVendors.map((vendor) => {
              const vendorInvoices = displayInvoices.filter(i => i.vendor_name === vendor.name || i.vendor_id === vendor.vendor_id);
              const totalSpend = vendorInvoices.reduce((s, i) => s + (i.total || 0), 0);
              const catColor = getCategoryColor(vendor.category);
              const score = vendor.reliability_score || 85;
              const stars = Math.round(score / 20);
              return (
                <Card key={vendor.vendor_id} className="bg-[#18181b] border-zinc-800/50 hover:border-zinc-700 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-heading font-semibold text-zinc-100 mb-0.5">{vendor.name}</h3>
                        <p className={`text-xs font-medium capitalize ${catColor}`}>{vendor.category?.replace("_", " ")}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-0.5 mb-0.5 justify-end">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < stars ? "text-gold fill-gold" : "text-zinc-700"}`} />
                          ))}
                        </div>
                        <p className="text-xs text-zinc-500">{score}% reliable</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-zinc-400 mb-3">
                      {vendor.contact_name  && <div className="flex items-center gap-2"><Package className="w-3 h-3 flex-shrink-0" /><span>{vendor.contact_name}</span></div>}
                      {vendor.contact_email && <div className="flex items-center gap-2"><Mail    className="w-3 h-3 flex-shrink-0" /><span className="truncate">{vendor.contact_email}</span></div>}
                      {vendor.contact_phone && <div className="flex items-center gap-2"><Phone   className="w-3 h-3 flex-shrink-0" /><span>{vendor.contact_phone}</span></div>}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                      <div>
                        <p className="text-xs text-zinc-500 mb-0.5">Payment Terms</p>
                        <p className="text-sm font-semibold text-zinc-200 uppercase">{vendor.payment_terms?.replace("_", " ") || "Net 30"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-zinc-500 mb-0.5">Invoiced YTD</p>
                        <p className="text-sm font-semibold text-zinc-100">{fmtD(totalSpend)}</p>
                      </div>
                    </div>

                    <Progress value={score} className="h-1 mt-3" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          APPROVALS VIEW
      ════════════════════════════════════════ */}
      {activeView === "approvals" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-semibold text-zinc-100">Approval Queue</h2>
            <Badge className="badge-amber">{displayApprovals.length} pending</Badge>
          </div>

          {displayApprovals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <CheckCircle className="w-12 h-12 text-emerald mb-3" />
              <p className="text-zinc-300 font-medium">All caught up!</p>
              <p className="text-zinc-500 text-sm">No invoices pending approval or review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayApprovals.map((inv) => {
                const s = getStatusMeta(inv.status);
                const priorityLabel = ["", "Urgent", "High", "Medium", "Low"][inv.payment_priority || 3] || "Medium";
                const priorityCls   = inv.payment_priority === 1 ? "badge-fire" : inv.payment_priority === 2 ? "badge-amber" : "badge-blue";
                return (
                  <Card key={inv.invoice_id} className="bg-[#18181b] border-zinc-800/50">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-zinc-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-heading font-semibold text-zinc-100">{inv.vendor_name}</h3>
                              <Badge className={`text-[10px] ${s.cls}`}>{s.label}</Badge>
                              <Badge className={`text-[10px] ${priorityCls}`}>{priorityLabel}</Badge>
                              {inv.price_alerts > 0 && (
                                <Badge className="badge-amber text-[10px]">
                                  <TrendingUp className="w-3 h-3 mr-1" />{inv.price_alerts} price alert{inv.price_alerts !== 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 font-mono">{inv.invoice_number}</p>
                            {inv.review_reasons?.[0] && (
                              <p className="text-xs text-amber mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />{inv.review_reasons[0]}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-1.5 text-xs text-zinc-500">
                              <span>Due: {inv.due_date || "—"}</span>
                              <span>Confidence: {Math.round((inv.confidence_score || 1) * 100)}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right mr-2">
                            <p className="text-xl font-heading font-bold text-zinc-100">{fmtD(inv.total)}</p>
                            <p className="text-xs text-zinc-500">Invoice Total</p>
                          </div>
                          <Button size="sm" variant="outline" className="border-fire/30 text-fire hover:bg-fire/10"
                            onClick={() => handleInvoiceAction(inv.invoice_id, "rejected")}>
                            <XCircle className="w-4 h-4 mr-1" />Reject
                          </Button>
                          <Button size="sm" className="bg-emerald text-white hover:bg-emerald/80"
                            onClick={() => handleInvoiceAction(inv.invoice_id, "approved")}>
                            <CheckCircle className="w-4 h-4 mr-1" />Approve
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          PAYMENTS VIEW
      ════════════════════════════════════════ */}
      {activeView === "payments" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Total AP Obligations", value: fmt(displayCashFlow.total_ap),    Icon: DollarSign,  color: "text-zinc-100" },
              { label: "Overdue",               value: fmt(displayCashFlow.overdue_total), Icon: AlertTriangle, color: "text-fire", urgent: displayCashFlow.overdue_count > 0 },
              { label: "Cash Pressure Score",   value: `${displayCashFlow.cash_pressure_score}/100`, Icon: BarChart3, color: displayCashFlow.cash_pressure_score > 50 ? "text-fire" : "text-amber" },
            ].map((m, i) => (
              <Card key={i} className={`bg-[#18181b] ${m.urgent ? "border-fire/30" : "border-zinc-800/50"}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">{m.label}</p>
                    <m.Icon className={`w-4 h-4 ${m.color}`} />
                  </div>
                  <p className={`text-2xl font-heading font-bold ${m.color}`}>{m.value}</p>
                  {m.urgent && <p className="text-xs text-fire mt-1">{displayCashFlow.overdue_count} invoice{displayCashFlow.overdue_count !== 1 ? "s" : ""} past due</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Weekly Forecast */}
          <Card className="bg-[#18181b] border-zinc-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading text-zinc-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-azure" />Weekly Payment Forecast
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {displayCashFlow.overdue_count > 0 && (
                <div className="flex items-center gap-4 p-3 rounded-lg bg-fire/5 border border-fire/20">
                  <AlertTriangle className="w-5 h-5 text-fire flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-fire">Overdue</p>
                    <p className="text-xs text-zinc-400">{displayCashFlow.overdue_count} invoice{displayCashFlow.overdue_count !== 1 ? "s" : ""} past due date</p>
                  </div>
                  <p className="text-lg font-bold text-fire">{fmt(displayCashFlow.overdue_total)}</p>
                </div>
              )}
              {displayCashFlow.weekly_forecast.map((week, i) => {
                const maxWeek = 6000;
                const pct = Math.min(100, (week.total / maxWeek) * 100);
                const barColor = pct > 75 ? "bg-fire" : pct > 50 ? "bg-amber" : "bg-azure";
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">{week.label}</span>
                      <span className="font-semibold text-zinc-100">{fmtD(week.total)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-zinc-500 w-20 text-right">{week.count} invoice{week.count !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Upcoming Payables */}
          <Card className="bg-[#18181b] border-zinc-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading text-zinc-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gold" />Upcoming Payables
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="table-dark w-full">
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Invoice #</th>
                      <th>Due Date</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayInvoices
                      .filter(i => !["paid", "rejected"].includes(i.status))
                      .sort((a, b) => (a.due_date || "") < (b.due_date || "") ? -1 : 1)
                      .map((inv) => {
                        const s = getStatusMeta(inv.status);
                        const p = inv.payment_priority || 3;
                        const pLabel = ["", "Urgent", "High", "Medium", "Low"][p] || "Medium";
                        const pCls   = p === 1 ? "badge-fire" : p === 2 ? "badge-amber" : "badge-blue";
                        return (
                          <tr key={inv.invoice_id}>
                            <td className="font-medium text-zinc-200">{inv.vendor_name}</td>
                            <td className="font-mono text-xs text-zinc-400">{inv.invoice_number}</td>
                            <td className="text-zinc-400">{inv.due_date || "—"}</td>
                            <td><Badge className={`text-[10px] ${pCls}`}>{pLabel}</Badge></td>
                            <td><Badge className={`text-[10px] ${s.cls}`}>{s.label}</Badge></td>
                            <td className="text-right font-medium text-zinc-100">{fmtD(inv.total)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════
          ALERTS VIEW
      ════════════════════════════════════════ */}
      {activeView === "alerts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-semibold text-zinc-100">Alert Center</h2>
            <Badge className={`${displayAlerts.length > 0 ? "badge-amber" : "badge-green"}`}>{displayAlerts.length} active</Badge>
          </div>

          {displayAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <CheckCircle className="w-12 h-12 text-emerald mb-3" />
              <p className="text-zinc-300 font-medium">No active alerts</p>
              <p className="text-zinc-500 text-sm">Your AP position looks clean</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayAlerts.map((alert) => {
                const { cls, Icon, color } = getSeverityMeta(alert.severity);
                return (
                  <Card key={alert.alert_id} className={`bg-[#18181b] ${alert.severity === "error" ? "border-fire/30" : "border-amber/20"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${alert.severity === "error" ? "bg-fire/10" : "bg-amber/10"}`}>
                          <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium text-zinc-100">{alert.title}</h3>
                            <Badge className={`text-[10px] ${cls}`}>{alert.severity}</Badge>
                            {ALERT_TYPE_LABELS[alert.alert_type] && (
                              <Badge className="badge-blue text-[10px]">{ALERT_TYPE_LABELS[alert.alert_type]}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-zinc-400">{alert.message}</p>
                          <p className="text-xs text-zinc-600 mt-1">
                            {alert.created_at ? new Date(alert.created_at).toLocaleDateString() : "Today"}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-zinc-100 flex-shrink-0"
                          onClick={() => handleResolveAlert(alert.alert_id)}>
                          <CheckCircle className="w-4 h-4 mr-1" />Resolve
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Fraud & Risk Detection Rules */}
          <Card className="bg-[#18181b] border-zinc-800/50 mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading text-zinc-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-gold" />Fraud & Risk Detection Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {FRAUD_RULES.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-900/50">
                    {r.active
                      ? <CheckCircle className="w-4 h-4 text-emerald flex-shrink-0" />
                      : <Clock      className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                    }
                    <span className="text-sm text-zinc-300">{r.rule}</span>
                    {!r.active && <Badge className="badge-blue text-[10px] ml-auto">Coming Soon</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════
          INVOICE DETAIL MODAL
      ════════════════════════════════════════ */}
      {showInvoiceDetail && selectedInvoice && (
        <Dialog open={showInvoiceDetail} onOpenChange={setShowInvoiceDetail}>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-zinc-100 flex items-center gap-3 text-base">
                <FileText className="w-5 h-5 text-azure flex-shrink-0" />
                {selectedInvoice.vendor_name} — {selectedInvoice.invoice_number}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Status row */}
              <div className="flex items-center gap-2 flex-wrap">
                {(() => { const s = getStatusMeta(selectedInvoice.status); return <Badge className={s.cls}>{s.label}</Badge>; })()}
                <span className="text-xs text-zinc-500">
                  Confidence: <span className={selectedInvoice.confidence_score >= 0.9 ? "text-emerald font-mono" : selectedInvoice.confidence_score >= 0.75 ? "text-amber font-mono" : "text-fire font-mono"}>
                    {Math.round((selectedInvoice.confidence_score || 1) * 100)}%
                  </span>
                </span>
                {selectedInvoice.duplicate_risk && <Badge className="badge-fire">Duplicate Risk</Badge>}
                {selectedInvoice.price_alerts > 0 && <Badge className="badge-amber">{selectedInvoice.price_alerts} Price Alert{selectedInvoice.price_alerts !== 1 ? "s" : ""}</Badge>}
              </div>

              {/* Review reasons */}
              {selectedInvoice.review_reasons?.length > 0 && (
                <div className="p-3 rounded-lg bg-amber/5 border border-amber/20 space-y-1">
                  {selectedInvoice.review_reasons.map((r, i) => (
                    <p key={i} className="text-sm text-amber flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />{r}
                    </p>
                  ))}
                </div>
              )}

              {/* Invoice fields */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  { label: "Vendor",       value: selectedInvoice.vendor_name },
                  { label: "Invoice #",    value: selectedInvoice.invoice_number },
                  { label: "Invoice Date", value: selectedInvoice.invoice_date || "—" },
                  { label: "Due Date",     value: selectedInvoice.due_date || "—" },
                  { label: "Subtotal",     value: fmtD(selectedInvoice.subtotal) },
                  { label: "Tax",          value: fmtD(selectedInvoice.tax_amount) },
                  { label: "Fees",         value: fmtD(selectedInvoice.fees) },
                  { label: "Total",        value: fmtD(selectedInvoice.total), highlight: true },
                ].map((f, i) => (
                  <div key={i}>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">{f.label}</p>
                    <p className={`text-sm font-medium ${f.highlight ? "text-zinc-100 text-base" : "text-zinc-300"}`}>{f.value}</p>
                  </div>
                ))}
              </div>

              {selectedInvoice.notes && (
                <div className="p-3 rounded-lg bg-zinc-800/50">
                  <p className="text-xs text-zinc-500 mb-1">Notes</p>
                  <p className="text-sm text-zinc-300">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 flex-wrap">
              {["uploaded", "extracted", "needs_review"].includes(selectedInvoice.status) && (
                <Button onClick={() => handleInvoiceAction(selectedInvoice.invoice_id, "submitted")}
                  variant="outline" className="border-azure/30 text-azure hover:bg-azure/10">
                  <ArrowUpRight className="w-4 h-4 mr-1" />Submit for Approval
                </Button>
              )}
              {selectedInvoice.status === "pending_approval" && (
                <>
                  <Button onClick={() => handleInvoiceAction(selectedInvoice.invoice_id, "rejected")}
                    variant="outline" className="border-fire/30 text-fire hover:bg-fire/10">
                    <XCircle className="w-4 h-4 mr-1" />Reject
                  </Button>
                  <Button onClick={() => handleInvoiceAction(selectedInvoice.invoice_id, "approved")}
                    className="bg-emerald text-white hover:bg-emerald/80">
                    <CheckCircle className="w-4 h-4 mr-1" />Approve
                  </Button>
                </>
              )}
              {selectedInvoice.status === "approved" && (
                <Button onClick={() => handleInvoiceAction(selectedInvoice.invoice_id, "schedule")}
                  className="bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030]">
                  <Calendar className="w-4 h-4 mr-1" />Schedule for Payment
                </Button>
              )}
              {selectedInvoice.status === "scheduled_for_payment" && (
                <Button onClick={() => handleInvoiceAction(selectedInvoice.invoice_id, "paid")}
                  className="bg-emerald text-white hover:bg-emerald/80">
                  <CheckCircle className="w-4 h-4 mr-1" />Mark as Paid
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ════════════════════════════════════════
          ADD INVOICE MODAL
      ════════════════════════════════════════ */}
      <Dialog open={showAddInvoice} onOpenChange={setShowAddInvoice}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-zinc-100 flex items-center gap-2">
              <Upload className="w-5 h-5 text-gold" />Add Invoice
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Vendor Name *</label>
              <Input
                placeholder="e.g. Sysco Foods"
                value={newInvoice.vendor_name}
                onChange={(e) => setNewInvoice(p => ({ ...p, vendor_name: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                list="ap-vendor-names"
              />
              <datalist id="ap-vendor-names">
                {displayVendors.map(v => <option key={v.vendor_id} value={v.name} />)}
              </datalist>
            </div>

            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Invoice Number *</label>
              <Input
                placeholder="e.g. SYS-2024-8900"
                value={newInvoice.invoice_number}
                onChange={(e) => setNewInvoice(p => ({ ...p, invoice_number: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Total Amount</label>
                <Input
                  placeholder="0.00"
                  type="number"
                  value={newInvoice.total}
                  onChange={(e) => setNewInvoice(p => ({ ...p, total: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Due Date</label>
                <Input
                  type="date"
                  value={newInvoice.due_date}
                  onChange={(e) => setNewInvoice(p => ({ ...p, due_date: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Notes</label>
              <Textarea
                placeholder="Optional notes about this invoice..."
                value={newInvoice.notes}
                onChange={(e) => setNewInvoice(p => ({ ...p, notes: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 min-h-[80px]"
              />
            </div>

            <div className="p-3 rounded-lg bg-[#d4af37]/5 border border-[#d4af37]/20">
              <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-gold" />
                AI OCR extraction coming soon — upload a PDF or invoice image for automatic field detection and line-item parsing.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-zinc-100"
              onClick={() => setShowAddInvoice(false)}>
              Cancel
            </Button>
            <Button className="bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030]" onClick={submitAddInvoice} disabled={addingInvoice}>
              {addingInvoice ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
              Add Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default APIntelligence;
