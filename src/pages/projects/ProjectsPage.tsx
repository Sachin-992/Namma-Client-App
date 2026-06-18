import { useState, useEffect, useRef } from "react";
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
  Settings,
  MoreVertical,
  Edit,
  Trash,
  X,
  FileText,
  Eye,
  Upload,
  CheckCircle2,
  Circle,
  User,
  ArrowRight,
  Info
} from "lucide-react";
import { PROJECT_STAGES } from "@/constants";
import { cn, formatCurrency } from "@/utils";
import type { ProjectStage } from "@/types";
import { useProjects, useUpdateProject, useToggleMilestone } from "@/hooks/useProjects";
import { useInvoices } from "@/hooks/useInvoices";
import { useClients } from "@/hooks/useClients";
import { useDocuments } from "@/hooks/useDocuments";
import { useNotes, useCreateNote } from "@/hooks/useNotes";
import { supabase } from "@/services/supabase/client";
import { storageService } from "@/services/storageService";
import { toast } from "sonner";

// Modals
import AddProjectModal from "./AddProjectModal";
import AddInvoiceModal from "@/pages/invoices/AddInvoiceModal";

const stageConfig: Record<ProjectStage, { color: string; bg: string; border: string; bar: string }> = {
  requirements: { color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", bar: "bg-purple-500" },
  planning: { color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", bar: "bg-blue-500" },
  design: { color: "text-pink-700", bg: "bg-pink-50", border: "border-pink-200", bar: "bg-pink-500" },
  development: { color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", bar: "bg-indigo-500" },
  testing: { color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200", bar: "bg-yellow-500" },
  deployment: { color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", bar: "bg-orange-500" },
  completed: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", bar: "bg-emerald-500" },
};

export default function ProjectsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const isTamil = i18n.language?.startsWith("ta");

  // Filter States
  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterValue, setFilterValue] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"card" | "list" | "kanban" | "timeline">("kanban");

  // Modal Contexts
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [selectedProjForInv, setSelectedProjForInv] = useState<any>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Active Project for Drawer
  const [activeProject, setActiveProject] = useState<any>(null);
  const [drawerTab, setDrawerTab] = useState<"overview" | "tasks" | "documents" | "invoices" | "notes">("overview");

  // Custom Inline Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  // Custom Inline Note Form State
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState<"internal" | "shared">("internal");

  // Queries
  const { data: projects, isLoading: loadingProjects } = useProjects("all");
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const { data: clients } = useClients();
  const { data: documents } = useDocuments();
  const { data: notes } = useNotes();

  const updateProject = useUpdateProject();
  const toggleMilestone = useToggleMilestone();
  const createNote = useCreateNote();

  // Drag State
  const [draggedOverStage, setDraggedOverStage] = useState<string | null>(null);

  // Quick Action Active Menu (For custom action menus on hover)
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

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
        queryClient.invalidateQueries({ queryKey: ["documents"] });
        queryClient.invalidateQueries({ queryKey: ["notes"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Click outside quick action menu listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setActiveActionMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loadingProjects || loadingInvoices) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Get dynamic priority label
  const getProjectPriority = (deliveryDate: string | null) => {
    if (!deliveryDate) return { label: "Low", color: "bg-slate-100 text-slate-700 border-slate-200" };
    const diff = new Date(deliveryDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: "Overdue", color: "bg-rose-100 text-rose-700 border-rose-200 font-bold" };
    if (days <= 7) return { label: "High", color: "bg-red-50 text-red-600 border-red-200 font-semibold" };
    if (days <= 15) return { label: "Medium", color: "bg-amber-50 text-amber-600 border-amber-200" };
    return { label: "Low", color: "bg-slate-100 text-slate-600 border-slate-200" };
  };

  // Get Initials for Avatar
  const getInitials = (name?: string) => {
    if (!name) return "C";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Process project revenue & health
  const processedProjects = (projects || []).map((proj: any) => {
    const projInvoices = (invoices || []).filter((i: any) => i.project_id === proj.id);
    const budget = projInvoices.reduce((sum: number, i: any) => sum + Number(i.amount), 0) || 75000;
    const revenue = projInvoices.filter((i: any) => i.status === "paid").reduce((sum: number, i: any) => sum + Number(i.amount), 0);
    const health = getProjectPriority(proj.delivery_date);
    
    return {
      ...proj,
      budget,
      revenue,
      health,
    };
  });

  // Filter and Sort Projects
  const filteredAndSorted = processedProjects
    .filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.client?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.client?.company || "").toLowerCase().includes(search.toLowerCase());

      const matchesClient = filterClient === "all" || p.client_id === filterClient;

      const priority = getProjectPriority(p.delivery_date).label;
      const matchesPriority = filterPriority === "all" || priority.toLowerCase() === filterPriority.toLowerCase();

      const matchesStatus = filterStatus === "all" || p.status === filterStatus;

      let matchesValue = true;
      if (filterValue !== "all") {
        if (filterValue === "low") matchesValue = p.budget < 50000;
        else if (filterValue === "medium") matchesValue = p.budget >= 50000 && p.budget <= 150000;
        else if (filterValue === "high") matchesValue = p.budget > 150000;
      }

      return matchesSearch && matchesClient && matchesPriority && matchesStatus && matchesValue;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "deadline") {
        if (!a.delivery_date) return 1;
        if (!b.delivery_date) return -1;
        return new Date(a.delivery_date).getTime() - new Date(b.delivery_date).getTime();
      }
      if (sortBy === "revenue") {
        return b.budget - a.budget;
      }
      if (sortBy === "priority") {
        const priorityWeight = (label: string) => {
          if (label === "Overdue") return 4;
          if (label === "High") return 3;
          if (label === "Medium") return 2;
          return 1;
        };
        const weightA = priorityWeight(getProjectPriority(a.delivery_date).label);
        const weightB = priorityWeight(getProjectPriority(b.delivery_date).label);
        return weightB - weightA;
      }
      return 0;
    });

  // KPI aggregates
  const totalCount = processedProjects.length;
  const activeCount = processedProjects.filter((p) => p.status === "active").length;
  const completedCount = processedProjects.filter((p) => p.status === "completed" || p.stage === "completed").length;
  const delayedCount = processedProjects.filter((p) => p.health.label === "Overdue").length;
  
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const dueThisWeekCount = processedProjects.filter(
    (p) => p.status === "active" && p.delivery_date && p.delivery_date >= todayStr && p.delivery_date <= next7Days
  ).length;

  const totalRevenueGenerated = processedProjects.reduce((sum, p) => sum + p.revenue, 0);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData("text/plain", projectId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    setDraggedOverStage(stageKey);
  };

  const handleDragLeave = () => {
    setDraggedOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    setDraggedOverStage(null);
    const projectId = e.dataTransfer.getData("text/plain");
    if (projectId) {
      await handleMoveStage(projectId, stageKey as any);
    }
  };

  const handleMoveStage = async (projectId: string, nextStage: ProjectStage) => {
    try {
      await updateProject.mutateAsync({
        id: projectId,
        stage: nextStage,
        ...(nextStage === "completed" ? { status: "completed", completion_pct: 100 } : {}),
      } as any);
      toast.success(isTamil ? `திட்டம் ${nextStage} நிலைக்கு மாற்றப்பட்டது!` : `Moved project to ${nextStage}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update project stage");
    }
  };

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

  // Delete project
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm(isTamil ? "இந்த திட்டத்தை நீக்க விரும்புகிறீர்களா?" : "Are you sure you want to delete this project?")) return;
    try {
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted successfully!");
      if (activeProject?.id === projectId) setActiveProject(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete project");
    }
  };

  // Add Task/Milestone inside Drawer
  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    try {
      const { error } = await (supabase.from("milestones") as any).insert({
        project_id: activeProject.id,
        title: newTaskTitle,
        due_date: newTaskDueDate || null,
        completed: false,
      });
      if (error) throw error;
      setNewTaskTitle("");
      setNewTaskDueDate("");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Task added successfully!");
    } catch (err: any) {
      toast.error("Failed to add task.");
    }
  };

  // Toggle milestone inside drawer
  const handleToggleMilestone = async (milestoneId: string, currentCompleted: boolean) => {
    try {
      await toggleMilestone.mutateAsync({ id: milestoneId, completed: !currentCompleted });
      toast.success("Task status updated!");
    } catch (err) {
      toast.error("Failed to update task.");
    }
  };

  // Upload Project File in Drawer
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fileExt = file.name.split(".").pop();
      const orgId = activeProject.org_id;
      const filePath = `${orgId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      await storageService.uploadProjectFile(filePath, file);

      const fileTypeMap: Record<string, "pdf" | "jpg" | "png" | "docx"> = {
        pdf: "pdf",
        jpg: "jpg",
        jpeg: "jpg",
        png: "png",
        docx: "docx",
      };

      const { error } = await (supabase.from("documents") as any).insert({
        org_id: orgId,
        client_id: activeProject.client_id,
        project_id: activeProject.id,
        name: file.name,
        file_path: filePath,
        file_type: fileTypeMap[fileExt?.toLowerCase() || ""] || "pdf",
        file_size: file.size,
      });

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file");
    }
  };

  // View Document preview
  const handlePreviewFile = async (doc: any) => {
    try {
      const signedUrl = await storageService.getSignedUrl("client-documents", doc.file_path);
      window.open(signedUrl, "_blank");
    } catch (err) {
      toast.error("Failed to open document preview");
    }
  };

  // Inline Note Submit in Drawer
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle || !newNoteContent) return;
    try {
      await createNote.mutateAsync({
        project_id: activeProject.id,
        client_id: activeProject.client_id,
        title: newNoteTitle,
        content: newNoteContent,
        type: newNoteType,
      });
      setNewNoteTitle("");
      setNewNoteContent("");
      toast.success("Note added!");
    } catch (err) {
      toast.error("Failed to add note.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">{t("projects.title")}</h1>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">Control timelines, milestones, and deliverables</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md cursor-pointer"
        >
          <Plus size={16} />
          {t("projects.addProject")}
        </button>
      </div>

      {/* Summary KPI Cards - Hidden in Kanban View Mode */}
      {viewMode !== "kanban" && (
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
              <div key={i} className="stat-card p-4 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl">
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
      )}

      {/* Toolbar: View Switcher + Interactive Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col xl:flex-row items-center gap-4">
        {/* Switcher tabs */}
        <div className="flex gap-1 bg-slate-50 p-1 border border-slate-200 rounded-xl max-w-fit shrink-0">
          {[
            { id: "kanban", label: isTamil ? "கான்பான்" : "Kanban Board", icon: Columns },
            { id: "card", label: isTamil ? "கிரிட்" : "Grid View", icon: Grid },
            { id: "list", label: isTamil ? "பட்டியல்" : "List View", icon: ListIcon },
            { id: "timeline", label: isTamil ? "காலவரிசை" : "Timeline Schedule", icon: Calendar },
          ].map((view) => {
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                onClick={() => setViewMode(view.id as any)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  viewMode === view.id
                    ? "bg-white text-foreground shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                <Icon size={13} />
                {view.label}
              </button>
            );
          })}
        </div>

        {/* Global Toolbar Filters */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 w-full">
          {/* Search */}
          <div className="relative col-span-2 md:col-span-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={isTamil ? "தேடுக..." : "Search project/client..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Client Filter */}
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer text-slate-600"
          >
            <option value="all">{isTamil ? "அனைத்து வாடிக்கையாளர்கள்" : "All Clients"}</option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer text-slate-600"
          >
            <option value="all">{isTamil ? "அனைத்து முன்னுரிமைகள்" : "All Priorities"}</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="overdue">Overdue</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer text-slate-600"
          >
            <option value="all">{isTamil ? "அனைத்து நிலைகள்" : "All Statuses"}</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Value Filter */}
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer text-slate-600"
          >
            <option value="all">{isTamil ? "அனைத்து பட்ஜெட்கள்" : "All Budgets"}</option>
            <option value="low">{"< ₹50,000"}</option>
            <option value="medium">{"₹50,000 - ₹1,50,000"}</option>
            <option value="high">{"> ₹1,50,000"}</option>
          </select>

          {/* Sort selection */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer text-slate-600"
          >
            <option value="newest">{isTamil ? "சமீபத்தியவை" : "Newest"}</option>
            <option value="oldest">{isTamil ? "பழையவை" : "Oldest"}</option>
            <option value="priority">{isTamil ? "முன்னுரிமை" : "Priority"}</option>
            <option value="deadline">{isTamil ? "காலக்கெடு" : "Deadline"}</option>
            <option value="revenue">{isTamil ? "வருவாய்" : "Revenue"}</option>
          </select>
        </div>
      </div>

      {/* RENDER VIEWS */}
      {filteredAndSorted.length > 0 ? (
        <>
          {/* ====================================================
              KANBAN BOARD VIEW
              ==================================================== */}
          {viewMode === "kanban" && (
            <div className="w-full overflow-x-auto pb-6 pt-2 select-none">
              <div className="flex gap-6 min-w-[2100px] items-start">
                {PROJECT_STAGES.map((stageCol) => {
                  const stageProjects = filteredAndSorted.filter((p) => p.stage === stageCol.key);
                  const isOver = draggedOverStage === stageCol.key;
                  
                  return (
                    <div
                      key={stageCol.key}
                      onDragOver={(e) => handleDragOver(e, stageCol.key)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, stageCol.key)}
                      className={cn(
                        "w-[350px] flex-shrink-0 flex flex-col bg-slate-100/50 border border-slate-200 rounded-3xl p-4 min-h-[80vh] transition-all duration-200 relative overflow-hidden",
                        isOver && "bg-slate-200/50 border-dashed border-primary ring-4 ring-primary/5 shadow-inner"
                      )}
                    >
                      {/* Sticky column header */}
                      <div className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm px-2 py-2.5 rounded-2xl flex items-center justify-between mb-4 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full", stageCol.key === "completed" ? "bg-emerald-500" : stageCol.key === "development" ? "bg-indigo-500" : "bg-primary")} />
                          <h4 className="text-xs font-bold text-slate-800 capitalize leading-none">{stageCol.label}</h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-white border border-slate-200 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {stageProjects.length}
                          </span>
                          <button
                            onClick={() => setIsModalOpen(true)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800"
                            title="Add project to stage"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Cards Container */}
                      <div className="space-y-4 overflow-y-auto flex-1 max-h-[85vh] pr-0.5 scrollbar-thin">
                        {stageProjects.length > 0 ? (
                          stageProjects.map((proj) => {
                            const config = stageConfig[proj.stage as ProjectStage] || stageConfig.requirements;
                            const isMenuOpen = activeActionMenu === proj.id;
                            
                            return (
                              <div
                                key={proj.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, proj.id)}
                                onClick={() => {
                                  setActiveProject(proj);
                                  setDrawerTab("overview");
                                }}
                                className="group bg-white border border-slate-200 hover:border-primary/20 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 relative cursor-pointer text-left flex flex-col justify-between"
                              >
                                {/* Left Edge Color Bar */}
                                <div className={cn("absolute top-0 bottom-0 left-0 w-1.5 rounded-l-2xl", config.bar)} />

                                <div className="pl-2.5 space-y-3">
                                  {/* Badges bar */}
                                  <div className="flex justify-between items-center">
                                    <span className={cn("px-2.5 py-0.5 text-[9px] font-black rounded-full border uppercase tracking-wider", proj.health.color)}>
                                      {proj.health.label}
                                    </span>

                                    {/* Action Trigger */}
                                    <div 
                                      className="relative"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        onClick={() => setActiveActionMenu(isMenuOpen ? null : proj.id)}
                                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                                      >
                                        <MoreVertical size={13} />
                                      </button>
                                      
                                      {isMenuOpen && (
                                        <div 
                                          ref={actionMenuRef}
                                          className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-25 py-1 text-xs font-bold text-slate-700"
                                        >
                                          <button
                                            onClick={() => {
                                              setActiveProject(proj);
                                              setDrawerTab("overview");
                                              setActiveActionMenu(null);
                                            }}
                                            className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-1.5"
                                          >
                                            <Eye size={12} /> View Details
                                          </button>
                                          <button
                                            onClick={() => {
                                              setEditingProject(proj);
                                              setActiveActionMenu(null);
                                            }}
                                            className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-1.5"
                                          >
                                            <Edit size={12} /> Edit Details
                                          </button>
                                          <button
                                            onClick={() => {
                                              setActiveProject(proj);
                                              setDrawerTab("tasks");
                                              setActiveActionMenu(null);
                                            }}
                                            className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-1.5"
                                          >
                                            <CheckCircle2 size={12} /> Add Task
                                          </button>
                                          <button
                                            onClick={() => {
                                              setSelectedProjForInv(proj);
                                              setShowInvoiceModal(true);
                                              setActiveActionMenu(null);
                                            }}
                                            className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-1.5"
                                          >
                                            <DollarSign size={12} /> Add Invoice
                                          </button>
                                          <button
                                            onClick={() => {
                                              handleDeleteProject(proj.id);
                                              setActiveActionMenu(null);
                                            }}
                                            className="w-full px-3 py-1.5 text-left hover:bg-slate-50 text-rose-600 flex items-center gap-1.5"
                                          >
                                            <Trash size={12} /> Delete
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Title & Info */}
                                  <div>
                                    <h5 className="font-extrabold text-slate-900 text-sm group-hover:text-primary transition-colors leading-snug line-clamp-2">
                                      {proj.name}
                                    </h5>
                                    <p className="text-[10px] font-semibold text-slate-500 truncate mt-1">
                                      Client: <span className="text-slate-800">{proj.client?.name}</span>
                                    </p>
                                  </div>

                                  {/* Progress Line */}
                                  <div className="space-y-1 pt-1.5">
                                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                                      <span>COMPLETION</span>
                                      <span className="text-slate-800">{proj.completion_pct}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                      <div className="h-full bg-primary" style={{ width: `${proj.completion_pct}%` }} />
                                    </div>
                                  </div>
                                </div>

                                {/* Footer Indicators */}
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between pl-2.5">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">
                                    <Calendar size={11} className="text-slate-400" />
                                    <span>{proj.delivery_date || "—"}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[10px] font-black text-slate-700">
                                      ₹{proj.budget.toLocaleString("en-IN")}
                                    </span>
                                    <div
                                      className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[9px] font-bold shadow-sm"
                                      title={proj.client?.name}
                                    >
                                      {getInitials(proj.client?.name)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-12 text-[11px] font-bold text-slate-400 italic border border-dashed border-slate-200 rounded-2xl bg-white/40">
                            {isTamil ? "திட்டங்கள் ஏதுமில்லை" : `No projects in ${stageCol.label} stage yet.`}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Card/Grid View */}
          {viewMode === "card" && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredAndSorted.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => {
                    setActiveProject(proj);
                    setDrawerTab("overview");
                  }}
                  className="bg-card border border-border hover:border-primary/20 hover:shadow-card-hover rounded-2xl p-5 shadow-card transition-all flex flex-col justify-between group relative cursor-pointer text-left"
                >
                  <div>
                    {/* Health badge & actions */}
                    <div className="flex items-center justify-between mb-3.5">
                      <span className={cn("px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border tracking-wide uppercase", proj.health.color)}>
                        {proj.health.label}
                      </span>
                      
                      <div 
                        className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                    <h3 className="font-extrabold text-foreground text-base group-hover:text-primary transition-colors truncate leading-tight">
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
                    
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
                        onClick={() => {
                          setActiveProject(proj);
                          setDrawerTab("overview");
                        }}
                        className="w-7 h-7 flex items-center justify-center bg-primary text-white hover:bg-primary/95 rounded-xl shadow-sm ml-1"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden text-left">
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
                  {filteredAndSorted.map((proj) => (
                    <tr key={proj.id} className="hover:bg-accent/20 transition-colors">
                      <td className="px-5 py-4">
                        <button
                          onClick={() => {
                            setActiveProject(proj);
                            setDrawerTab("overview");
                          }}
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

          {/* Timeline Gantt-like View */}
          {viewMode === "timeline" && (
            <div className="bg-card border border-border rounded-2xl shadow-card p-5 overflow-x-auto text-left">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Delivery Timeline Mapping</h3>
              <div className="min-w-[700px] space-y-4">
                {filteredAndSorted.map((proj) => {
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
            Modify your query or selections to locate active projects.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setFilterClient("all");
              setFilterPriority("all");
              setFilterStatus("all");
              setFilterValue("all");
              setSortBy("newest");
            }}
            className="px-4 py-2 border border-border text-xs font-semibold rounded-xl hover:bg-accent transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* ====================================================
          PROJECT DETAILS DRAWER
          ==================================================== */}
      {activeProject && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setActiveProject(null)}
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 animate-slide-in-right">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="text-left">
                <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">
                  {activeProject.stage}
                </span>
                <h3 className="text-base font-black text-slate-800 tracking-tight mt-1 line-clamp-1">
                  {activeProject.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveProject(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-250 flex items-center justify-center text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs Selector */}
            <div className="flex border-b border-slate-200 bg-slate-50/50">
              {[
                { id: "overview" as const, label: isTamil ? "கண்ணோட்டம்" : "Overview" },
                { id: "tasks" as const, label: isTamil ? "பணிகள்" : "Tasks" },
                { id: "documents" as const, label: isTamil ? "ஆவணங்கள்" : "Documents" },
                { id: "invoices" as const, label: isTamil ? "இன்வாய்ஸ்கள்" : "Invoices" },
                { id: "notes" as const, label: isTamil ? "குறிப்புகள்" : "Notes" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDrawerTab(tab.id)}
                  className={cn(
                    "flex-1 py-3 text-center border-b-2 text-xs font-bold transition-all cursor-pointer",
                    drawerTab === tab.id
                      ? "border-primary text-primary bg-white"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/30"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content Scrolling Panel */}
            <div className="flex-1 p-6 overflow-y-auto text-left">
              {/* --- TAB 1: OVERVIEW --- */}
              {drawerTab === "overview" && (
                <div className="space-y-6">
                  {/* Meta Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Client</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">{activeProject.client?.name}</p>
                      <p className="text-[10px] text-slate-500">{activeProject.client?.company}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Revenue Value</p>
                      <p className="text-xs font-black text-slate-800 mt-1">₹{activeProject.budget.toLocaleString("en-IN")}</p>
                      <p className="text-[10px] text-slate-500">Total Project Value</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Start Date</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">{activeProject.start_date || "—"}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Deadline Date</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">{activeProject.delivery_date || "—"}</p>
                    </div>
                  </div>

                  {/* Completion circular diagram */}
                  <div className="border border-slate-200 rounded-xl p-5 flex items-center justify-between bg-slate-50/50">
                    <div className="text-left">
                      <h4 className="text-xs font-black text-slate-800">Project Progression</h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-normal max-w-xs">
                        Tracks client deliverables completed relative to deadlines.
                      </p>
                    </div>
                    
                    <div className="relative w-20 h-20">
                      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="#E2E8F0" strokeWidth="14" />
                        <circle
                          cx="60" cy="60" r="50"
                          fill="none"
                          stroke="#4F46E5"
                          strokeWidth="14"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 50}`}
                          strokeDashoffset={`${2 * Math.PI * 50 * (1 - activeProject.completion_pct / 100)}`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-black text-slate-800">{activeProject.completion_pct}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {activeProject.description && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Description</h4>
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                        {activeProject.description}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {activeProject.tags && activeProject.tags.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Project Tags</h4>
                      <div className="flex gap-2 flex-wrap">
                        {activeProject.tags.map((tag: any) => (
                          <span
                            key={tag.id}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg border text-white"
                            style={{ backgroundColor: tag.color, borderColor: tag.color }}
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- TAB 2: TASKS (MILESTONES) --- */}
              {drawerTab === "tasks" && (
                <div className="space-y-6">
                  {/* Task list */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">Project Milestones</h4>
                    {activeProject.milestones && activeProject.milestones.length > 0 ? (
                      activeProject.milestones.map((m: any) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleMilestone(m.id, m.completed)}
                              className="text-slate-400 hover:text-primary transition-colors cursor-pointer"
                            >
                              {m.completed ? (
                                <CheckCircle2 size={18} className="text-primary" />
                              ) : (
                                <Circle size={18} />
                              )}
                            </button>
                            <span className={cn("text-xs font-bold text-slate-800", m.completed && "line-through opacity-55")}>
                              {m.title}
                            </span>
                          </div>
                          {m.due_date && (
                            <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                              {m.due_date}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No tasks defined for this project.</p>
                    )}
                  </div>

                  {/* Add Task Form */}
                  <form onSubmit={handleAddMilestone} className="p-4 border border-slate-200 bg-slate-50/50 rounded-2xl space-y-3">
                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">Create Task</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Task / Milestone Title"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
                      />
                      <input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all cursor-pointer"
                    >
                      Add Milestone Task
                    </button>
                  </form>
                </div>
              )}

              {/* --- TAB 3: DOCUMENTS --- */}
              {drawerTab === "documents" && (
                <div className="space-y-6">
                  {/* File Upload Zone */}
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors relative">
                    <input
                      type="file"
                      id="drawer-file-upload"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload size={24} className="text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-extrabold text-slate-700">Click to Upload Document File</p>
                    <p className="text-[10px] text-slate-400 mt-1">PDF, JPG, PNG, DOCX up to 10MB</p>
                  </div>

                  {/* Documents list */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">Project Documents</h4>
                    {(documents || []).filter((d) => d.project_id === activeProject.id).length > 0 ? (
                      (documents || [])
                        .filter((d) => d.project_id === activeProject.id)
                        .map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <FileText size={16} />
                              </div>
                              <div className="text-left">
                                <p className="text-xs font-bold text-slate-800 line-clamp-1">{doc.name}</p>
                                <p className="text-[9px] text-slate-400 uppercase font-semibold">
                                  {doc.file_type} • {(doc.file_size / 1024).toFixed(0)} KB
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handlePreviewFile(doc)}
                                className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800"
                                title="Open preview"
                              >
                                <Eye size={13} />
                              </button>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No files uploaded for this project.</p>
                    )}
                  </div>
                </div>
              )}

              {/* --- TAB 4: INVOICES & PAYMENTS --- */}
              {drawerTab === "invoices" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Invoices & Billing</h4>
                    <button
                      onClick={() => {
                        setSelectedProjForInv(activeProject);
                        setShowInvoiceModal(true);
                      }}
                      className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 flex items-center gap-1 transition-all"
                    >
                      <Plus size={12} /> Create Invoice
                    </button>
                  </div>

                  {/* List invoices */}
                  <div className="space-y-3">
                    {(invoices || []).filter((i) => i.project_id === activeProject.id).length > 0 ? (
                      (invoices || [])
                        .filter((i) => i.project_id === activeProject.id)
                        .map((inv) => (
                          <div
                            key={inv.id}
                            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors shadow-sm flex items-center justify-between"
                          >
                            <div className="text-left">
                              <p className="text-xs font-bold text-slate-800">{inv.invoice_number}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Due Date: {inv.due_date || "—"}</p>
                            </div>
                            <div className="flex items-center gap-3 text-right">
                              <div>
                                <p className="text-xs font-black text-slate-800">₹{inv.amount.toLocaleString("en-IN")}</p>
                                <span className={cn(
                                  "inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase mt-1 border",
                                  inv.status === "paid" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                  inv.status === "sent" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-50 text-slate-500 border-slate-200"
                                )}>
                                  {inv.status}
                                </span>
                              </div>
                              <button
                                onClick={() => navigate(`/invoices/${inv.id}`)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800"
                              >
                                <ChevronRight size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No invoices billed for this project.</p>
                    )}
                  </div>
                </div>
              )}

              {/* --- TAB 5: NOTES --- */}
              {drawerTab === "notes" && (
                <div className="space-y-6">
                  {/* Notes Feed */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">Internal Notes</h4>
                    {(notes || []).filter((n) => n.project_id === activeProject.id).length > 0 ? (
                      (notes || [])
                        .filter((n) => n.project_id === activeProject.id)
                        .map((note) => (
                          <div
                            key={note.id}
                            className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-left"
                          >
                            <div className="flex justify-between items-start">
                              <h5 className="text-xs font-bold text-slate-900">{note.title}</h5>
                              <span className="text-[9px] font-bold text-slate-500 uppercase">
                                {note.type}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-normal whitespace-pre-line">{note.content}</p>
                            <p className="text-[9px] text-slate-400 font-semibold pt-1">
                              By {note.author?.full_name || "Author"} • {new Date(note.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No notes written for this project.</p>
                    )}
                  </div>

                  {/* Add Note Form */}
                  <form onSubmit={handleAddNote} className="p-4 border border-slate-200 bg-slate-50/50 rounded-2xl space-y-3">
                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">Create Note</h5>
                    <div>
                      <input
                        type="text"
                        placeholder="Note Title"
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <textarea
                        placeholder="Draft note contents..."
                        rows={3}
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary resize-none"
                      />
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="note-type"
                          checked={newNoteType === "internal"}
                          onChange={() => setNewNoteType("internal")}
                        />
                        Internal Note
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="note-type"
                          checked={newNoteType === "shared"}
                          onChange={() => setNewNoteType("shared")}
                        />
                        Client Note
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all cursor-pointer"
                    >
                      Save Note Draft
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Footer Summary */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-right flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Namma Client Project Operations
              </span>
              <button
                onClick={() => navigate(`/projects/${activeProject.id}/closure`)}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Close Project
              </button>
            </div>
          </div>
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
