import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "@/hooks/useDashboard";
import { supabase } from "@/services/supabase/client";
import {
  Users,
  FolderKanban,
  CreditCard,
  Clock,
  TrendingUp,
  UserPlus,
  FilePlus,
  Send,
  Plus,
  FileText,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  TrendingDown,
  Activity,
  CheckCircle,
  FileCode,
  DollarSign,
  ChevronRight,
  Search,
  Filter,
  Inbox,
  UserCheck
} from "lucide-react";
import { formatCurrency, formatRelativeTime, cn } from "@/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

// Modals
import AddClientModal from "./clients/AddClientModal";
import AddProjectModal from "./projects/AddProjectModal";
import AddInvoiceModal from "./invoices/AddInvoiceModal";
import AddPaymentModal from "@/components/AddPaymentModal";
import { UploadModal } from "./DocumentsPage";

function getGreeting(name: string) {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { data: dash, isLoading } = useDashboardData();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Search & Filter state for Projects table
  const [projectSearch, setProjectSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");

  // Modal open states
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Active sub-tab state for Client Insights
  const [insightTab, setInsightTab] = useState<"top" | "recent" | "pending" | "active">("top");

  // Real-time subscription setup
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-realtime-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-data", profile?.org_id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, profile?.org_id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = profile?.full_name?.split(" ")[0] ?? "Admin";

  // Render empty state if there are no clients yet
  if (!dash || dash.totalClients === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6 bg-card border border-border rounded-3xl shadow-card max-w-4xl mx-auto my-10 animate-scale-in">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Inbox size={48} className="text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground mb-3">Welcome to Namma Client!</h1>
        <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
          It looks like your command center is clean. To get started and unlock all dashboard insights, add your first client profile.
        </p>
        <button
          onClick={() => setShowClientModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-2xl hover:bg-primary/95 transition-all shadow-md cursor-pointer hover:scale-102"
        >
          <UserPlus size={18} />
          Add Your First Client
        </button>
        {showClientModal && <AddClientModal onClose={() => setShowClientModal(false)} />}
      </div>
    );
  }

  // Filter projects for Section 4: Projects Overview
  const filteredProjects = (dash.projects || []).filter((proj: any) => {
    const matchesSearch =
      proj.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
      (proj.client?.name || "").toLowerCase().includes(projectSearch.toLowerCase()) ||
      (proj.client?.company || "").toLowerCase().includes(projectSearch.toLowerCase());
    const matchesStage = stageFilter === "all" || proj.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  // Dynamically calculate project priority for Section 4
  const getProjectPriority = (deliveryDate: string | null) => {
    if (!deliveryDate) return { label: "Low", color: "bg-slate-100 text-slate-700" };
    const diff = new Date(deliveryDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: "Overdue", color: "bg-rose-100 text-rose-700 font-bold" };
    if (days <= 7) return { label: "High", color: "bg-red-50 text-red-600 font-semibold" };
    if (days <= 15) return { label: "Medium", color: "bg-amber-50 text-amber-600" };
    return { label: "Low", color: "bg-slate-100 text-slate-600" };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* SECTION 1: Top Welcome Header & Today's Summary */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl shadow-card text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10" />
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{getGreeting(displayName)}</h1>
          <p className="text-slate-300 text-sm mt-1.5 font-medium">Here's what requires your attention today.</p>
        </div>
        {/* Today's Summary checklist cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 xl:w-[55%]">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <FolderKanban size={18} className="text-indigo-300" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-300">Active Projects</p>
              <p className="text-lg font-bold mt-0.5">{dash.activeProjCount}</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <CreditCard size={18} className="text-amber-300" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-300">Uncollected Balance</p>
              <p className="text-lg font-bold mt-0.5">₹{dash.totalPendingBalance.toLocaleString("en-IN")}</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Clock size={18} className="text-emerald-300" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-300">Milestones Due Today</p>
              <p className="text-lg font-bold mt-0.5">{dash.milestonesDueToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Quick Actions */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-card">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3.5 px-1">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setShowClientModal(true)}
            className="flex flex-col items-center justify-center p-4 bg-background border border-border hover:border-primary/50 hover:bg-accent/40 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center group-hover:scale-105 transition-transform mb-2">
              <UserPlus size={18} className="text-purple-600" />
            </div>
            <span className="text-xs font-bold text-foreground">Add Client</span>
          </button>
          <button
            onClick={() => setShowProjectModal(true)}
            className="flex flex-col items-center justify-center p-4 bg-background border border-border hover:border-primary/50 hover:bg-accent/40 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform mb-2">
              <Plus size={18} className="text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-foreground">Create Project</span>
          </button>
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="flex flex-col items-center justify-center p-4 bg-background border border-border hover:border-primary/50 hover:bg-accent/40 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform mb-2">
              <Send size={18} className="text-blue-600" />
            </div>
            <span className="text-xs font-bold text-foreground">Create Invoice</span>
          </button>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex flex-col items-center justify-center p-4 bg-background border border-border hover:border-primary/50 hover:bg-accent/40 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform mb-2">
              <DollarSign size={18} className="text-indigo-600" />
            </div>
            <span className="text-xs font-bold text-foreground">Add Payment</span>
          </button>
          <button
            onClick={() => navigate("/requirements/wizard")}
            className="flex flex-col items-center justify-center p-4 bg-background border border-border hover:border-primary/50 hover:bg-accent/40 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center group-hover:scale-105 transition-transform mb-2">
              <FileCode size={18} className="text-orange-600" />
            </div>
            <span className="text-xs font-bold text-foreground">Add Requirement</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex flex-col items-center justify-center p-4 bg-background border border-border hover:border-primary/50 hover:bg-accent/40 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center group-hover:scale-105 transition-transform mb-2">
              <FileText size={18} className="text-pink-600" />
            </div>
            <span className="text-xs font-bold text-foreground">Upload Document</span>
          </button>
        </div>
      </div>

      {/* SECTION 3: Business KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Clients Card */}
        <div className="stat-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Clients</p>
              <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <Users size={12} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{dash.totalClients}</p>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
              <TrendingUp size={10} />
              +{dash.clientGrowthPct}%
            </span>
            <span className="text-[10px] text-muted-foreground">+{dash.newClientsThisMonth} new</span>
          </div>
        </div>

        {/* Active Projects Card */}
        <div className="stat-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Projects</p>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <FolderKanban size={12} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{dash.activeProjCount}</p>
          </div>
          <div className="mt-3 text-[10px] text-muted-foreground font-medium">
            <span className="font-bold text-foreground">{dash.completedProjectsThisMonth}</span> completed this month
          </div>
        </div>

        {/* Revenue Card */}
        <div className="stat-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Revenue (Collected)</p>
              <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <DollarSign size={12} />
              </div>
            </div>
            <p className="text-xl font-black text-foreground truncate">₹{dash.totalRevenue.toLocaleString("en-IN")}</p>
          </div>
          <div className="mt-3 text-[10px] text-muted-foreground font-medium">
            Month: <span className="font-bold text-foreground">₹{dash.monthlyRevenue.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Pending Payments Card */}
        <div className="stat-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Pending Payments</p>
              <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <CreditCard size={12} />
              </div>
            </div>
            <p className="text-xl font-black text-foreground truncate">₹{dash.totalPendingBalance.toLocaleString("en-IN")}</p>
          </div>
          <div className="mt-3 text-[10px] text-muted-foreground font-medium">
            Overdue invoices: <span className="font-bold text-rose-500">{dash.overdueCount}</span>
          </div>
        </div>

        {/* Upcoming Deadlines Card */}
        <div className="stat-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Deadlines (7d)</p>
              <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <Clock size={12} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{dash.projectsDueThisWeekCount}</p>
          </div>
          <div className="mt-3 text-[10px] text-muted-foreground font-medium">
            Requires urgent action
          </div>
        </div>

        {/* Project Completion Rate Card */}
        <div className="stat-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Avg Completion</p>
              <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <TrendingUp size={12} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{dash.avgCompletionRate}%</p>
          </div>
          <div className="mt-3 w-full h-1 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600" style={{ width: `${dash.avgCompletionRate}%` }} />
          </div>
        </div>
      </div>

      {/* Grid: Charts + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION 7: Revenue Analytics */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-foreground">Revenue & Payments Analytics</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Historical overview of collections vs outstanding</p>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="w-2.5 h-2.5 rounded bg-indigo-500" /> Collected
              </div>
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="w-2.5 h-2.5 rounded bg-amber-400" /> Pending
              </div>
            </div>
          </div>
          <div className="h-64 w-full text-xs font-medium">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dash.revenueTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", borderRadius: "12px" }}
                  formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`]}
                />
                <Area type="monotone" dataKey="collected" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorCol)" />
                <Area type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={1.5} fillOpacity={1} fill="url(#colorPend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECTION 8: Project Pipeline Kanban */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Active Pipeline Tracker</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Distribution of projects across stages</p>
            <div className="space-y-2 mt-5">
              {dash.pipelineStages.map((stage: any, idx: number) => (
                <div key={stage.stage} className="flex items-center justify-between p-2 hover:bg-accent/40 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-muted-foreground font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-foreground capitalize">{stage.stage}</span>
                  </div>
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    stage.count > 0 ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400"
                  )}>
                    {stage.count} {stage.count === 1 ? "project" : "projects"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Actions Feed + Deadlines Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION 6: Pending Actions Panel */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-rose-600 flex items-center gap-1.5">
              <AlertTriangle size={16} /> Attention Required
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Critical blockers and action triggers</p>
            <div className="space-y-3 mt-4 max-h-[360px] overflow-y-auto pr-1">
              {dash.pendingActions.length > 0 ? (
                dash.pendingActions.map((action: any) => (
                  <div key={action.id} className="p-3 bg-background border border-border rounded-xl flex items-start justify-between gap-3 shadow-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          action.urgency === "high" ? "bg-red-500 animate-pulse" : action.urgency === "medium" ? "bg-amber-400" : "bg-blue-400"
                        )} />
                        <h4 className="text-xs font-bold text-foreground">{action.title}</h4>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{action.desc}</p>
                    </div>
                    <button
                      onClick={() => navigate(action.actionUrl)}
                      className="text-[10px] font-bold text-primary border border-primary/20 hover:bg-primary/5 px-2 py-1 rounded-lg transition-colors cursor-pointer self-center whitespace-nowrap"
                    >
                      {action.actionLabel}
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-xs text-muted-foreground italic flex flex-col items-center justify-center gap-2">
                  <UserCheck size={20} className="text-emerald-500" />
                  All caught up! No actions pending.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 9: Upcoming Deadlines Timeline */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-5">
          <h3 className="text-sm font-bold text-foreground">Upcoming Project Deadlines</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Weekly timeline mapping schedule risks</p>
          <div className="space-y-3 mt-4 max-h-[360px] overflow-y-auto pr-1">
            {dash.deadlinesTimeline.length > 0 ? (
              dash.deadlinesTimeline.map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/projects/${item.id}`)}
                  className="p-3 hover:bg-accent/40 border border-border hover:border-primary/20 rounded-xl cursor-pointer transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-xs font-bold text-foreground truncate max-w-[70%]">{item.project}</h4>
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase",
                      item.priority === "high" ? "bg-red-50 text-red-600" : item.priority === "medium" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-600"
                    )}>
                      {item.priority}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Client: <strong className="text-foreground">{item.client}</strong></span>
                    <span className="font-semibold text-foreground">
                      {item.daysRemaining <= 0
                        ? "Due today"
                        : `${item.daysRemaining} days remaining`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-xs text-muted-foreground italic">
                No upcoming deadlines.
              </div>
            )}
          </div>
        </div>

        {/* SECTION 5: Recent Activity Timeline */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-5">
          <h3 className="text-sm font-bold text-foreground">Recent Command Center Log</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time system actions activity stream</p>
          <div className="relative border-l border-border pl-4 space-y-5 mt-5 max-h-[340px] overflow-y-auto">
            {dash.activities.length > 0 ? (
              dash.activities.map((act: any) => (
                <div key={act.id} className="relative text-xs">
                  {/* Bullet */}
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-card" />
                  <p className="font-semibold text-foreground">
                    {act.actor?.full_name || "System"}{" "}
                    <span className="font-normal text-muted-foreground">{act.description}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelativeTime(act.created_at)}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-muted-foreground italic">
                No activity logged yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: Modern Projects Overview Table */}
      <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Projects Overview Center</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Active delivery controls & status progress</p>
          </div>
          
          {/* Table Search & Stage filter toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={projectSearch}
                onChange={e => setProjectSearch(e.target.value)}
                placeholder="Search..."
                className="form-input py-1.5 pl-8 text-xs w-44"
              />
            </div>
            
            <select
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
              className="form-input py-1.5 text-xs w-36"
            >
              <option value="all">All Stages</option>
              <option value="requirements">Requirements</option>
              <option value="planning">Planning</option>
              <option value="design">Design</option>
              <option value="development">Development</option>
              <option value="testing">Testing</option>
              <option value="deployment">Deployment</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-accent/20 text-muted-foreground font-semibold">
                <th className="px-6 py-3">Project Name</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Progress</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Deadline</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((proj: any) => {
                  const priority = getProjectPriority(proj.delivery_date);
                  return (
                    <tr key={proj.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/projects/${proj.id}`)}
                          className="font-bold text-primary hover:underline cursor-pointer text-left"
                        >
                          {proj.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-foreground">{proj.client?.name || "—"}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 w-32">
                          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${proj.completion_pct}%` }} />
                          </div>
                          <span className="text-[10px] text-foreground font-bold">{proj.completion_pct}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize badge py-0.5 px-2 rounded-full border border-border text-[10px]">
                          {proj.stage}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {proj.delivery_date
                          ? new Date(proj.delivery_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px]", priority.color)}>
                          {priority.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/projects/${proj.id}`)}
                          className="text-xs text-primary font-bold hover:underline cursor-pointer"
                        >
                          View Control
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground italic">
                    No matching projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 10: Client Insights Grid */}
      <div className="bg-card border border-border rounded-2xl shadow-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Client Intelligence Desk</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Granular segments of portfolio health</p>
          </div>
          {/* Insights tabs toggler */}
          <div className="flex gap-1 bg-background p-1 border border-border rounded-xl">
            {[
              { id: "top", label: "Top Collected" },
              { id: "recent", label: "Recent Onboard" },
              { id: "pending", label: "With Balances" },
              { id: "active", label: "With Active Projects" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setInsightTab(tab.id as any)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  insightTab === tab.id
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Insights Tab content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(() => {
            const keyMap: Record<string, string> = {
              top: "topClients",
              recent: "recentClients",
              pending: "pendingClients",
              active: "activeClients",
            };
            const clientList = (dash.clientInsights as any)[keyMap[insightTab]] || [];
            if (clientList.length > 0) {
              return clientList.map((client: any) => (
                <div
                  key={client.id}
                  onClick={() => navigate(`/clients/${client.id}`)}
                  className="p-4 bg-background border border-border hover:border-primary/20 rounded-xl cursor-pointer transition-all shadow-sm group"
                >
                  <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                    {client.name}
                  </h4>
                  <p className="text-[10px] text-muted-foreground truncate">{client.company || "No company"}</p>
                  <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-[10px]">
                    {insightTab === "top" ? (
                      <>
                        <span className="text-muted-foreground">Total Paid:</span>
                        <strong className="text-emerald-600 font-bold">₹{client.paidRevenue.toLocaleString("en-IN")}</strong>
                      </>
                    ) : insightTab === "recent" ? (
                      <>
                        <span className="text-muted-foreground">Joined:</span>
                        <strong className="text-foreground">{new Date(client.created_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}</strong>
                      </>
                    ) : insightTab === "pending" ? (
                      <>
                        <span className="text-muted-foreground">Status:</span>
                        <span className="text-amber-500 font-semibold uppercase">Pending Invoice</span>
                      </>
                    ) : (
                      <>
                        <span className="text-muted-foreground">Active Projects:</span>
                        <strong className="text-foreground">{client.activeProjCount}</strong>
                      </>
                    )}
                  </div>
                </div>
              ));
            } else {
              return (
                <div className="col-span-full text-center py-6 text-xs text-muted-foreground italic">
                  No clients matched this insight filter.
                </div>
              );
            }
          })()}
        </div>
      </div>

      {/* Render modals conditionally */}
      {showClientModal && <AddClientModal onClose={() => setShowClientModal(false)} />}
      {showProjectModal && <AddProjectModal onClose={() => setShowProjectModal(false)} />}
      {showInvoiceModal && <AddInvoiceModal onClose={() => setShowInvoiceModal(false)} />}
      {showPaymentModal && <AddPaymentModal onClose={() => setShowPaymentModal(false)} />}
      {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} />}
    </div>
  );
}
