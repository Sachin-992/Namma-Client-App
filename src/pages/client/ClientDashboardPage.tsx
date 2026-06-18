import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FolderKanban, ClipboardList, Receipt, Clock, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useRequirements } from "@/hooks/useRequirements";
import { useInvoices } from "@/hooks/useInvoices";
import { formatCurrency } from "@/utils";

export default function ClientDashboardPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isTamil = i18n.language?.startsWith("ta");

  // Fetch queries (automatically filtered by RLS at database level for clients)
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: requirements, isLoading: loadingRequirements } = useRequirements();
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();

  if (loadingProjects || loadingRequirements || loadingInvoices) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Compute metrics
  const activeProjectsCount = (projects || []).filter((p) => p.status === "active").length;
  const totalRequirements = (requirements || []).length;
  const submittedRequirements = (requirements || []).filter((r) => r.status === "submitted").length;
  
  const pendingInvoices = (invoices || []).filter((i) => i.status === "sent" || i.status === "overdue");
  const pendingAmount = pendingInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
  const paidInvoices = (invoices || []).filter((i) => i.status === "paid");
  const paidAmount = paidInvoices.reduce((sum, i) => sum + Number(i.amount), 0);

  // Get upcoming deadlines
  const upcomingDeadlines = (projects || [])
    .filter((p) => p.status === "active" && p.delivery_date)
    .sort((a, b) => new Date(a.delivery_date!).getTime() - new Date(b.delivery_date!).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-black tracking-tight text-slate-800">
            {isTamil ? "வணக்கம், நல்வரவு!" : "Welcome to your Client Workspace"}
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Track your ongoing projects, billing invoices, and requirements submissions in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-100">
          <ShieldCheck size={14} />
          Authorized Secure Portal
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Active Projects */}
        <div className="stat-card p-4 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl shadow-sm text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Projects</span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
              <FolderKanban size={14} />
            </div>
          </div>
          <p className="text-xl font-black text-foreground mt-3">{activeProjectsCount}</p>
        </div>

        {/* Requirements */}
        <div className="stat-card p-4 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl shadow-sm text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Requirements</span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-purple-50 text-purple-600">
              <ClipboardList size={14} />
            </div>
          </div>
          <p className="text-xl font-black text-foreground mt-3">
            {submittedRequirements} <span className="text-xs text-muted-foreground font-semibold">/ {totalRequirements}</span>
          </p>
        </div>

        {/* Billed Due */}
        <div className="stat-card p-4 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl shadow-sm text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Pending Balance</span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-rose-50 text-rose-600">
              <Receipt size={14} />
            </div>
          </div>
          <p className="text-xl font-black text-rose-600 mt-3">₹{pendingAmount.toLocaleString("en-IN")}</p>
        </div>

        {/* Billed Paid */}
        <div className="stat-card p-4 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl shadow-sm text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Paid</span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
              <Receipt size={14} />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-600 mt-3">₹{paidAmount.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Your Active Projects</h3>
              <button 
                onClick={() => navigate("/client/projects")}
                className="text-xs text-primary font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                View All
                <ArrowRight size={13} />
              </button>
            </div>

            {projects && projects.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {projects.map((proj) => (
                  <div key={proj.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800">{proj.name}</h4>
                      <p className="text-[11px] font-semibold text-slate-400 capitalize mt-0.5">Stage: {proj.stage}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-850">{proj.completion_pct}%</span>
                        <div className="w-24 h-1.5 bg-slate-100 border border-slate-200/50 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${proj.completion_pct}%` }} />
                        </div>
                      </div>
                      <button 
                        onClick={() => navigate("/client/projects")}
                        className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg"
                      >
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                <FolderKanban size={24} className="mx-auto text-slate-400 mb-2" />
                <p className="text-xs text-slate-400 font-bold italic">No active projects assigned yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-6">
          {/* Deadlines Panel */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 text-left">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Upcoming Deadlines</h3>
            {upcomingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {upcomingDeadlines.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock size={16} />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-extrabold text-slate-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Due: {p.delivery_date}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-bold italic">No upcoming project deadlines.</p>
            )}
          </div>

          {/* Quick Help Card */}
          <div className="bg-gradient-to-br from-primary/5 to-indigo-50 border border-primary/20 rounded-3xl p-5 text-left">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
              <HelpCircle size={16} />
              Need Assistance?
            </div>
            <p className="text-xs text-slate-500 leading-normal mb-4">
              If you have any questions regarding milestones, requirements, or billing, please contact our support team.
            </p>
            <a 
              href="mailto:support@nammaclient.com" 
              className="inline-block px-4 py-2 bg-primary hover:bg-primary/95 text-white text-[11px] font-bold rounded-xl shadow-md shadow-primary/20"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
