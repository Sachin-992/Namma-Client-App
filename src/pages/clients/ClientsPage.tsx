import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Filter,
  Users,
  UserCheck,
  UserPlus,
  CreditCard,
  Phone,
  Mail,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronRight,
  ClipboardList,
  AlertCircle,
  Inbox,
  Sparkles
} from "lucide-react";
import { getInitials, formatCurrency, cn } from "@/utils";
import { useClients, useDeleteClient } from "@/hooks/useClients";
import { useInvoices } from "@/hooks/useInvoices";
import { useProjects } from "@/hooks/useProjects";
import { useRequirements } from "@/hooks/useRequirements";
import { supabase } from "@/services/supabase/client";
import { toast } from "sonner";

// Modals
import AddClientModal from "./AddClientModal";
import AddProjectModal from "@/pages/projects/AddProjectModal";
import AddInvoiceModal from "@/pages/invoices/AddInvoiceModal";

export default function ClientsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: clients, isLoading: loadingClients } = useClients();
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: requirements } = useRequirements();
  const deleteClientMutation = useDeleteClient();

  // Modal control states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedClientForProj, setSelectedClientForProj] = useState<any>(null);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedClientForInv, setSelectedClientForInv] = useState<any>(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hasPendingOnly, setHasPendingOnly] = useState(false);
  const [recentOnly, setRecentOnly] = useState(false);

  // Real-time Postgres changes listener
  useEffect(() => {
    const channel = supabase
      .channel("clients-realtime-channel")
      .on("postgres_changes", { event: "*", schema: "public" }, () => {
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        queryClient.invalidateQueries({ queryKey: ["requirements"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (loadingClients || loadingInvoices || loadingProjects) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // --- BUSINESS COMPUTATIONS ---
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  // Helper: Get computed status
  const getComputedStatus = (client: any) => {
    const clientProjects = (projects || []).filter((p: any) => p.client_id === client.id);
    const clientReqs = (requirements || []).filter((r: any) => r.client_id === client.id);

    if (client.status === "active") {
      return "Active";
    }
    if (client.status === "inactive") {
      const allCompleted = clientProjects.length > 0 && clientProjects.every((p: any) => p.status === "completed" || p.stage === "completed");
      return allCompleted ? "Completed" : "On Hold";
    }
    // Onboarding status in DB
    const hasSubmitted = clientReqs.some((r: any) => r.status === "submitted" || r.status === "reviewed");
    return hasSubmitted ? "Discussion" : "Lead";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Discussion":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "Lead":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "On Hold":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "Completed":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  // Process data for clients
  const processedClients = (clients || []).map((client: any) => {
    const clientProjects = (projects || []).filter((p: any) => p.client_id === client.id);
    const clientInvoices = (invoices || []).filter((i: any) => i.client_id === client.id);

    const activeCount = clientProjects.filter((p: any) => p.status === "active").length;
    const completedCount = clientProjects.filter((p: any) => p.status === "completed").length;
    const totalCount = clientProjects.length;

    const pendingAmount = clientInvoices
      .filter((i: any) => i.status === "sent" || i.status === "overdue")
      .reduce((sum: number, i: any) => sum + Number(i.amount), 0);

    const computedStatus = getComputedStatus(client);

    return {
      ...client,
      activeCount,
      completedCount,
      totalCount,
      pendingAmount,
      computedStatus,
      createdTimestamp: new Date(client.created_at).getTime(),
    };
  });

  // KPI summaries
  const totalClients = processedClients.length;
  const activeClients = processedClients.filter(c => c.activeCount > 0).length;
  const newThisMonth = processedClients.filter(c => c.createdTimestamp >= startOfMonth).length;
  const clientsWithPending = processedClients.filter(c => c.pendingAmount > 0).length;

  // Filter clients
  const filtered = processedClients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      (client.company || "").toLowerCase().includes(search.toLowerCase()) ||
      client.email.toLowerCase().includes(search.toLowerCase()) ||
      (client.phone || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || client.computedStatus.toLowerCase() === statusFilter.toLowerCase();
    const matchesPending = !hasPendingOnly || client.pendingAmount > 0;
    const matchesRecent = !recentOnly || (now.getTime() - client.createdTimestamp <= 30 * 24 * 60 * 60 * 1000);

    return matchesSearch && matchesStatus && matchesPending && matchesRecent;
  });

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete client ${name}? This will remove all associated projects and invoices.`)) return;
    try {
      await deleteClientMutation.mutateAsync(id);
      toast.success("Client deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete client");
    }
  };

  const handleSendReminder = (client: any) => {
    if (client.pendingAmount <= 0) {
      toast.info(`No pending payments for ${client.name}.`);
      return;
    }
    const template = `Hello ${client.name}, this is a friendly reminder that you have an outstanding balance of ₹${client.pendingAmount.toLocaleString("en-IN")} due. You can pay via UPI or Bank Transfer. Thank you!`;
    navigator.clipboard.writeText(template);
    toast.success("Reminder template copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("clients.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage contacts, projects, and balances</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/95 transition-all shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          {t("clients.addClient")}
        </button>
      </div>

      {/* KPI summaries cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Clients</p>
            <p className="text-xl font-bold text-foreground mt-0.5">{totalClients}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Clients</p>
            <p className="text-xl font-bold text-foreground mt-0.5">{activeClients}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <UserPlus size={20} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">New This Month</p>
            <p className="text-xl font-bold text-foreground mt-0.5">{newThisMonth}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <CreditCard size={20} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">With Pending Balances</p>
            <p className="text-xl font-bold text-rose-500 mt-0.5">{clientsWithPending}</p>
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-card flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search clients by name, company, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-10 w-full"
            />
          </div>

          {/* Status Filter Selector */}
          <div className="w-full md:w-48 flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input text-xs py-1.5"
            >
              <option value="all">All Statuses</option>
              <option value="lead">Lead</option>
              <option value="discussion">Discussion</option>
              <option value="active">Active</option>
              <option value="on hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Checkbox Quick Filters */}
        <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-border text-xs font-semibold text-foreground">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasPendingOnly}
              onChange={(e) => setHasPendingOnly(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary w-4 h-4"
            />
            Show with Pending Payments Only
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={recentOnly}
              onChange={(e) => setRecentOnly(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary w-4 h-4"
            />
            Added in Last 30 Days
          </label>
          {filtered.length !== totalClients && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setHasPendingOnly(false);
                setRecentOnly(false);
              }}
              className="text-primary hover:underline ml-auto"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Grid: Clients Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((client) => {
            const initials = getInitials(client.name);
            return (
              <div
                key={client.id}
                className="bg-card border border-border hover:border-primary/20 hover:shadow-card-hover rounded-2xl p-5 shadow-card transition-all flex flex-col justify-between group relative"
              >
                {/* Header: Avatar, Name, Status */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner">
                    {client.avatar_url ? (
                      <img src={client.avatar_url} alt={client.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-extrabold text-foreground text-base truncate leading-tight group-hover:text-primary transition-colors">
                        {client.name}
                      </h3>
                      {/* Delete action overlay */}
                      <button
                        onClick={() => handleDelete(client.id, client.name)}
                        className="text-muted-foreground hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 absolute top-4 right-4"
                        title="Delete Client"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 font-medium">{client.company || "Independent Client"}</p>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2 text-xs border-t border-border pt-4 mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail size={12} className="flex-shrink-0" />
                    <span className="truncate text-foreground font-medium">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone size={12} className="flex-shrink-0" />
                      <span className="text-foreground font-medium">{client.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] mt-3 bg-accent/40 rounded-xl p-2.5">
                    <div className="text-center flex-1 border-r border-border/60">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Projects</span>
                      <strong className="text-foreground text-xs font-bold block mt-0.5">{client.totalCount}</strong>
                    </div>
                    <div className="text-center flex-1 border-r border-border/60">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Active</span>
                      <strong className="text-emerald-600 text-xs font-bold block mt-0.5">{client.activeCount}</strong>
                    </div>
                    <div className="text-center flex-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Pending Bill</span>
                      <strong className={cn(
                        "text-xs font-black block mt-0.5",
                        client.pendingAmount > 0 ? "text-rose-500" : "text-slate-400"
                      )}>
                        ₹{client.pendingAmount.toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Footer and Quick actions */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                  <span className={cn("px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border tracking-wide uppercase", getStatusColor(client.computedStatus))}>
                    {client.computedStatus}
                  </span>
                  
                  {/* Action links */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSendReminder(client)}
                      className="px-2 py-1 text-[10px] font-bold text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      title="Send payment reminder template"
                    >
                      Remind
                    </button>
                    <button
                      onClick={() => {
                        setSelectedClientForProj(client);
                        setShowProjectModal(true);
                      }}
                      className="px-2 py-1 text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    >
                      +Proj
                    </button>
                    <button
                      onClick={() => {
                        setSelectedClientForInv(client);
                        setShowInvoiceModal(true);
                      }}
                      className="px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      +Inv
                    </button>
                    <Link
                      to={`/clients/${client.id}`}
                      className="w-7 h-7 flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 shadow-sm transition-all ml-1"
                      title="Open Profile Page"
                    >
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-card border border-border rounded-2xl shadow-card max-w-md mx-auto animate-scale-in">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Inbox size={32} className="text-purple-500" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">No clients matched</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-6 leading-relaxed">
            Try adjusting your search query, status selectors, or checkbox filters to find client records.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setHasPendingOnly(false);
              setRecentOnly(false);
            }}
            className="px-4 py-2 border border-border text-xs font-semibold rounded-xl hover:bg-accent transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Render modals */}
      {showAddModal && <AddClientModal onClose={() => setShowAddModal(false)} />}
      
      {showProjectModal && selectedClientForProj && (
        <AddProjectModal
          onClose={() => {
            setShowProjectModal(false);
            setSelectedClientForProj(null);
          }}
          editData={{
            client_id: selectedClientForProj.id,
          } as any}
        />
      )}

      {showInvoiceModal && selectedClientForInv && (
        <AddInvoiceModal
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedClientForInv(null);
          }}
          // We can set defaultValues or pass default client inside form
        />
      )}
    </div>
  );
}
