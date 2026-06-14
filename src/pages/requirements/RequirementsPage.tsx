import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  ClipboardList,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Download,
  Send,
  X,
  FileText,
  MessageSquare,
  Bookmark,
  ExternalLink,
  ThumbsUp,
  Inbox,
  User
} from "lucide-react";
import { useRequirements } from "@/hooks/useRequirements";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/services/supabase/client";
import { toast } from "sonner";
import { cn, formatDate } from "@/utils";

export default function RequirementsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: requirements, isLoading } = useRequirements();

  // Selected requirement for detail drawer
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [tabFilter, setTabFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Review notes form
  const [reviewNotes, setReviewNotes] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  // Real-time Postgres channel
  useEffect(() => {
    const channel = supabase
      .channel("requirements-realtime-channel")
      .on("postgres_changes", { event: "*", schema: "public" }, () => {
        queryClient.invalidateQueries({ queryKey: ["requirements"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // --- WORKFLOW MAPS ---
  const mapRequirementStatus = (req: any) => {
    const sd = req.step_data || {};
    if (req.status === "reviewed") {
      return "Approved";
    }
    if (req.status === "draft") {
      return sd.reviewNotes ? "Changes Requested" : "Draft";
    }
    // Submitted status in DB
    return sd.reviewedAt ? "Under Review" : "Submitted";
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Under Review":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "Submitted":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "Changes Requested":
        return "bg-red-50 text-red-700 border-red-100 animate-pulse";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const processed = (requirements || []).map((req) => {
    const computedStatus = mapRequirementStatus(req);
    const sd = req.step_data || {};
    
    // Check type of project
    let type = "Website Development";
    if (sd.projectType === "mobileApp") type = "Mobile Application";
    else if (sd.projectType === "webApp") type = "Web App Integration";
    else if (sd.projectType === "ecommerce") type = "E-Commerce System";
    else if (sd.projectType === "branding") type = "Branding & logo";
    else if (sd.projectType === "digitalMarketing") type = "Digital Campaign";
    else if (sd.projectType === "erp") type = "ERP / CRM Tooling";

    // Progress completion based on wizard steps
    let completion = 15;
    if (sd.projectType) completion = 25;
    if (sd.businessName) completion = 40;
    if (sd.goals && sd.goals.length > 0 && sd.goals[0]) completion = 60;
    if (sd.uploadedFilePaths && sd.uploadedFilePaths.length > 0) completion = 80;
    if (req.status === "submitted") completion = 90;
    if (req.status === "reviewed") completion = 100;

    return {
      ...req,
      computedStatus,
      type,
      completion,
      project_name: sd.businessName || "Pending Project Setup",
    };
  });

  // Summary counts
  const totalCount = processed.length;
  const draftCount = processed.filter(r => r.computedStatus === "Draft" || r.computedStatus === "Changes Requested").length;
  const submittedCount = processed.filter(r => r.computedStatus === "Submitted").length;
  const reviewCount = processed.filter(r => r.computedStatus === "Under Review").length;
  const approvedCount = processed.filter(r => r.computedStatus === "Approved").length;

  // Filters
  const filtered = processed.filter((req) => {
    const matchesSearch =
      req.project_name.toLowerCase().includes(search.toLowerCase()) ||
      (req.client?.name || "").toLowerCase().includes(search.toLowerCase());
    
    const matchesTab =
      tabFilter === "all" ||
      (tabFilter === "draft" && (req.computedStatus === "Draft" || req.computedStatus === "Changes Requested")) ||
      req.computedStatus.toLowerCase() === tabFilter.toLowerCase();
      
    return matchesSearch && matchesTab;
  });

  // Admin workflow reviews submission
  const handleReviewAction = async (status: "draft" | "reviewed", text: string) => {
    if (!selectedReq) return;
    setSavingReview(true);
    try {
      const { error } = await (supabase.from("requirements") as any)
        .update({
          status,
          step_data: {
            ...selectedReq.step_data,
            reviewNotes: text || null,
            reviewedAt: status === "reviewed" ? new Date().toISOString() : null,
          }
        })
        .eq("id", selectedReq.id);

      if (error) throw error;
      
      toast.success(
        status === "reviewed"
          ? "Requirements approved and marked as verified!"
          : "Changes requested. Client has been notified."
      );
      setSelectedReq(null);
      setReviewNotes("");
      queryClient.invalidateQueries({ queryKey: ["requirements"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update review status");
    } finally {
      setSavingReview(false);
    }
  };

  const handleDownloadPDF = (req: any) => {
    const sd = req.step_data || {};
    const text = `
NAMMA CLIENT REQUIREMENTS DOCUMENT
Client: ${req.client?.name || "—"}
Business: ${sd.businessName || "—"}
Type: ${req.type}
Industry: ${sd.industry || "—"}
Goals: ${sd.goals ? sd.goals.join(", ") : "—"}
References: ${sd.references ? sd.references.join(", ") : "—"}
Additional Notes: ${sd.additionalNotes || "None"}
    `;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `requirements_${req.id}.txt`;
    link.click();
    toast.success("Document downloaded successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("requirements.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Collect and verify scope onboarding checklists</p>
        </div>
        {profile?.role === "client" && (
          <button
            onClick={() => navigate("/requirements/wizard")}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/95 transition-all shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            Onboarding Wizard
          </button>
        )}
      </div>

      {/* KPI summaries cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Requirements", value: totalCount, icon: ClipboardList, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Drafts", value: draftCount, icon: Clock, color: "text-slate-500", bg: "bg-slate-100" },
          { label: "Submitted", value: submittedCount, icon: Send, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Under Review", value: reviewCount, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Approved", value: approvedCount, icon: ThumbsUp, color: "text-emerald-600", bg: "bg-emerald-50" },
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
              <p className="text-lg font-black text-foreground mt-3">{item.value}</p>
            </div>
          );
        })}
      </div>

      {/* Toolbar & Filter Tabs */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: "All" },
            { id: "draft", label: "Draft / Refined" },
            { id: "submitted", label: "Submitted" },
            { id: "under review", label: "Under Review" },
            { id: "approved", label: "Approved" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabFilter(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer",
                tabFilter === tab.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white border border-border text-foreground hover:bg-accent"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search requirement or client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-9 py-1.5 text-xs w-full"
          />
        </div>
      </div>

      {/* Grid: Requirement list */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((req) => (
            <div
              key={req.id}
              className="bg-card border border-border hover:border-primary/20 hover:shadow-card-hover rounded-2xl p-5 shadow-card transition-all flex flex-col justify-between group relative"
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <span className={cn("px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border tracking-wide uppercase", getStatusBadgeClass(req.computedStatus))}>
                    {req.computedStatus}
                  </span>
                  
                  <button
                    onClick={() => handleDownloadPDF(req)}
                    className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Download Text Summary"
                  >
                    <Download size={13} />
                  </button>
                </div>

                <h3
                  onClick={() => setSelectedReq(req)}
                  className="font-extrabold text-foreground text-base group-hover:text-primary transition-colors truncate cursor-pointer leading-tight"
                >
                  {req.project_name}
                </h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  Client: <strong className="text-foreground">{req.client?.name}</strong>
                </p>

                <div className="mt-4 space-y-2 text-xs font-semibold text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="text-foreground">{req.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Progress:</span>
                    <span className="text-primary font-bold">{req.completion}%</span>
                  </div>
                </div>
              </div>

              {/* Action footer */}
              <div className="mt-5 pt-3.5 border-t border-border/80 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Submitted: {req.submitted_at ? formatDate(req.submitted_at) : "—"}
                </span>
                
                <button
                  onClick={() => setSelectedReq(req)}
                  className="flex items-center gap-1 text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  {profile?.role === "admin" || profile?.role === "team_member" ? "Verify / Review" : "View Details"}
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card border border-border rounded-2xl shadow-card max-w-md mx-auto animate-scale-in">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={32} className="text-primary" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">No requirements found</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-6 leading-relaxed">
            Modify your tab selections or search strings to find requirement submissions.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setTabFilter("all");
            }}
            className="px-4 py-2 border border-border text-xs font-semibold rounded-xl hover:bg-accent transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* SECTION: Slide-over Drawer for Requirement Details */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setSelectedReq(null); setReviewNotes(""); }} />
          
          {/* Drawer container */}
          <div className="relative bg-card border-l border-border w-full max-w-lg h-full shadow-card-hover flex flex-col justify-between animate-slide-in-left z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">{selectedReq.project_name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Submitted by {selectedReq.client?.name}</p>
              </div>
              <button
                onClick={() => { setSelectedReq(null); setReviewNotes(""); }}
                className="w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-medium text-muted-foreground">
              {/* Type & Status Block */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-accent/30 rounded-xl p-3 border border-border/40">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Status</span>
                  <span className={cn("px-2.5 py-0.5 text-[9px] font-bold rounded-full border tracking-wide uppercase inline-block mt-1.5", getStatusBadgeClass(selectedReq.computedStatus))}>
                    {selectedReq.computedStatus}
                  </span>
                </div>
                <div className="bg-accent/30 rounded-xl p-3 border border-border/40">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Type</span>
                  <span className="text-foreground font-bold inline-block mt-2.5 capitalize">{selectedReq.type}</span>
                </div>
              </div>

              {/* Scope & Business details */}
              <div>
                <h4 className="text-[10px] text-foreground uppercase font-bold tracking-wider mb-2 border-b border-border/60 pb-1.5">Business Information</h4>
                <div className="space-y-2 text-foreground">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Industry:</span>
                    <span>{selectedReq.step_data?.industry || "—"}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-muted-foreground block mb-1">Company Pitch & Overview:</span>
                    <p className="bg-background rounded-xl p-3 border border-border text-foreground font-normal leading-relaxed">
                      {selectedReq.step_data?.businessDescription || "No description provided."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Goals list */}
              {selectedReq.step_data?.goals && selectedReq.step_data.goals.length > 0 && selectedReq.step_data.goals[0] && (
                <div>
                  <h4 className="text-[10px] text-foreground uppercase font-bold tracking-wider mb-2 border-b border-border/60 pb-1.5">Key Project Goals</h4>
                  <ul className="space-y-1.5">
                    {selectedReq.step_data.goals.map((g: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* References */}
              {selectedReq.step_data?.references && selectedReq.step_data.references.length > 0 && selectedReq.step_data.references[0] && (
                <div>
                  <h4 className="text-[10px] text-foreground uppercase font-bold tracking-wider mb-2 border-b border-border/60 pb-1.5">Admired References / Competitors</h4>
                  <ul className="space-y-1.5">
                    {selectedReq.step_data.references.map((r: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-primary hover:underline cursor-pointer">
                        <ExternalLink size={11} />
                        <a href={r} target="_blank" rel="noreferrer" className="truncate">{r}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Uploaded Documents */}
              {selectedReq.step_data?.uploadedFilePaths && selectedReq.step_data.uploadedFilePaths.length > 0 && (
                <div>
                  <h4 className="text-[10px] text-foreground uppercase font-bold tracking-wider mb-2 border-b border-border/60 pb-1.5">Onboarding Documents</h4>
                  <div className="space-y-2">
                    {selectedReq.step_data.uploadedFilePaths.map((f: string, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-background border border-border rounded-xl">
                        <div className="flex items-center gap-2 text-foreground">
                          <FileText size={14} className="text-primary" />
                          <span className="truncate max-w-[200px]">{f}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review notes historical feedback */}
              {selectedReq.step_data?.reviewNotes && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-amber-900">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-amber-800 mb-1 flex items-center gap-1">
                    <MessageSquare size={12} /> Verification Notes
                  </h4>
                  <p className="text-xs font-normal leading-relaxed">{selectedReq.step_data.reviewNotes}</p>
                </div>
              )}
            </div>

            {/* Admin Verification footer section */}
            {(profile?.role === "admin" || profile?.role === "team_member") && selectedReq.computedStatus !== "Approved" ? (
              <div className="p-6 border-t border-border bg-accent/20 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Add Review Feedback / Changes Notes</label>
                  <textarea
                    rows={3}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="e.g. Please provide a high-resolution logo and specify the color preference."
                    className="form-input resize-none text-xs"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReviewAction("draft", reviewNotes)}
                    disabled={savingReview}
                    className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    Request Changes
                  </button>
                  <button
                    onClick={() => handleReviewAction("reviewed", reviewNotes)}
                    disabled={savingReview}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    Approve Requirements
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 border-t border-border bg-accent/20 text-center">
                <button
                  onClick={() => { setSelectedReq(null); setReviewNotes(""); }}
                  className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close Review
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
