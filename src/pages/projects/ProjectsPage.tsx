import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Calendar,
  Search,
  Grid,
  List as ListIcon,
  Columns,
  DollarSign,
  Briefcase,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronRight,
  TrendingUp,
  Settings,
  MoreVertical,
  Edit,
  Trash
} from "lucide-react";
import { PROJECT_STAGES } from "@/constants";
import { cn, formatCurrency } from "@/utils";
import type { ProjectStage } from "@/types";
import { useProjects, useUpdateProject } from "@/hooks/useProjects";
import { useInvoices } from "@/hooks/useInvoices";
import { supabase } from "@/services/supabase/client";
import { toast } from "sonner";

// Modals
import AddProjectModal from "./AddProjectModal";
import AddInvoiceModal from "@/pages/invoices/AddInvoiceModal";

const stageConfig: Record<ProjectStage, { color: string; bg: string }> = {
  requirements: { color: "text-purple-700", bg: "bg-purple-50 border-purple-100" },
  planning: { color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
  design: { color: "text-pink-700", bg: "bg-pink-50 border-pink-100" },
  development: { color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-100" },
  testing: { color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-100" },
  deployment: { color: "text-orange-700", bg: "bg-orange-50 border-orange-100" },
  completed: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
};

export default function ProjectsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "list" | "kanban" | "timeline">("card");

  const { data: projects, isLoading: loadingProjects } = useProjects(selectedStage);
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const updateProject = useUpdateProject();

  // Modal contexts
  const [editingProject, setEditingProject] = useState<any>(null);
  const [selectedProjForInv, setSelectedProjForInv] = useState<any>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    if (location.state?.openCreateModal) {
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Real-time Postgres changes channel
  useEffect(() => {
    const channel = supabase
      .channel("projects-realtime-channel")
      .on("postgres_changes", { event: "*", schema: "public" }, () => {
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (loadingProjects || loadingInvoices) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // --- PROJECT HEALTH & BUDGET ALGORITHMS ---
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const getProjectHealth = (proj: any) => {
    if (proj.status === "completed" || proj.stage === "completed") {
      return { label: "Healthy", color: "bg-emerald-50 text-emerald-700 border-emerald-100" };
    }
    if (!proj.delivery_date) {
      return { label: "Healthy", color: "bg-emerald-50 text-emerald-700 border-emerald-100" };
    }

    const deliveryTime = new Date(proj.delivery_date).getTime();
    const diffDays = Math.ceil((deliveryTime - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: "Delayed", color: "bg-rose-50 text-rose-700 border-rose-100 font-bold" };
    }
    if (diffDays <= 7 && proj.completion_pct < 80) {
      return { label: "At Risk", color: "bg-amber-50 text-amber-700 border-amber-100" };
    }
    return { label: "Healthy", color: "bg-emerald-50 text-emerald-700 border-emerald-100" };
  };

  const processedProjects = (projects || []).map((proj: any) => {
    const projInvoices = (invoices || []).filter((i: any) => i.project_id === proj.id);
    const budget = projInvoices.reduce((sum: number, i: any) => sum + Number(i.amount), 0) || 75000;
    const revenue = projInvoices.filter((i: any) => i.status === "paid").reduce((sum: number, i: any) => sum + Number(i.amount), 0);
    const health = getProjectHealth(proj);

    let daysRemaining = 0;
    if (proj.delivery_date) {
      const diff = new Date(proj.delivery_date).getTime() - today.getTime();
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return {
      ...proj,
      budget,
      revenue,
      health,
      daysRemaining,
    };
  });

  // Filter list
  const filtered = processedProjects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.client?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.client?.company || "").toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  // KPI aggregates
  const totalCount = processedProjects.length;
  const activeCount = processedProjects.filter(p => p.status === "active").length;
  const completedCount = processedProjects.filter(p => p.status === "completed" || p.stage === "completed").length;
  const delayedCount = processedProjects.filter(p => p.health.label === "Delayed").length;
  
  const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const dueThisWeekCount = processedProjects.filter(
    p => p.status === "active" && p.delivery_date && p.delivery_date >= todayStr && p.delivery_date <= next7Days
  ).length;

  const totalRevenueGenerated = processedProjects.reduce((sum, p) => sum + p.revenue, 0);

  const handleUpdateProgress = async (projId: string, currentPct: number) => {
    const nextPct = Math.min(100, currentPct + 10);
    try {
      await updateProject.mutateAsync({
        id: projId,
        completion_pct: nextPct,
        stage: nextPct === 100 ? "completed" : undefined,
        status: nextPct === 100 ? "completed" : undefined,
      } as any);
      toast.success("Project progress updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update project progress");
    }
  };

  const handleMarkCompleted = async (projId: string) => {
    try {
      await updateProject.mutateAsync({
        id: projId,
        completion_pct: 100,
        stage: "completed",
        status: "completed",
      } as any);
      toast.success("Project marked as completed successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to complete project");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("projects.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Control timelines, milestones, and deliverables</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/95 transition-all shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          {t("projects.addProject")}
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Projects", value: totalCount, icon: Briefcase, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Active", value: activeCount, icon: Columns, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Delayed", value: delayedCount, icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-50" },
          { label: "Completed", value: completedCount, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Due This Week", value: dueThisWeekCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Total Revenue", value: `₹${totalRevenueGenerated.toLocaleString("en-IN")}`, icon: DollarSign, color: "text-indigo-600", bg: "bg-indigo-50" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="stat-card p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{item.label}</span>
                <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", item.bg, item.color)}>
                  <Icon size={12} />
                </div>
              </div>
              <p className="text-lg font-black text-foreground mt-3 truncate">{item.value}</p>
            </div>
          );
        })}
      </div>

      {/* Toolbar: Views Switcher + Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Switcher tabs */}
        <div className="flex gap-1 bg-background p-1 border border-border rounded-xl">
          {[
            { id: "card", label: "Grid View", icon: Grid },
            { id: "list", label: "List View", icon: ListIcon },
            { id: "kanban", label: "Kanban Board", icon: Columns },
            { id: "timeline", label: "Timeline Schedule", icon: Calendar },
          ].map(view => {
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                onClick={() => setViewMode(view.id as any)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  viewMode === view.id
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon size={13} />
                {view.label}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input pl-9 py-1.5 text-xs w-full"
            />
          </div>

          <select
            value={selectedStage}
            onChange={e => setSelectedStage(e.target.value)}
            className="form-input text-xs py-1.5 w-36"
          >
            <option value="all">All Stages</option>
            {PROJECT_STAGES.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* RENDER VIEWS */}
      {filtered.length > 0 ? (
        <>
          {/* Card/Grid View */}
          {viewMode === "card" && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(proj => {
                const stage = stageConfig[proj.stage as ProjectStage];
                return (
                  <div
                    key={proj.id}
                    className="bg-card border border-border hover:border-primary/20 hover:shadow-card-hover rounded-2xl p-5 shadow-card transition-all flex flex-col justify-between group relative"
                  >
                    <div>
                      {/* Health badge & actions */}
                      <div className="flex items-center justify-between mb-3.5">
                        <span className={cn("px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border tracking-wide uppercase", proj.health.color)}>
                          {proj.health.label}
                        </span>
                        
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingProject(proj)}
                            className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-accent"
                            title="Edit project"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => handleMarkCompleted(proj.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Complete project"
                          >
                            <CheckCircle size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Name */}
                      <h3
                        onClick={() => navigate(`/projects/${proj.id}`)}
                        className="font-extrabold text-foreground text-base group-hover:text-primary transition-colors truncate cursor-pointer leading-tight"
                      >
                        {proj.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate font-medium mt-0.5">
                        Client: <strong className="text-foreground">{proj.client?.name}</strong> {proj.client?.company ? `(${proj.client.company})` : ""}
                      </p>

                      {/* Progress bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                          <span className="text-muted-foreground font-bold uppercase tracking-wider text-[9px]">Stage: {proj.stage}</span>
                          <span className="font-extrabold text-foreground">{proj.completion_pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${proj.completion_pct}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Stats details & Actions footer */}
                    <div className="mt-5 pt-3.5 border-t border-border/80 flex items-center justify-between">
                      <div className="text-[10px] text-muted-foreground font-semibold">
                        Budget: <strong className="text-foreground">₹{proj.budget.toLocaleString("en-IN")}</strong>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdateProgress(proj.id, proj.completion_pct)}
                          className="px-2 py-1 text-[10px] font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                        >
                          +10% Progress
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProjForInv(proj);
                            setShowInvoiceModal(true);
                          }}
                          className="px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          +Invoice
                        </button>
                        <button
                          onClick={() => navigate(`/projects/${proj.id}`)}
                          className="w-7 h-7 flex items-center justify-center bg-primary text-white hover:bg-primary/95 rounded-xl shadow-sm ml-1"
                        >
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-border bg-accent/20 text-muted-foreground">
                    <th className="px-5 py-3">Project Name</th>
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3">Stage</th>
                    <th className="px-5 py-3">Progress</th>
                    <th className="px-5 py-3">Budget</th>
                    <th className="px-5 py-3">Health</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground font-medium">
                  {filtered.map(proj => (
                    <tr key={proj.id} className="hover:bg-accent/20 transition-colors">
                      <td className="px-5 py-4">
                        <button
                          onClick={() => navigate(`/projects/${proj.id}`)}
                          className="font-bold text-primary hover:underline cursor-pointer text-left"
                        >
                          {proj.name}
                        </button>
                      </td>
                      <td className="px-5 py-4">{proj.client?.name || "—"}</td>
                      <td className="px-5 py-4 capitalize">{proj.stage}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 w-28">
                          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${proj.completion_pct}%` }} />
                          </div>
                          <span>{proj.completion_pct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">₹{proj.budget.toLocaleString("en-IN")}</td>
                      <td className="px-5 py-4">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] border font-bold uppercase", proj.health.color)}>
                          {proj.health.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateProgress(proj.id, proj.completion_pct)}
                            className="text-[10px] text-primary hover:underline"
                          >
                            +10%
                          </button>
                          <button
                            onClick={() => handleMarkCompleted(proj.id)}
                            className="text-[10px] text-emerald-600 hover:underline"
                          >
                            Mark Complete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Kanban Board View */}
          {viewMode === "kanban" && (
            <div className="flex gap-4 overflow-x-auto pb-4 items-start select-none">
              {PROJECT_STAGES.map(stageCol => {
                const stageProjects = filtered.filter(p => p.stage === stageCol.key);
                return (
                  <div key={stageCol.key} className="w-72 bg-accent/30 rounded-2xl p-4 border border-border flex-shrink-0 flex flex-col max-h-[70vh]">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-foreground capitalize">{stageCol.label}</h4>
                      <span className="bg-white px-2 py-0.5 rounded-full text-[10px] border border-border font-bold">
                        {stageProjects.length}
                      </span>
                    </div>
                    
                    <div className="space-y-3 overflow-y-auto flex-1 pr-0.5">
                      {stageProjects.length > 0 ? (
                        stageProjects.map(proj => (
                          <div
                            key={proj.id}
                            onClick={() => navigate(`/projects/${proj.id}`)}
                            className="bg-card border border-border hover:border-primary/20 rounded-xl p-3 shadow-sm hover:shadow transition-all cursor-pointer"
                          >
                            <h5 className="text-xs font-bold text-foreground mb-1 leading-snug">{proj.name}</h5>
                            <p className="text-[10px] text-muted-foreground truncate">{proj.client?.name}</p>
                            <div className="mt-3 flex items-center justify-between text-[9px] pt-2 border-t border-border/40">
                              <span className="font-bold text-primary">{proj.completion_pct}% complete</span>
                              <span className={cn("px-1.5 py-0.5 rounded-full border", proj.health.color)}>
                                {proj.health.label}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-[11px] text-muted-foreground italic border border-dashed border-border rounded-xl bg-card/40">
                          Empty stage
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Timeline Gantt-like View */}
          {viewMode === "timeline" && (
            <div className="bg-card border border-border rounded-2xl shadow-card p-5 overflow-x-auto">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Delivery Timeline Mapping</h3>
              <div className="min-w-[700px] space-y-4">
                {filtered.map(proj => {
                  const hasDates = proj.start_date && proj.delivery_date;
                  return (
                    <div key={proj.id} className="flex items-center gap-4 py-2 border-b border-border/50 last:border-0">
                      <div className="w-44 flex-shrink-0 truncate">
                        <h4 className="text-xs font-bold text-foreground truncate">{proj.name}</h4>
                        <span className="text-[10px] text-muted-foreground">{proj.client?.name}</span>
                      </div>
                      
                      {/* Timeline Bar */}
                      <div className="flex-1 bg-accent/40 rounded-full h-8 relative flex items-center px-4 overflow-hidden border border-border/40">
                        {hasDates ? (
                          <div className="absolute top-1 bottom-1 bg-primary/15 border border-primary/20 rounded-lg flex items-center px-3 text-[10px] font-bold text-primary" style={{ left: "15%", right: "20%" }}>
                            {proj.start_date} to {proj.delivery_date}
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">No dates scheduled</span>
                        )}
                        <span className="ml-auto text-[10px] font-extrabold text-foreground z-10">{proj.completion_pct}% complete</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 bg-card border border-border rounded-2xl shadow-card max-w-md mx-auto animate-scale-in">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase size={32} className="text-primary" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">No projects matched</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-6 leading-relaxed">
            Modify your query or stage selections to locate active projects.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedStage("all");
            }}
            className="px-4 py-2 border border-border text-xs font-semibold rounded-xl hover:bg-accent transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* MODALS */}
      {isModalOpen && <AddProjectModal onClose={() => setIsModalOpen(false)} />}
      
      {editingProject && (
        <AddProjectModal
          onClose={() => setEditingProject(null)}
          editData={{
            id: editingProject.id,
            name: editingProject.name,
            client_id: editingProject.client_id,
            description: editingProject.description || "",
            stage: editingProject.stage,
            status: editingProject.status,
            start_date: editingProject.start_date || "",
            delivery_date: editingProject.delivery_date || "",
            completion_pct: editingProject.completion_pct || 0,
            tags: editingProject.tags?.map((t: any) => t.label) || [],
          }}
        />
      )}

      {showInvoiceModal && selectedProjForInv && (
        <AddInvoiceModal
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedProjForInv(null);
          }}
        />
      )}
    </div>
  );
}
